import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { UpstashQueue } from '../apps/workers/core/queue.js';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import { normalizeDomain } from '../apps/workers/util/domainNormalizer.js';

config();

interface Company {
  companyName: string;
  domain: string;
  tags?: string[];
  priority?: number;
}

interface QueueEntry {
  id: string;
  scan_id: string;
  company_name: string;
  domain: string;
  tags: string[] | null;
  status: string;
  priority: number;
  batch_id: string;
}

interface LoaderOptions {
  batchSize: number;
  delayBetweenBatches: number;
  checkExisting: boolean;
  syncToRedis: boolean;
  batchId?: string;
  priority?: number;
}

class SupabaseBulkLoader {
  private supabase: any;
  private queue: UpstashQueue | null = null;
  private options: LoaderOptions;
  private stats = {
    totalCompanies: 0,
    newlyAdded: 0,
    alreadyExists: 0,
    failed: 0,
    syncedToRedis: 0
  };
  private errors: Array<{ company: Company; error: string }> = [];

  constructor(options: Partial<LoaderOptions> = {}) {
    this.options = {
      batchSize: 10,
      delayBetweenBatches: 2000,
      checkExisting: true,
      syncToRedis: true,
      batchId: `batch-${Date.now()}`,
      priority: 0,
      ...options
    };

    // Initialize Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Initialize Redis queue if sync is enabled
    if (this.options.syncToRedis && process.env.REDIS_URL) {
      this.queue = new UpstashQueue(process.env.REDIS_URL);
    }
  }

