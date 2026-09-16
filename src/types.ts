export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'generic';
export type MediaFormatType = 'mp4' | 'mp3' | 'wav' | 'm4a';

export interface FormatOption {
  id: string;
  type: MediaFormatType;
  label: string;
  quality: string;
  resolution?: string;
  bitrate?: string;
  extension: string;
  estimatedSize?: string;
  filesizeApproxBytes?: number;
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
  progress: number;
  downloadSpeed?: string;
  eta?: string;
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
  createdAt: number;
  totalDownloads?: number;
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

export interface PresetSample {
  id: string;
  platform: PlatformType;
  title: string;
  url: string;
  thumbnail: string;
  description: string;
}
