import React from 'react';
import { DownloadCloud, Activity, User, LogOut, History, Shield } from 'lucide-react';
import { User as UserType, QueueStats } from '../types';

interface NavbarProps {
  user: UserType | null;
  queueStats: QueueStats | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenQueue: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  queueStats,
  onOpenAuth,
  onLogout,
  onOpenQueue,
  onToggleHistory,
  showHistory,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/25">
            <DownloadCloud className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white font-['Outfit']">
                Omni<span className="text-violet-400">Downloader</span>
              </span>
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400 border border-violet-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              YouTube • Reels • TikTok • Instagram • MP4 & MP3
            </p>
          </div>
        </div>

        {/* Right Actions: Queue Monitor & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Concurrency & Queue Health Pill */}
          <button
            id="queue-monitor-trigger-btn"
            onClick={onOpenQueue}
            title="Multi-request Concurrency & Queue Status"
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 hover:text-white transition cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  queueStats && queueStats.activeWorkers > 0 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  queueStats && queueStats.activeWorkers > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-mono text-zinc-200 hidden md:inline">
              {queueStats ? `${queueStats.activeWorkers}/${queueStats.maxWorkers} Workers` : 'Workers Online'}
            </span>
            {queueStats && queueStats.queuedJobs > 0 && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                +{queueStats.queuedJobs} queued
              </span>
            )}
          </button>

          {/* History Toggle Button */}
          <button
            id="history-toggle-btn"
            onClick={onToggleHistory}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              showHistory
                ? 'bg-violet-600 text-white'
                : 'border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">History</span>
            {user && historyCount > 0 && (
              <span className="rounded-full bg-violet-400/20 px-1.5 py-0.2 text-[10px] text-violet-300 font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white uppercase">
                  {user.username.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-medium text-zinc-200 leading-tight">{user.username}</div>
                  <div className="text-[10px] text-zinc-500 leading-tight">{user.email}</div>
                </div>
              </div>
              <button
                id="user-logout-btn"
                onClick={onLogout}
                title="Log Out"
                className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-red-400 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="user-auth-trigger-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 transition cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
