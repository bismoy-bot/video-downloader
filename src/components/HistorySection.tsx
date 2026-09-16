import React, { useState } from 'react';
import { History, Trash2, Download, Play, Music, Video, User, Sparkles, Filter } from 'lucide-react';
import { DownloadHistoryItem, User as UserType } from '../types';

interface HistorySectionProps {
  history: DownloadHistoryItem[];
  user: UserType | null;
  onOpenAuth: () => void;
  onPreview: (item: DownloadHistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  user,
  onOpenAuth,
  onPreview,
  onDelete,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio'>('all');

  const filteredHistory = history.filter((item) => {
    if (filter === 'video') return item.formatType === 'mp4';
    if (filter === 'audio') return item.formatType === 'mp3' || item.formatType === 'm4a';
    return true;
  });

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      id="user-history-container"
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/20">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Download History
            </h3>
            <p className="text-xs text-zinc-400">
              {user
                ? `Logged in as ${user.username} • Saved to your account`
                : 'Sign in to sync and save your downloads permanently'}
            </p>
          </div>
        </div>

        {user && history.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
              <button
                id="filter-history-all"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({history.length})
              </button>
              <button
                id="filter-history-video"
                onClick={() => setFilter('video')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  filter === 'video' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Videos
              </button>
              <button
                id="filter-history-audio"
                onClick={() => setFilter('audio')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  filter === 'audio' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Audio
              </button>
            </div>

            <button
              id="clear-all-history-btn"
              onClick={onClearAll}
              title="Clear history"
              className="flex items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-red-500/40 hover:text-red-400 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Guest Mode Notice */}
      {!user && (
        <div className="mb-5 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 p-4 text-xs text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-white">Guest Mode Active</div>
              <div className="text-zinc-400 mt-0.5">
                Create an account or sign in to permanently store your download history across devices.
              </div>
            </div>
          </div>
          <button
            id="history-guest-login-btn"
            onClick={onOpenAuth}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition cursor-pointer"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In / Sign Up</span>
          </button>
        </div>
      )}

      {/* History Items List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {filteredHistory.map((item) => {
            const isAudio = item.formatType === 'mp3' || item.formatType === 'm4a';
            return (
              <div
                key={item.id}
                id={`history-row-${item.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 hover:border-zinc-700 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        {isAudio ? <Music className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-medium text-white text-xs sm:text-sm truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="font-semibold text-violet-400 uppercase">
                        {item.formatType.toUpperCase()} {item.quality}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-500">{item.formattedSize}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id={`preview-history-${item.id}`}
                    onClick={() => onPreview(item)}
                    title="Preview in App"
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:border-violet-500 hover:text-white transition cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 text-violet-400" />
                  </button>

                  {item.downloadUrl && (
                    <a
                      id={`save-history-${item.id}`}
                      href={item.downloadUrl}
                      download={item.fileName}
                      title="Download file"
                      className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:border-emerald-500 hover:text-white transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                    </a>
                  )}

                  {user && (
                    <button
                      id={`delete-history-${item.id}`}
                      onClick={() => onDelete(item.id)}
                      title="Delete from history"
                      className="rounded-lg p-2 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
          <History className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
          <p className="font-medium text-zinc-400">No downloads in history yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Analyze and download a video to see it tracked here.
          </p>
        </div>
      )}
    </div>
  );
};