  private log(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [supabase-loader]`, message, ...args);
  }

  private async checkExistingEntries(companies: Company[]): Promise<Map<string, boolean>> {
    const existingMap = new Map<string, boolean>();
    
    if (!this.options.checkExisting) {
      return existingMap;
    }

    // Check in batches to avoid query size limits
    const checkBatchSize = 100;
    for (let i = 0; i < companies.length; i += checkBatchSize) {
      const batch = companies.slice(i, i + checkBatchSize);
      const conditions = batch.map(c => ({
        company_name: c.companyName,
        domain: normalizeDomain(c.domain)
      }));

      const { data, error } = await this.supabase
        .from('company_queue')
        .select('company_name, domain')
        .or(conditions.map(c => 
          `and(company_name.eq.${c.company_name},domain.eq.${c.domain})`
        ).join(','));

      if (error) {
        this.log('Error checking existing entries:', error);
        continue;
      }

      if (data) {
        data.forEach((entry: any) => {
          const key = `${entry.company_name}|${entry.domain}`;
          existingMap.set(key, true);
        });
      }
    }

    return existingMap;
  }

  private async addToSupabase(companies: Company[], existingMap: Map<string, boolean>): Promise<QueueEntry[]> {
    const toInsert = [];
    
    for (const company of companies) {
      const normalizedDomain = normalizeDomain(company.domain);
      if (!normalizedDomain) {
        this.errors.push({ company, error: `Invalid domain: ${company.domain}` });
        this.stats.failed++;
        continue;
      }

      const key = `${company.companyName}|${normalizedDomain}`;
      if (existingMap.has(key)) {
        this.log(`⏭️  Skipping existing: ${company.companyName} (${normalizedDomain})`);
        this.stats.alreadyExists++;
        continue;
      }

      toInsert.push({
        scan_id: nanoid(11),
        company_name: company.companyName,
        domain: normalizedDomain,
        tags: company.tags || [],
        status: 'queued',
        priority: company.priority ?? this.options.priority ?? 0,
        batch_id: this.options.batchId,
        queued_at: new Date().toISOString()
      });
    }

    if (toInsert.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('company_queue')
      .insert(toInsert)
      .select();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        this.log('Some entries already exist, retrying individually...');
        const inserted = [];
        
        for (const entry of toInsert) {
          const { data: singleData, error: singleError } = await this.supabase
            .from('company_queue')
            .insert(entry)
            .select()
            .single();
          
          if (singleError) {
            if (singleError.code === '23505') {
              this.stats.alreadyExists++;
              this.log(`⏭️  Already exists: ${entry.company_name}`);
            } else {
              this.stats.failed++;
              this.errors.push({
                company: { companyName: entry.company_name, domain: entry.domain },
                error: singleError.message
              });
            }
          } else if (singleData) {
            inserted.push(singleData);
            this.stats.newlyAdded++;
            this.log(`✅ Added to Supabase: ${entry.company_name} (${entry.scan_id})`);
          }
        }
        
        return inserted;
      } else {
        throw error;
      }
    }

    if (data) {
      this.stats.newlyAdded += data.length;
      data.forEach((entry: QueueEntry) => {
        this.log(`✅ Added to Supabase: ${entry.company_name} (${entry.scan_id})`);
      });
      return data;
    }

    return [];
  }

  private async syncToRedisQueue(entries: QueueEntry[]): Promise<void> {
    if (!this.queue || entries.length === 0) {
      return;
    }

    this.log(`Syncing ${entries.length} entries to Redis queue...`);
    
    for (const entry of entries) {
      try {
        const job = {
          id: entry.scan_id,
          companyName: entry.company_name,
          domain: entry.domain,
          tags: entry.tags || [],
          createdAt: new Date().toISOString()
        };

        await this.queue.addJob(entry.scan_id, job);
        this.stats.syncedToRedis++;
        this.log(`📤 Synced to Redis: ${entry.company_name}`);
      } catch (error) {
        this.log(`Failed to sync ${entry.company_name} to Redis:`, error);
      }
    }
  }

  private async processBatch(companies: Company[], existingMap: Map<string, boolean>): Promise<void> {
    this.log(`Processing batch of ${companies.length} companies...`);
    
    // Add to Supabase
    const addedEntries = await this.addToSupabase(companies, existingMap);
    
    // Optionally sync to Redis
    if (this.options.syncToRedis) {
      await this.syncToRedisQueue(addedEntries);
    }
  }

  async loadFromFile(filePath: string): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const companies: Company[] = JSON.parse(fileContent);
      
      if (!Array.isArray(companies)) {
        throw new Error('Input file must contain a JSON array of companies');
      }
      
      this.log(`Loading ${companies.length} companies from ${filePath}`);
      await this.loadCompanies(companies);
    } catch (error) {
      this.log('Error reading input file:', error);
      throw error;
    }
  }

  async loadCompanies(companies: Company[]): Promise<void> {
    this.stats.totalCompanies = companies.length;
    this.log(`Starting bulk load of ${companies.length} companies`);
    this.log(`Batch ID: ${this.options.batchId}`);
    this.log(`Options: Check existing=${this.options.checkExisting}, Sync to Redis=${this.options.syncToRedis}`);
    
    // First, check all existing entries
    this.log('Checking for existing entries...');
    const existingMap = await this.checkExistingEntries(companies);
    this.log(`Found ${existingMap.size} existing entries`);
    
    // Process in batches
    for (let i = 0; i < companies.length; i += this.options.batchSize) {
      const batch = companies.slice(i, i + this.options.batchSize);
      const batchNumber = Math.floor(i / this.options.batchSize) + 1;
      const totalBatches = Math.ceil(companies.length / this.options.batchSize);
      
      this.log(`\nBatch ${batchNumber}/${totalBatches}`);
      
      await this.processBatch(batch, existingMap);
      
      // Add delay between batches (except for the last batch)
      if (i + this.options.batchSize < companies.length) {
        this.log(`Waiting ${this.options.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
      }
    }
    
    // Final summary
    this.log('\n=== SUPABASE LOAD SUMMARY ===');
    this.log(`Total companies: ${this.stats.totalCompanies}`);
    this.log(`Newly added: ${this.stats.newlyAdded}`);
    this.log(`Already exists: ${this.stats.alreadyExists}`);
    this.log(`Failed: ${this.stats.failed}`);
    if (this.options.syncToRedis) {
      this.log(`Synced to Redis: ${this.stats.syncedToRedis}`);
    }
    this.log(`Batch ID: ${this.options.batchId}`);
    
