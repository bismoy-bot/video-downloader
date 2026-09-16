import React, { useState, useEffect, useRef } from 'react';
import {
  DownloadCloud,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  Youtube,
  Film,
  Instagram,
  Music,
  Video,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  User,
  QueueStats,
  VideoMetadata,
  FormatOption,
  DownloadJob,
  DownloadHistoryItem,
  PresetSample,
} from './types';
import { Navbar } from './components/Navbar';
import { UrlInputBar } from './components/UrlInputBar';
import { MediaResultCard } from './components/MediaResultCard';
import { ActiveDownloadCard } from './components/ActiveDownloadCard';
import { HistorySection } from './components/HistorySection';
import { AuthModal } from './components/AuthModal';
import { QueueMonitorModal } from './components/QueueMonitorModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('omni_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Downloader state
  const [url, setUrl] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [activeJob, setActiveJob] = useState<DownloadJob | null>(null);
  const [presets, setPresets] = useState<PresetSample[]>([]);

  // Queue & History state
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // In-app Media Player state
  const [mediaPlayer, setMediaPlayer] = useState<{
    isOpen: boolean;
    title: string;
    mediaUrl: string;
    isAudio: boolean;
    fileName?: string;
  }>({
    isOpen: false,
    title: '',
    mediaUrl: '',
    isAudio: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Initial Load: Check Auth, Presets, Queue Stats
  useEffect(() => {
    // Fetch presets
    fetch('/api/presets')
      .then((res) => res.json())
      .then((data) => setPresets(data))
      .catch((err) => console.error('Failed to load presets:', err));

    // Restore user if token exists
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then((data) => {
          setUser(data.user);
          loadUserHistory(token);
        })
        .catch(() => {
          localStorage.removeItem('omni_token');
          setToken(null);
          setUser(null);
        });
    }

    // Poll queue stats every 4 seconds
    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueueStats = () => {
    fetch('/api/queue/stats')
      .then((res) => res.json())
      .then((data) => setQueueStats(data))
      .catch(() => {});
  };

  const loadUserHistory = (authToken?: string) => {
    const t = authToken || token;
    const headers: Record<string, string> = {};
    if (t) headers['Authorization'] = `Bearer ${t}`;

    fetch('/api/history', { headers })
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error('Failed to load history:', err));
  };

  // 2. Auth handlers
  const handleAuthSuccess = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('omni_token', newToken);
    loadUserHistory(newToken);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem('omni_token');
    setToken(null);
    setUser(null);
    setHistory([]);
  };

  // 3. Analyze Video URL
  const handleAnalyze = async (customUrl?: string) => {
    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) return;

    setIsLoadingMetadata(true);
    setMetadata(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze URL');
      }

      setMetadata(data);
    } catch (err: any) {
      alert(err.message || 'Error analyzing link');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // 4. Start Download Job & Subscribe to SSE Real-Time Progress
  const handleStartDownload = async (format: FormatOption) => {
    if (!metadata) return;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/download/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: metadata.url,
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl,
          platform: metadata.platform,
          format,
        }),
      });

      const job: DownloadJob = await res.json();
      if (!res.ok) {
        throw new Error((job as any).error || 'Failed to start download job');
      }

      setActiveJob(job);
      listenToJobProgress(job.id);
    } catch (err: any) {
      alert(err.message || 'Failed to enqueue download job');
    }
  };

  const listenToJobProgress = (jobId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const updatedJob: DownloadJob = JSON.parse(event.data);
        setActiveJob(updatedJob);

        if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
          eventSource.close();
          fetchQueueStats();
          if (token) {
            loadUserHistory(token);
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      // Fallback: poll job if SSE drops
      fetch(`/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then((j) => setActiveJob(j))
        .catch(() => {});
    };
  };

  // 5. History management
  const handleDeleteHistory = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!token) return;
    try {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory([]);
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  // 6. In-App Media Player Preview
  const handlePreviewJob = (job: DownloadJob) => {
    if (!job.downloadUrl) return;
    setMediaPlayer({
      isOpen: true,
      title: job.title,
      mediaUrl: job.downloadUrl,
      isAudio: job.format.type === 'mp3' || Boolean(job.format.isAudioOnly),
      fileName: job.fileName,
    });
  };

  const handlePreviewHistory = (item: DownloadHistoryItem) => {
    if (!item.downloadUrl) return;
    setMediaPlayer({
      isOpen: true,
      title: item.title,
      mediaUrl: item.downloadUrl,
      isAudio: item.formatType === 'mp3' || item.formatType === 'm4a',
      fileName: item.fileName,
    });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        queueStats={queueStats}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenQueue={() => setIsQueueModalOpen(true)}
        onToggleHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
        historyCount={history.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Multi-Platform Media Downloader • High-Concurrency Queue</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-['Outfit']">
            Download Any Video in{' '}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              MP4 & High-Bitrate MP3
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Extract from YouTube, Facebook Reels, TikTok, and Instagram in full resolution with automatic quality detection and real-time progress tracking.
          </p>

          {/* Supported Platforms Pills */}
          <div className="pt-2 flex items-center justify-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300">
              <Youtube className="h-3.5 w-3.5 text-red-500" />
              <span>YouTube 1080p & Shorts</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300">
              <Film className="h-3.5 w-3.5 text-blue-500" />
              <span>Facebook Reels</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300">
              <Film className="h-3.5 w-3.5 text-cyan-400" />
              <span>TikTok HD (No Watermark)</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300">
              <Instagram className="h-3.5 w-3.5 text-pink-500" />
              <span>Instagram Reels & Stories</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300">
              <Music className="h-3.5 w-3.5 text-emerald-400" />
              <span>MP3 320 kbps Master Audio</span>
            </div>
          </div>
        </div>

        {/* URL Input Bar & Quick Presets */}
        <div className="max-w-3xl mx-auto w-full">
          <UrlInputBar
            url={url}
            setUrl={setUrl}
            onAnalyze={handleAnalyze}
            isLoading={isLoadingMetadata}
            presets={presets}
          />
        </div>

        {/* Active Download in Progress or Complete */}
        {activeJob && (
          <div className="max-w-3xl mx-auto w-full">
            <ActiveDownloadCard
              job={activeJob}
              onPreview={handlePreviewJob}
              onReset={() => {
                setActiveJob(null);
                setMetadata(null);
                setUrl('');
              }}
            />
          </div>
        )}

        {/* Analyzed Media Result Card (Format & Quality Selection) */}
        {metadata && !activeJob && (
          <div className="max-w-4xl mx-auto w-full">
            <MediaResultCard
              metadata={metadata}
              onStartDownload={handleStartDownload}
              isDownloading={Boolean(activeJob && activeJob.status === 'processing')}
            />
          </div>
        )}

        {/* User Download History Section (Toggleable or Visible) */}
        {(showHistory || (user && history.length > 0)) && (
          <div className="max-w-4xl mx-auto w-full pt-4">
            <HistorySection
              history={history}
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onPreview={handlePreviewHistory}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearHistory}
            />
          </div>
        )}

        {/* Architecture & Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-zinc-800/80">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Multiple Request Handling</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Equipped with a worker-pool concurrency engine and FIFO queue so thousands of simultaneous visitors can convert without server throttling or crashes.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Adaptive Quality Detection</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Analyzes source streams on the fly to present genuine 1080p, 720p, 480p MP4 formats and crystal-clear 320k, 256k, 192k MP3 audio tracks.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-sm">User Accounts & Saved History</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Sign up or log in to keep a personal log of all your downloads with instant in-app preview playback and re-download capability.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 OmniDownloader. Multi-request streaming & media conversion platform.</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Powered by FFmpeg & Node.js Engine</span>
            <span>•</span>
            <button
              onClick={() => setIsQueueModalOpen(true)}
              className="hover:text-violet-400 transition underline cursor-pointer"
            >
              Queue Architecture
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <QueueMonitorModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        stats={queueStats}
      />

      <MediaPlayerModal
        isOpen={mediaPlayer.isOpen}
        onClose={() => setMediaPlayer((prev) => ({ ...prev, isOpen: false }))}
        title={mediaPlayer.title}
        mediaUrl={mediaPlayer.mediaUrl}
        isAudio={mediaPlayer.isAudio}
        fileName={mediaPlayer.fileName}
      />
    </div>
  );
}
