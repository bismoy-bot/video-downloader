import React from 'react';
import { X, Cpu, Server, Activity, Users, CheckCircle, Clock } from 'lucide-react';
import { QueueStats } from '../types';

interface QueueMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: QueueStats | null;
}

export const QueueMonitorModal: React.FC<QueueMonitorModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="queue-monitor-dialog"
        className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
      >
        <button
          id="queue-monitor-close-btn"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/20">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Concurrency & Queue Engine
            </h2>
            <p className="text-xs text-zinc-400">
              High-throughput asynchronous request scheduler for production traffic
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 text-center">
            <div className="flex items-center justify-center text-violet-400 mb-1">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {stats ? `${stats.activeWorkers}/${stats.maxWorkers}` : '4/4'}
            </div>
            <div className="text-[11px] text-zinc-400">Active Workers</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 text-center">
            <div className="flex items-center justify-center text-amber-400 mb-1">
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {stats?.queuedJobs || 0}
            </div>
            <div className="text-[11px] text-zinc-400">Waiting in Queue</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 text-center">
            <div className="flex items-center justify-center text-emerald-400 mb-1">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300">
              {stats?.completedJobsTotal || 0}
            </div>
            <div className="text-[11px] text-zinc-400">Total Completed</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 text-center">
            <div className="flex items-center justify-center text-blue-400 mb-1">
              <Activity className="h-4 w-4" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-300">100%</div>
            <div className="text-[11px] text-zinc-400">Worker Health</div>
          </div>
        </div>

        {/* Worker Pool Visualizer */}
        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
            <span className="font-semibold text-zinc-300">Worker Pool Allocation</span>
            <span>Max Concurrency: {stats?.maxWorkers || 4} parallel jobs</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: stats?.maxWorkers || 4 }).map((_, idx) => {
              const isBusy = (stats?.activeWorkers || 0) > idx;
              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-2.5 text-center transition ${
                    isBusy
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                      : 'border-zinc-800/80 bg-zinc-900/50 text-zinc-500'
                  }`}
                >
                  <div className="text-[10px] font-mono mb-1">Worker #{idx + 1}</div>
                  <div className="text-xs font-semibold">
                    {isBusy ? '● BUSY' : 'IDLE'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Jobs List */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Active Processing Pipeline
          </h3>
          {stats && stats.activeJobs && stats.activeJobs.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {stats.activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-medium text-white truncate max-w-[260px]">
                      {job.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                      <span className="text-violet-400">{job.format}</span>
                      {job.speed && <span>• {job.speed}</span>}
                      {job.eta && <span>• ETA {job.eta}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-violet-400">
                      {Math.round(job.progress)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
              No concurrent downloads in flight right now. Workers ready for incoming requests.
            </div>
          )}
        </div>

        {/* Architectural Information */}
        <div className="rounded-lg bg-zinc-950/60 p-3 text-[11px] text-zinc-400 border border-zinc-800/60">
          <p className="leading-relaxed">
            <strong className="text-zinc-200">How Multiple Request Handling Works:</strong> When multiple users submit requests simultaneously, incoming downloads are throttled into a fair FIFO queue with dedicated worker pools. This guarantees the server will not run out of memory or crash even during sudden traffic spikes.
          </p>
        </div>
      </div>
    </div>
  );
};
