import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Clock,
  Gauge,
  Play,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { DownloadJob } from '../types';

interface ActiveDownloadCardProps {
  job: DownloadJob;
  onPreview: (job: DownloadJob) => void;
  onReset: () => void;
}

export const ActiveDownloadCard: React.FC<ActiveDownloadCardProps> = ({
  job,
  onPreview,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isQueued = job.status === 'queued';
  const isConverting = job.status === 'converting';

  const handleCopyLink = () => {
    if (job.downloadUrl) {
      const fullUrl = `${window.location.origin}${job.downloadUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready to Download
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-500/20">
          <AlertTriangle className="h-3.5 w-3.5" />
          Download Failed
        </span>
      );
    }
    if (isQueued) {
      return (
        <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-500/20 animate-pulse">
          <Clock className="h-3.5 w-3.5" />
          Queued #{job.queuePosition || 1}
        </span>
      );
    }
    if (isConverting) {
      return (
        <span className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-indigo-500/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          FFmpeg Encoding...
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-violet-500/20">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Processing Stream...
      </span>
    );
  };

  return (
    <div
      id="active-download-card"
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            {job.thumbnailUrl ? (
              <img
                src={job.thumbnailUrl}
                alt={job.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600">
                <Download className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span className="font-semibold text-violet-400 uppercase">
                {job.format.type.toUpperCase()} • {job.format.quality}
              </span>
              <span>•</span>
              <span className="uppercase text-zinc-500">{job.platform}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Progress Bar & Real-time Metrics */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-300">
            {isCompleted
              ? 'Processing Complete'
              : isQueued
              ? `Waiting for worker slot (Queue position #${job.queuePosition || 1})`
              : isConverting
              ? 'Muxing audio/video streams with FFmpeg'
              : 'Downloading media payload'}
          </span>
          <span className="font-mono font-bold text-sm text-white">
            {Math.round(job.progress)}%
          </span>
        </div>

        {/* Real-Time Animated Progress Bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-950 p-0.5 border border-zinc-800">
          <div
            id="realtime-progress-bar-fill"
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30'
                : isFailed
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400 shadow-md shadow-violet-500/30'
            }`}
            style={{ width: `${Math.max(3, Math.min(100, job.progress))}%` }}
          />
        </div>

        {/* Status Metrics: Speed & Estimated Time (ETA) */}
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-zinc-500" />
            <span>Speed: {job.downloadSpeed || 'Calculating...'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              {isCompleted
                ? 'Finished in 00:00'
                : `Estimated Completion: ${job.eta || 'Calculating...'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Processing Pipeline Stages */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center text-[10px] font-medium">
        <div
          className={`rounded-lg p-2 border transition ${
            job.progress >= 5
              ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
              : 'border-zinc-800/80 bg-zinc-950 text-zinc-600'
          }`}
        >
          1. Queued
        </div>
        <div
          className={`rounded-lg p-2 border transition ${
            job.progress >= 20
              ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
              : 'border-zinc-800/80 bg-zinc-950 text-zinc-600'
          }`}
        >
          2. Stream Extracted
        </div>
        <div
          className={`rounded-lg p-2 border transition ${
            job.progress >= 85
              ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
              : 'border-zinc-800/80 bg-zinc-950 text-zinc-600'
          }`}
        >
          3. FFmpeg Transcode
        </div>
        <div
          className={`rounded-lg p-2 border transition ${
            isCompleted
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-zinc-800/80 bg-zinc-950 text-zinc-600'
          }`}
        >
          4. Ready to Save
        </div>
      </div>

      {/* Final Actions when Complete */}
      {isCompleted && job.downloadUrl && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {job.fileName || 'media_file'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Ready for instant download • High-speed cloud delivery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="preview-downloaded-btn"
                type="button"
                onClick={() => onPreview(job)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-violet-400" />
                <span>In-App Preview</span>
              </button>

              <button
                id="copy-download-link-btn"
                type="button"
                onClick={handleCopyLink}
                title="Copy Direct Link"
                className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>

              <a
                id="trigger-file-download-btn"
                href={job.downloadUrl}
                download={job.fileName}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Save File</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {isFailed && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300 mb-4">
          <p className="font-semibold mb-1">Download Error</p>
          <p className="text-zinc-400">{job.errorMessage || 'An error occurred during extraction.'}</p>
          <button
            onClick={onReset}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600/20 border border-red-500/30 px-3 py-1.5 text-red-200 hover:bg-red-600/30 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Another Link</span>
          </button>
        </div>
      )}

      {/* Reset button to download another video */}
      <div className="mt-4 flex justify-end">
        <button
          id="download-another-btn"
          type="button"
          onClick={onReset}
          className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Download another video</span>
        </button>
      </div>
    </div>
  );
};
