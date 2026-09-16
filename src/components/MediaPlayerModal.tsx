import React from 'react';
import { X, Play, Volume2, Download } from 'lucide-react';

interface MediaPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mediaUrl: string;
  isAudio: boolean;
  fileName?: string;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  isOpen,
  onClose,
  title,
  mediaUrl,
  isAudio,
  fileName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="media-player-dialog"
        className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
      >
        <button
          id="media-player-close-btn"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
            {isAudio ? <Volume2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
            <p className="text-[11px] text-zinc-400">In-App Media Player Preview</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black flex items-center justify-center min-h-[220px]">
          {isAudio ? (
            <div className="p-8 w-full flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/20 animate-pulse">
                <Volume2 className="h-8 w-8" />
              </div>
              <p className="text-xs text-zinc-400 mb-4 font-mono">{fileName || 'Audio Track'}</p>
              <audio controls autoPlay className="w-full max-w-md">
                <source src={mediaUrl} type="audio/mpeg" />
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : (
            <video
              controls
              autoPlay
              className="max-h-[380px] w-full object-contain rounded-lg"
            >
              <source src={mediaUrl} type="video/mp4" />
              Your browser does not support video playback.
            </video>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-mono">
            {fileName || (isAudio ? 'audio.mp3' : 'video.mp4')}
          </span>
          <a
            id="media-player-save-btn"
            href={mediaUrl}
            download={fileName}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download to Device</span>
          </a>
        </div>
      </div>
    </div>
  );
};
