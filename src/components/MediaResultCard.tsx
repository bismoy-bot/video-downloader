import React, { useState } from 'react';
import { Video, Music, Download, CheckCircle, Clock, Eye, User, Sparkles } from 'lucide-react';
import { VideoMetadata, FormatOption } from '../types';

interface MediaResultCardProps {
  metadata: VideoMetadata;
  onStartDownload: (format: FormatOption) => void;
  isDownloading: boolean;
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({
  metadata,
  onStartDownload,
  isDownloading,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');

  const videoFormats = metadata.availableFormats.filter(
    (f) => f.type === 'mp4' && !f.isAudioOnly
  );
  const audioFormats = metadata.availableFormats.filter(
    (f) => f.type === 'mp3' || f.isAudioOnly
  );

  // Set default selection when tab changes
  const currentList = activeTab === 'video' ? videoFormats : audioFormats;
  const activeFormat =
    currentList.find((f) => f.id === selectedFormatId) || currentList[0];

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30">YouTube</span>;
      case 'tiktok':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">TikTok</span>;
      case 'instagram':
        return <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30">Instagram Reel</span>;
      case 'facebook':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30">Facebook Reel</span>;
      default:
        return <span className="bg-zinc-500/20 text-zinc-300 border border-zinc-500/30">Web Video</span>;
    }
  };

  return (
    <div
      id="media-analysis-result-card"
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Media Thumbnail & Info */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 group">
            <img
              src={metadata.thumbnailUrl}
              alt={metadata.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Platform Tag */}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
              {getPlatformBadge(metadata.platform)}
            </div>

            {/* Duration Tag */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-xs font-mono font-medium text-white backdrop-blur-md">
              <Clock className="h-3 w-3 text-zinc-400" />
              <span>{metadata.durationFormatted}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
              {metadata.title}
            </h3>
            <div className="mt-2 flex items-center flex-wrap gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-300 font-medium">{metadata.author}</span>
              </div>
              {metadata.viewCount && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{metadata.viewCount.toLocaleString()} views</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Format & Quality Selector */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Format Type Selector (MP4 vs MP3) */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Select Format & Quality
              </h4>
              <p className="text-[11px] text-zinc-500">
                Choose your desired resolution or audio bitrate
              </p>
            </div>

            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80">
              <button
                id="tab-format-video"
                type="button"
                onClick={() => {
                  setActiveTab('video');
                  setSelectedFormatId('');
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'video'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Video (MP4)</span>
              </button>

              <button
                id="tab-format-audio"
                type="button"
                onClick={() => {
                  setActiveTab('audio');
                  setSelectedFormatId('');
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'audio'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="h-3.5 w-3.5" />
                <span>Audio (MP3)</span>
              </button>
            </div>
          </div>

          {/* Quality Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
            {currentList.map((format) => {
              const isSelected = activeFormat?.id === format.id;
              return (
                <div
                  key={format.id}
                  id={`format-item-${format.id}`}
                  onClick={() => setSelectedFormatId(format.id)}
                  className={`relative flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                    isSelected
                      ? 'border-violet-500 bg-violet-600/10 ring-1 ring-violet-500'
                      : 'border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-violet-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {format.type === 'mp3' ? (
                        <Music className="h-4 w-4" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {format.quality}
                        </span>
                        <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] font-mono text-zinc-400 uppercase">
                          {format.extension}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {format.resolution || format.bitrate || 'Standard'} • ~{format.estimatedSize}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-violet-500 bg-violet-600 text-white'
                          : 'border-zinc-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download Action Section */}
          <div className="pt-2">
            <button
              id="confirm-download-btn"
              type="button"
              disabled={isDownloading || !activeFormat}
              onClick={() => activeFormat && onStartDownload(activeFormat)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>
                Download {activeFormat?.type.toUpperCase()} ({activeFormat?.quality})
              </span>
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-500">
              Multiple request queue enabled • Automatic cloud worker allocation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
