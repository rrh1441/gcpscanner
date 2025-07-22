import { config } from 'dotenv';
import { UpstashQueue } from '../apps/workers/core/queue.js';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import { normalizeDomain } from '../apps/workers/util/domainNormalizer.js';
import { createClient } from '@supabase/supabase-js';

config();

interface Company {
  companyName: string;
  domain: string;
  tags?: string[];
}

interface BulkLoaderOptions {
  batchSize: number;        // Number of companies to process at once
  delayBetweenBatches: number; // Delay in ms between batches
  stopOnError: boolean;     // Whether to stop completely on first error
  inputFile?: string;       // Path to JSON file with companies
  supabaseTable?: string;   // Optional: track in a Supabase table
}

class BulkCompanyLoader {
  private queue: UpstashQueue;
  private supabase: any;
  private options: BulkLoaderOptions;
  private processedCount: number = 0;
  private failedCount: number = 0;
  private errors: Array<{ company: Company; error: string }> = [];

  constructor(options: BulkLoaderOptions) {
    this.options = {
      batchSize: 10,
      delayBetweenBatches: 2000,
      stopOnError: true,
      ...options
    };

    // Initialize queue
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is required');
    }
    this.queue = new UpstashQueue(process.env.REDIS_URL);

    // Initialize Supabase if URL and key are provided
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
  }

  private log(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [bulk-loader]`, message, ...args);
  }

  private async addToQueue(company: Company): Promise<void> {
    const scanId = nanoid(11);
    const normalizedDomain = normalizeDomain(company.domain);
    
    if (!normalizedDomain) {
      throw new Error(`Invalid domain: ${company.domain}`);
    }

    const job = {
      id: scanId,
      companyName: company.companyName,
      domain: normalizedDomain,
      tags: company.tags || [],
      createdAt: new Date().toISOString()
    };

    await this.queue.addJob(scanId, job);
    
    // Optionally track in Supabase
    if (this.supabase && this.options.supabaseTable) {
      await this.supabase
        .from(this.options.supabaseTable)
        .insert({
          scan_id: scanId,
          company_name: company.companyName,
          domain: normalizedDomain,
          status: 'queued',
          tags: company.tags,
          queued_at: new Date().toISOString()
        });
    }
  }

  private async processBatch(companies: Company[]): Promise<boolean> {
    this.log(`Processing batch of ${companies.length} companies...`);
    
    for (const company of companies) {
      try {
        await this.addToQueue(company);
        this.processedCount++;
        this.log(`✅ Queued: ${company.companyName} (${company.domain})`);
      } catch (error) {
        this.failedCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.errors.push({ company, error: errorMessage });
        this.log(`❌ Failed: ${company.companyName} - ${errorMessage}`);
        
        if (this.options.stopOnError) {
          this.log('Stopping due to error (stopOnError=true)');
          return false;
        }
      }
    }
    
    return true;
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
    this.log(`Starting bulk load of ${companies.length} companies`);
    this.log(`Batch size: ${this.options.batchSize}, Delay: ${this.options.delayBetweenBatches}ms`);
    
    // Check queue health first
    try {
      const queueDepth = await this.queue.redis.llen('scan.jobs');
      this.log(`Current queue depth: ${queueDepth}`);
    } catch (error) {
      this.log('Warning: Could not check queue depth:', error);
    }
    
    // Process in batches
    for (let i = 0; i < companies.length; i += this.options.batchSize) {
      const batch = companies.slice(i, i + this.options.batchSize);
      const batchNumber = Math.floor(i / this.options.batchSize) + 1;
      const totalBatches = Math.ceil(companies.length / this.options.batchSize);
      
      this.log(`\nBatch ${batchNumber}/${totalBatches}`);
      
      const success = await this.processBatch(batch);
      if (!success && this.options.stopOnError) {
        break;
      }
      
      // Add delay between batches (except for the last batch)
      if (i + this.options.batchSize < companies.length) {
        this.log(`Waiting ${this.options.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
      }
    }
    
    // Final summary
    this.log('\n=== BULK LOAD SUMMARY ===');
    this.log(`Total companies: ${companies.length}`);
    this.log(`Successfully queued: ${this.processedCount}`);
    this.log(`Failed: ${this.failedCount}`);
    
    if (this.errors.length > 0) {
      this.log('\nErrors:');
      this.errors.forEach(({ company, error }) => {
        this.log(`  - ${company.companyName}: ${error}`);
      });
    }
  }

  async getQueueStatus(): Promise<{ depth: number; processing: number }> {
    const depth = await this.queue.redis.llen('scan.jobs') || 0;
    const processingKeys = await this.queue.redis.keys('processing:*');
    let processing = 0;
    
    for (const key of processingKeys) {
      const jobs = await this.queue.redis.llen(key);
      processing += jobs || 0;
    }
    
    return { depth, processing };
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: npm run bulk-load -- [options] <input-file>

Options:
  --batch-size <n>      Number of companies to process at once (default: 10)
  --delay <ms>          Delay between batches in milliseconds (default: 2000)
  --no-stop-on-error    Continue processing even if errors occur
  --supabase-table <t>  Track queue entries in Supabase table

Example:
  npm run bulk-load -- --batch-size 5 --delay 3000 companies.json
  
Input file format (JSON):
[
  {
    "companyName": "Example Corp",
    "domain": "example.com",
    "tags": ["financial", "enterprise"]
  },
  ...
]
`);
    process.exit(1);
  }
  
  // Parse CLI arguments
  const inputFile = args[args.length - 1];
  const batchSize = args.includes('--batch-size') 
    ? parseInt(args[args.indexOf('--batch-size') + 1]) 
    : 10;
  const delay = args.includes('--delay')
    ? parseInt(args[args.indexOf('--delay') + 1])
    : 2000;
  const stopOnError = !args.includes('--no-stop-on-error');
  const supabaseTable = args.includes('--supabase-table')
    ? args[args.indexOf('--supabase-table') + 1]
    : undefined;
  
  const loader = new BulkCompanyLoader({
    batchSize,
    delayBetweenBatches: delay,
    stopOnError,
    supabaseTable
  });
  
  loader.loadFromFile(inputFile)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { BulkCompanyLoader, Company, BulkLoaderOptions };