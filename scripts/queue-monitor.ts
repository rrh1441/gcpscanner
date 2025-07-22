import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { UpstashQueue } from '../apps/workers/core/queue.js';

config();

interface QueueStats {
  status: string;
  count: number;
  oldest_queued: string | null;
  newest_queued: string | null;
  avg_processing_time_seconds: number | null;
}

interface CompanyQueueEntry {
  id: string;
  scan_id: string;
  company_name: string;
  domain: string;
  status: string;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
}

class QueueMonitor {
  private supabase: any;
  private queue: UpstashQueue | null = null;

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    if (process.env.REDIS_URL) {
      this.queue = new UpstashQueue(process.env.REDIS_URL);
    }
  }

  private formatDuration(seconds: number | null): string {
    if (seconds === null) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  private formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  }

  async getQueueStats(): Promise<QueueStats[]> {
    const { data, error } = await this.supabase
      .from('company_queue_stats')
      .select('*');
    
    if (error) {
      console.error('Error fetching queue stats:', error);
      return [];
    }
    
    return data || [];
  }

  async getRedisQueueDepth(): Promise<number> {
    if (!this.queue) return 0;
    
    try {
      const depth = await this.queue.redis.llen('scan.jobs') || 0;
      return depth;
    } catch (error) {
      console.error('Error fetching Redis queue depth:', error);
      return 0;
    }
  }

  async getRecentEntries(limit: number = 10): Promise<CompanyQueueEntry[]> {
    const { data, error } = await this.supabase
      .from('company_queue')
      .select('*')
      .order('queued_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent entries:', error);
      return [];
    }
    
    return data || [];
  }

  async getFailedEntries(limit: number = 10): Promise<CompanyQueueEntry[]> {
    const { data, error } = await this.supabase
      .from('company_queue')
      .select('*')
      .eq('status', 'failed')
      .order('completed_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching failed entries:', error);
      return [];
    }
    
    return data || [];
  }

  async getProcessingEntries(): Promise<CompanyQueueEntry[]> {
    const { data, error } = await this.supabase
      .from('company_queue')
      .select('*')
      .eq('status', 'processing')
      .order('started_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching processing entries:', error);
      return [];
    }
    
    return data || [];
  }

  async getBatchStats(batchId: string): Promise<QueueStats[]> {
    const { data, error } = await this.supabase
      .from('company_queue')
      .select('status')
      .eq('batch_id', batchId);
    
    if (error) {
      console.error('Error fetching batch stats:', error);
      return [];
    }
    
    // Group by status
    const statusCounts = (data || []).reduce((acc: Record<string, number>, entry: any) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      oldest_queued: null,
      newest_queued: null,
      avg_processing_time_seconds: null
    }));
  }

  async displayDashboard(continuous: boolean = false): Promise<void> {
    const interval = continuous ? 30000 : 0; // Refresh every 30 seconds if continuous
    
    do {
      console.clear();
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('                    SCANNER QUEUE DASHBOARD                         ');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(`Last Updated: ${new Date().toLocaleString()}`);
      console.log();
      
      // Supabase Queue Stats
      const stats = await this.getQueueStats();
      console.log('📊 SUPABASE QUEUE STATISTICS:');
      console.log('┌─────────────┬───────┬─────────────────────┬─────────────────────┬──────────────┐');
      console.log('│ Status      │ Count │ Oldest Queued       │ Newest Queued       │ Avg Time     │');
      console.log('├─────────────┼───────┼─────────────────────┼─────────────────────┼──────────────┤');
      
      for (const stat of stats) {
        const statusEmoji = {
          'queued': '⏳',
          'processing': '🔄',
          'completed': '✅',
          'failed': '❌'
        }[stat.status] || '❓';
        
        console.log(
          `│ ${statusEmoji} ${stat.status.padEnd(9)} │ ${stat.count.toString().padStart(5)} │ ${
            this.formatDate(stat.oldest_queued).padEnd(19)
          } │ ${
            this.formatDate(stat.newest_queued).padEnd(19)
          } │ ${
            this.formatDuration(stat.avg_processing_time_seconds).padEnd(12)
          } │`
        );
      }
      console.log('└─────────────┴───────┴─────────────────────┴─────────────────────┴──────────────┘');
      
      // Redis Queue Depth
      const redisDepth = await this.getRedisQueueDepth();
      console.log(`\n📤 REDIS QUEUE DEPTH: ${redisDepth} jobs`);
      
      // Currently Processing
      const processing = await this.getProcessingEntries();
      if (processing.length > 0) {
        console.log('\n🔄 CURRENTLY PROCESSING:');
        console.log('┌──────────────────────────┬──────────────────────┬────────────────┐');
        console.log('│ Company                  │ Domain               │ Duration       │');
        console.log('├──────────────────────────┼──────────────────────┼────────────────┤');
        
        for (const entry of processing) {
          const duration = entry.started_at 
            ? Math.floor((Date.now() - new Date(entry.started_at).getTime()) / 1000)
            : 0;
          
          console.log(
            `│ ${entry.company_name.slice(0, 24).padEnd(24)} │ ${
              entry.domain.slice(0, 20).padEnd(20)
            } │ ${this.formatDuration(duration).padEnd(14)} │`
          );
        }
        console.log('└──────────────────────────┴──────────────────────┴────────────────┘');
      }
      
      // Recent Failures
      const failed = await this.getFailedEntries(5);
      if (failed.length > 0) {
        console.log('\n❌ RECENT FAILURES:');
        console.log('┌──────────────────────────┬──────────────────────┬──────────────────────────────┐');
        console.log('│ Company                  │ Domain               │ Error                        │');
        console.log('├──────────────────────────┼──────────────────────┼──────────────────────────────┤');
        
        for (const entry of failed) {
          const error = entry.error_message || 'Unknown error';
          console.log(
            `│ ${entry.company_name.slice(0, 24).padEnd(24)} │ ${
              entry.domain.slice(0, 20).padEnd(20)
            } │ ${error.slice(0, 28).padEnd(28)} │`
          );
        }
        console.log('└──────────────────────────┴──────────────────────┴──────────────────────────────┘');
      }
      
      // Recent Queue Additions
      const recent = await this.getRecentEntries(5);
      if (recent.length > 0) {
        console.log('\n📥 RECENTLY QUEUED:');
        console.log('┌──────────────────────────┬──────────────────────┬─────────────────────┐');
        console.log('│ Company                  │ Domain               │ Queued At           │');
        console.log('├──────────────────────────┼──────────────────────┼─────────────────────┤');
        
        for (const entry of recent) {
          console.log(
            `│ ${entry.company_name.slice(0, 24).padEnd(24)} │ ${
              entry.domain.slice(0, 20).padEnd(20)
            } │ ${this.formatDate(entry.queued_at).padEnd(19)} │`
          );
        }
        console.log('└──────────────────────────┴──────────────────────┴─────────────────────┘');
      }
      
      if (continuous) {
        console.log(`\n🔄 Refreshing in ${interval / 1000} seconds... (Press Ctrl+C to exit)`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } while (continuous);
  }

  async checkDuplicates(): Promise<void> {
    const { data, error } = await this.supabase
      .from('company_queue')
      .select('company_name, domain, count(*)')
      .group('company_name, domain')
      .having('count(*) > 1');
    
    if (error) {
      console.error('Error checking duplicates:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('✅ No duplicate entries found in the queue');
      return;
    }
    
    console.log('⚠️  DUPLICATE ENTRIES FOUND:');
    console.log('┌──────────────────────────┬──────────────────────┬───────┐');
    console.log('│ Company                  │ Domain               │ Count │');
    console.log('├──────────────────────────┼──────────────────────┼───────┤');
    
    for (const dup of data) {
      console.log(
        `│ ${dup.company_name.slice(0, 24).padEnd(24)} │ ${
          dup.domain.slice(0, 20).padEnd(20)
        } │ ${dup.count.toString().padStart(5)} │`
      );
    }
    console.log('└──────────────────────────┴──────────────────────┴───────┘');
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const monitor = new QueueMonitor();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm run queue-monitor -- [options]

Options:
  --continuous, -c     Refresh dashboard every 30 seconds
  --batch <id>         Show stats for specific batch
  --check-duplicates   Check for duplicate entries

Examples:
  npm run queue-monitor                    # Show dashboard once
  npm run queue-monitor -- -c              # Continuous monitoring
  npm run queue-monitor -- --batch batch-123456789
  npm run queue-monitor -- --check-duplicates
`);
    process.exit(0);
  }
  
  if (args.includes('--check-duplicates')) {
    monitor.checkDuplicates()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else if (args.includes('--batch')) {
    const batchId = args[args.indexOf('--batch') + 1];
    if (!batchId) {
      console.error('Batch ID required');
      process.exit(1);
    }
    
    monitor.getBatchStats(batchId)
      .then((stats) => {
        console.log(`Stats for batch ${batchId}:`, stats);
        process.exit(0);
      })
      .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    const continuous = args.includes('--continuous') || args.includes('-c');
    monitor.displayDashboard(continuous)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
  }
}

export { QueueMonitor };