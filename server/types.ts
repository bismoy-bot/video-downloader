export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'generic';

export type MediaFormatType = 'mp4' | 'mp3' | 'wav' | 'm4a';

export interface FormatOption {
  id: string;
  type: MediaFormatType;
  label: string;
  quality: string; // e.g. "1080p", "720p", "320 kbps", "192 kbps"
  resolution?: string; // e.g. "1920x1080"
  bitrate?: string; // e.g. "320k"
  extension: string; // "mp4" | "mp3"
  estimatedSize?: string;
  filesizeApproxBytes?: number;
  formatId?: string; // yt-dlp internal format id if available
  isAudioOnly?: boolean;
}

export interface VideoMetadata {
  url: string;
  originalUrl: string;
  title: string;
  description?: string;
  author: string;
  authorUrl?: string;
  durationSeconds: number;
  durationFormatted: string;
  thumbnailUrl: string;
  platform: PlatformType;
  viewCount?: number;
  availableFormats: FormatOption[];
}

export type JobStatus = 'queued' | 'processing' | 'converting' | 'completed' | 'failed' | 'canceled';

export interface DownloadJob {
  id: string;
  userId?: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  platform: PlatformType;
  format: FormatOption;
  status: JobStatus;
  progress: number; // 0 to 100
  downloadSpeed?: string; // e.g. "3.5 MB/s"
  eta?: string; // e.g. "00:15"
  downloadedBytes?: number;
  totalBytes?: number;
  errorMessage?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  queuePosition?: number;
}

export interface QueueStats {
  activeWorkers: number;
  maxWorkers: number;
  queuedJobs: number;
  completedJobsTotal: number;
  activeJobs: Array<{
    id: string;
    title: string;
    progress: number;
    speed?: string;
    eta?: string;
    format: string;
    platform: PlatformType;
  }>;
}

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface DownloadHistoryItem {
  id: string;
  userId: string;
  jobId: string;
  title: string;
  platform: PlatformType;
  formatType: MediaFormatType;
  quality: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  formattedSize: string;
  downloadUrl?: string;
  timestamp: number;
}