    if (this.errors.length > 0) {
      this.log('\nErrors:');
      this.errors.forEach(({ company, error }) => {
        this.log(`  - ${company.companyName}: ${error}`);
      });
    }
  }

  async getQueueStatus(): Promise<any> {
    const { data, error } = await this.supabase
      .from('company_queue_stats')
      .select('*');
    
    if (error) {
      this.log('Error fetching queue stats:', error);
      return null;
    }
    
    return data;
  }

  async getBatchStatus(batchId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('company_queue')
      .select('status, count(*)')
      .eq('batch_id', batchId)
      .group('status');
    
    if (error) {
      this.log('Error fetching batch status:', error);
      return null;
    }
    
    return data;
  }

  async syncPendingToRedis(limit: number = 100): Promise<void> {
    if (!this.queue) {
      this.log('Redis queue not initialized');
      return;
    }

    // Get pending entries from Supabase
    const { data, error } = await this.supabase
      .rpc('get_next_company_batch', { batch_size: limit });
    
    if (error) {
      this.log('Error fetching pending entries:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      this.log('No pending entries to sync');
      return;
    }
    
    this.log(`Syncing ${data.length} pending entries to Redis...`);
    await this.syncToRedisQueue(data);
  }
}

// Worker to continuously sync from Supabase to Redis
class SupabaseQueueWorker {
  private loader: SupabaseBulkLoader;
  private interval: NodeJS.Timer | null = null;

  constructor() {
    this.loader = new SupabaseBulkLoader({ syncToRedis: true });
  }

  start(intervalMs: number = 30000): void {
    console.log(`Starting Supabase queue worker (interval: ${intervalMs}ms)`);
    
    // Initial sync
    this.sync();
    
    // Set up interval
    this.interval = setInterval(() => this.sync(), intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('Supabase queue worker stopped');
    }
  }

  private async sync(): Promise<void> {
    try {
      await this.loader.syncPendingToRedis();
    } catch (error) {
      console.error('Error in queue sync:', error);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Usage: npm run supabase-load -- [command] [options]

Commands:
  load <file>           Load companies from JSON file
  sync                  Sync pending entries from Supabase to Redis
  worker                Start continuous sync worker
  status [batch-id]     Check queue or batch status

Options for 'load':
  --batch-size <n>      Number of companies per batch (default: 10)
  --delay <ms>          Delay between batches (default: 2000)
  --no-check-existing   Skip checking for existing entries
  --no-sync-redis       Don't sync to Redis after adding
  --priority <n>        Priority for all entries (default: 0)

Examples:
  npm run supabase-load -- load companies.json
  npm run supabase-load -- load --batch-size 50 --priority 10 companies.json
  npm run supabase-load -- sync
  npm run supabase-load -- worker
  npm run supabase-load -- status batch-123456789
`);
    process.exit(args.length === 0 ? 1 : 0);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'load': {
      const inputFile = args[args.length - 1];
      if (!inputFile || inputFile.startsWith('--')) {
        console.error('Error: Input file required');
        process.exit(1);
      }
      
      const batchSize = args.includes('--batch-size')
        ? parseInt(args[args.indexOf('--batch-size') + 1])
        : 10;
      const delay = args.includes('--delay')
        ? parseInt(args[args.indexOf('--delay') + 1])
        : 2000;
      const checkExisting = !args.includes('--no-check-existing');
      const syncToRedis = !args.includes('--no-sync-redis');
      const priority = args.includes('--priority')
        ? parseInt(args[args.indexOf('--priority') + 1])
        : 0;
      
      const loader = new SupabaseBulkLoader({
        batchSize,
        delayBetweenBatches: delay,
        checkExisting,
        syncToRedis,
        priority
      });
      
      loader.loadFromFile(inputFile)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('Fatal error:', error);
          process.exit(1);
        });
      break;
    }
    
    case 'sync': {
      const loader = new SupabaseBulkLoader({ syncToRedis: true });
      loader.syncPendingToRedis()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('Fatal error:', error);
          process.exit(1);
        });
      break;
    }
    
    case 'worker': {
      const worker = new SupabaseQueueWorker();
      worker.start();
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        worker.stop();
        process.exit(0);
      });
      break;
    }
    
    case 'status': {
      const loader = new SupabaseBulkLoader({ syncToRedis: false });
      const batchId = args[1];
      
      if (batchId) {
        loader.getBatchStatus(batchId).then((status) => {
          console.log('Batch status:', status);
          process.exit(0);
        });
      } else {
        loader.getQueueStatus().then((status) => {
          console.log('Queue status:', status);
          process.exit(0);
        });
      }
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

export { SupabaseBulkLoader, SupabaseQueueWorker, Company, LoaderOptions };