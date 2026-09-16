import React, { useState } from 'react';
import { Search, Clipboard, X, Loader2, Sparkles, Youtube, Film, Instagram } from 'lucide-react';
import { PresetSample } from '../types';

interface UrlInputBarProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (customUrl?: string) => void;
  isLoading: boolean;
  presets: PresetSample[];
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  setUrl,
  onAnalyze,
  isLoading,
  presets,
}) => {
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      }
    } catch {
      // Clipboard permissions might be restricted in some iframes
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      onAnalyze();
    }
  };

  return (
    <div className="w-full">
      {/* Search Input Container */}
      <div className="relative rounded-2xl border border-zinc-800/90 bg-zinc-900/90 p-2 shadow-xl shadow-black/40 backdrop-blur-xl transition focus-within:border-violet-500/80 focus-within:ring-2 focus-within:ring-violet-500/20">
        <div className="flex items-center gap-2">
          {/* Left search icon / platform icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-400">
            <Search className="h-5 w-5 text-violet-400" />
          </div>

          {/* Text Input */}
          <input
            id="media-url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Paste video link from YouTube, Instagram Reels, TikTok, Facebook..."
            className="w-full bg-transparent px-2 py-2 text-sm md:text-base text-white placeholder-zinc-500 focus:outline-none"
          />

          {/* Action buttons inside input */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            {url && (
              <button
                id="clear-url-btn"
                onClick={() => setUrl('')}
                disabled={isLoading}
                title="Clear input"
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              id="paste-clipboard-btn"
              onClick={handlePaste}
              disabled={isLoading}
              title="Paste from clipboard"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            >
              <Clipboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {copiedNotification ? 'Pasted!' : 'Paste'}
              </span>
            </button>

            <button
              id="analyze-url-btn"
              onClick={() => onAnalyze()}
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Fetch Formats</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preset Quick-Test Buttons */}
      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs text-zinc-400">
        <span className="font-medium text-zinc-500 text-[11px] uppercase tracking-wider">
          Quick Test Links:
        </span>
        {presets.map((preset) => (
          <button
            key={preset.id}
            id={`preset-btn-${preset.id}`}
            onClick={() => {
              setUrl(preset.url);
              onAnalyze(preset.url);
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-1 text-zinc-300 hover:border-violet-500/40 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          >
            {preset.platform === 'youtube' && <Youtube className="h-3 w-3 text-red-400" />}
            {preset.platform === 'tiktok' && <Film className="h-3 w-3 text-cyan-400" />}
            {preset.platform === 'instagram' && <Instagram className="h-3 w-3 text-pink-400" />}
            {preset.platform === 'facebook' && <Film className="h-3 w-3 text-blue-400" />}
            {preset.platform === 'generic' && <Sparkles className="h-3 w-3 text-amber-400" />}
            <span className="truncate max-w-[120px] sm:max-w-none">
              {preset.platform.toUpperCase()} Test
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
