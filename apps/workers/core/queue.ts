import { Redis } from '@upstash/redis';

export interface ScanJob {
  id: string;
  companyName: string;
  domain: string;
  tags?: string[];
  createdAt: string;
}

export interface JobStatus {
  id: string;
  state: 'queued' | 'processing' | 'done' | 'failed';
  updated: number;
  message?: string;
  resultUrl?: string;
  error?: string;
}

export class UpstashQueue {
  redis: Redis;
  private workerId: string;
  private processingList: string;

  constructor(url: string) {
    // Parse the Redis URL to extract token and URL for Upstash
    if (url.includes('@')) {
      // Format: redis://username:token@host:port
      const urlObj = new URL(url);
      const token = urlObj.password;
      const restUrl = `https://${urlObj.hostname}`;
      
      this.redis = new Redis({
        url: restUrl,
        token: token
      });
    } else {
      // Fallback to environment variables
      this.redis = Redis.fromEnv();
    }
    
    // Generate unique worker ID for processing list
    this.workerId = process.env.FLY_MACHINE_ID || `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.processingList = `processing:${this.workerId}`;
    
    console.log(`[queue] Worker initialized with ID: ${this.workerId}`);
  }

  async addJob(id: string, job: any): Promise<void> {
    await this.redis.lpush('scan.jobs', JSON.stringify({ ...job, id }));
    await this.redis.hset(`job:${id}`, {
      state: 'queued',
      updated: Date.now().toString(),
      message: 'Scan queued and waiting for processing'
    });
    console.log('[queue] enqueued', id);
  }

  async getNextJob(): Promise<ScanJob | null> {
    try {
      // Use RPOP as fallback since RPOPLPUSH is not available in Upstash Redis
      // This is less failure-resistant but allows the system to work
      const jobData = await this.redis.rpop('scan.jobs');
      if (!jobData) {
        return null;
      }
      
      console.log('[queue] Raw job data from Redis:', jobData, 'Type:', typeof jobData);
      
      // Handle different data types from Redis
      let jobString: string;
      if (typeof jobData === 'string') {
        jobString = jobData;
      } else if (typeof jobData === 'object') {
        jobString = JSON.stringify(jobData);
      } else {
        jobString = String(jobData);
      }
      
      console.log('[queue] Job string to parse:', jobString);
      
      // Additional safety check - if it doesn't look like JSON, skip it
      if (!jobString.trim().startsWith('{') && !jobString.trim().startsWith('[')) {
        console.log('[queue] Invalid job data format, removing from processing list:', jobString);
        await this.redis.lrem(this.processingList, 1, jobData);
        return null;
      }
      
      const job = JSON.parse(jobString) as ScanJob;
      console.log('[queue] Parsed job:', job);
      
      // Update job status to processing
      await this.updateStatus(job.id, 'processing', 'Job picked up by worker');
      
      console.log(`[queue] Job ${job.id} successfully retrieved by worker ${this.workerId}`);
      return job;
    } catch (error) {
      console.error('[queue] Error in getNextJob:', error);
      console.error('[queue] Failed to parse job data, skipping...');
      return null;
    }
  }

  async completeJob(jobId: string): Promise<void> {
    try {
      // Remove job from processing list when completed successfully
      const job = await this.redis.lrange(this.processingList, 0, -1);
      for (const jobData of job) {
        try {
          const parsedJob = JSON.parse(jobData as string);
          if (parsedJob.id === jobId) {
            await this.redis.lrem(this.processingList, 1, jobData);
            console.log(`[queue] Job ${jobId} removed from processing list after completion`);
            break;
          }
        } catch (e) {
          // Skip malformed jobs
          continue;
        }
      }
      
      await this.updateStatus(jobId, 'done', 'Scan completed successfully');
    } catch (error) {
      console.error(`[queue] Error completing job ${jobId}:`, error);
    }
  }

  async failJob(jobId: string, error: string): Promise<void> {
    try {
      // Remove job from processing list when failed
      const jobs = await this.redis.lrange(this.processingList, 0, -1);
      for (const jobData of jobs) {
        try {
          const parsedJob = JSON.parse(jobData as string);
          if (parsedJob.id === jobId) {
            await this.redis.lrem(this.processingList, 1, jobData);
            console.log(`[queue] Job ${jobId} removed from processing list after failure`);
            break;
          }
        } catch (e) {
          // Skip malformed jobs
          continue;
        }
      }
      
      await this.updateStatus(jobId, 'failed', `Scan failed: ${error}`);
    } catch (error) {
      console.error(`[queue] Error failing job ${jobId}:`, error);
    }
  }

  async cleanupStaleJobs(): Promise<void> {
    try {
      // Clean up jobs that have been in processing lists for too long (>30 minutes)
      const STALE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();
      
      // Get all processing lists
      const keys = await this.redis.keys('processing:*');
      let reclaimedCount = 0;
      
      for (const key of keys) {
        const jobs = await this.redis.lrange(key, 0, -1);
        
        for (const jobData of jobs) {
          try {
            const job = JSON.parse(jobData as string);
            const jobAge = now - new Date(job.createdAt).getTime();
            
            if (jobAge > STALE_TIMEOUT) {
              // Move stale job back to main queue
              await this.redis.lpush('scan.jobs', jobData);
              await this.redis.lrem(key, 1, jobData);
              await this.updateStatus(job.id, 'queued', 'Job reclaimed from stale worker');
              reclaimedCount++;
              console.log(`[queue] Reclaimed stale job ${job.id} from ${key}`);
            }
          } catch (e) {
            // Remove malformed jobs from processing lists
            await this.redis.lrem(key, 1, jobData);
            console.log(`[queue] Removed malformed job from ${key}`);
          }
        }
      }
      
      if (reclaimedCount > 0) {
        console.log(`[queue] Cleanup completed: ${reclaimedCount} stale jobs reclaimed`);
      }
    } catch (error) {
      console.error('[queue] Error during stale job cleanup:', error);
    }
  }

  async updateStatus(id: string, state: JobStatus['state'], message?: string, resultUrl?: string): Promise<void> {
    const statusUpdate: Record<string, string> = {
      state,
      updated: Date.now().toString()
    };

    if (message) statusUpdate.message = message;
    if (resultUrl) statusUpdate.resultUrl = resultUrl;

    await this.redis.hset(`job:${id}`, statusUpdate);
    console.log(`[queue] Updated job ${id} status: ${state}${message ? ` - ${message}` : ''}`);
  }

  async getStatus(id: string): Promise<JobStatus | null> {
    const obj = await this.redis.hgetall(`job:${id}`);
    if (!obj || Object.keys(obj).length === 0) return null;
    return obj as unknown as JobStatus;
  }

  // Legacy methods for backwards compatibility
  async nextJob(blockMs = 5000): Promise<[string, ScanJob] | null> {
    const job = await this.getNextJob();
    if (!job) return null;
    return [job.id, job];
  }

  async setStatus(id: string, state: JobStatus['state'], extra: Record<string, any> = {}) {
    await this.redis.hset(`job:${id}`, {
      state,
      updated: Date.now().toString(),
      ...extra
    });
  }
} 