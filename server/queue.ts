import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DownloadJob, QueueStats, FormatOption, PlatformType } from './types';
import { processDownload } from './downloader';
import { db } from './db';

type ProgressSubscriber = (job: DownloadJob) => void;

export class JobQueueManager {
  private jobs: Map<string, DownloadJob> = new Map();
  private queue: string[] = []; // Job IDs waiting in queue
  private activeJobs: Set<string> = new Set(); // Job IDs currently being processed
  private subscribers: Map<string, Set<ProgressSubscriber>> = new Map();

  private maxConcurrentWorkers: number = 4;
  private completedTotal: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  public createJob(params: {
    userId?: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    platform: PlatformType;
    format: FormatOption;
  }): DownloadJob {
    const id = crypto.randomUUID();
    const job: DownloadJob = {
      id,
      userId: params.userId,
      url: params.url,
      title: params.title,
      thumbnailUrl: params.thumbnailUrl,
      platform: params.platform,
      format: params.format,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      queuePosition: this.queue.length + 1,
    };

    this.jobs.set(id, job);
    this.queue.push(id);

    // Process next available worker
    this.processNext();
    return job;
  }

  public getJob(id: string): DownloadJob | undefined {
    return this.jobs.get(id);
  }

  public subscribe(jobId: string, callback: ProgressSubscriber): () => void {
    if (!this.subscribers.has(jobId)) {
      this.subscribers.set(jobId, new Set());
    }
    const set = this.subscribers.get(jobId)!;
    set.add(callback);

    // Immediately push current state
    const job = this.jobs.get(jobId);
    if (job) {
      callback(job);
    }

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.subscribers.delete(jobId);
      }
    };
  }

  private notifySubscribers(job: DownloadJob) {
    const subs = this.subscribers.get(job.id);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(job);
        } catch (err) {
          console.error('Subscriber notify error:', err);
        }
      });
    }
  }

  private updateQueuePositions() {
    this.queue.forEach((jobId, index) => {
      const job = this.jobs.get(jobId);
      if (job) {
        job.queuePosition = index + 1;
        this.notifySubscribers(job);
      }
    });
  }

  private async processNext() {
    if (this.activeJobs.size >= this.maxConcurrentWorkers) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    const nextJobId = this.queue.shift();
    if (!nextJobId) return;

    this.updateQueuePositions();

    const job = this.jobs.get(nextJobId);
    if (!job) return;

    this.activeJobs.add(nextJobId);
    job.status = 'processing';
    job.startedAt = Date.now();
    job.queuePosition = 0;
    job.progress = 5;
    this.notifySubscribers(job);

    try {
      const result = await processDownload(job, (progress, speed, eta, downloaded, total) => {
        job.progress = progress;
        if (speed) job.downloadSpeed = speed;
        if (eta) job.eta = eta;
        if (downloaded) job.downloadedBytes = downloaded;
        if (total) job.totalBytes = total;
        if (progress >= 95 && progress < 100) {
          job.status = 'converting';
        }
        this.notifySubscribers(job);
      });

      job.status = 'completed';
      job.progress = 100;
      job.completedAt = Date.now();
      job.fileName = result.fileName;
      job.fileSizeBytes = result.fileSizeBytes;
      job.downloadUrl = `/api/download/file/${job.id}/${encodeURIComponent(result.fileName)}`;
      this.completedTotal++;

      // If user is logged in, save to history
      if (job.userId) {
        try {
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(result.fileSizeBytes) / Math.log(k));
          const formattedSize = `${parseFloat((result.fileSizeBytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;

          db.addHistoryItem({
            userId: job.userId,
            jobId: job.id,
            title: job.title,
            platform: job.platform,
            formatType: job.format.type,
            quality: job.format.quality,
            thumbnailUrl: job.thumbnailUrl,
            originalUrl: job.url,
            fileName: result.fileName,
            fileSizeBytes: result.fileSizeBytes,
            formattedSize,
            downloadUrl: job.downloadUrl,
          });
        } catch (dbErr) {
          console.error('Failed to save to history:', dbErr);
        }
      }

      this.notifySubscribers(job);
    } catch (err: any) {
      console.error(`Job ${job.id} failed:`, err);
      job.status = 'failed';
      job.errorMessage = err.message || 'Download and conversion failed';
      this.notifySubscribers(job);
    } finally {
      this.activeJobs.delete(job.id);
      // Process next in queue
      this.processNext();
    }
  }

  public getStats(): QueueStats {
    const activeList = Array.from(this.activeJobs).map((id) => {
      const j = this.jobs.get(id);
      return {
        id,
        title: j?.title || 'Processing...',
        progress: j?.progress || 0,
        speed: j?.downloadSpeed,
        eta: j?.eta,
        format: `${j?.format.type.toUpperCase()} ${j?.format.quality}`,
        platform: j?.platform || 'generic',
      };
    });

    return {
      activeWorkers: this.activeJobs.size,
      maxWorkers: this.maxConcurrentWorkers,
      queuedJobs: this.queue.length,
      completedJobsTotal: this.completedTotal,
      activeJobs: activeList,
    };
  }

  private startCleanupTimer() {
    const DOWNLOADS_DIR = path.resolve(process.cwd(), 'downloads');
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      try {
        const now = Date.now();
        const maxAge = 25 * 60 * 1000; // 25 minutes

        this.jobs.forEach((job, id) => {
          if (job.status === 'completed' || job.status === 'failed') {
            const age = now - (job.completedAt || job.createdAt);
            if (age > maxAge) {
              const jobDir = path.join(DOWNLOADS_DIR, id);
              if (fs.existsSync(jobDir)) {
                fs.rmSync(jobDir, { recursive: true, force: true });
              }
              this.jobs.delete(id);
            }
          }
        });
      } catch (err) {
        console.error('Job cleanup error:', err);
      }
    }, 5 * 60 * 1000);
  }
}

export const queueManager = new JobQueueManager();
