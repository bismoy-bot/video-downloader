import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { fetchMetadata } from './server/downloader';
import { queueManager } from './server/queue';
import { FormatOption, PlatformType } from './server/types';

const app = express();
const PORT = 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Auth helper middleware
function getUserFromAuthHeader(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  const token = authHeader.slice(7);
  const session = db.getSession(token);
  return session ? session.userId : undefined;
}

// -------------------------------------------------------------
// PRESETS / SAMPLES (For instant testing of all platforms)
// -------------------------------------------------------------
app.get('/api/presets', (_req: Request, res: Response) => {
  res.json([
    {
      id: 'yt-cc',
      platform: 'youtube',
      title: 'YouTube 4K Nature Showcase (Creative Commons)',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80',
      description: 'Test high-resolution YouTube video conversion & MP3 extraction',
    },
    {
      id: 'tt-dance',
      platform: 'tiktok',
      title: 'TikTok Viral Choreography Reel',
      url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678',
      thumbnail: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&q=80',
      description: 'Test TikTok portrait HD MP4 & trending audio extraction',
    },
    {
      id: 'ig-reel',
      platform: 'instagram',
      title: 'Instagram Cinematic Travel Reel',
      url: 'https://www.instagram.com/reel/C123456789/',
      thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
      description: 'Test Instagram Reel extraction and conversion',
    },
    {
      id: 'fb-reel',
      platform: 'facebook',
      title: 'Facebook Reels Creative Clip',
      url: 'https://www.facebook.com/reel/987654321012345',
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      description: 'Test Facebook Reels video & audio extraction',
    },
    {
      id: 'generic-sample',
      platform: 'generic',
      title: 'Big Buck Bunny Open Movie (Direct Sample)',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      description: 'Direct high-speed test video with instant format transcoding',
    },
  ]);
});

// -------------------------------------------------------------
// METADATA EXTRACTION & QUALITY DETECTION
// -------------------------------------------------------------
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Please provide a valid video URL' });
    }

    const cleanUrl = url.trim();
    const metadata = await fetchMetadata(cleanUrl);
    return res.json(metadata);
  } catch (err: any) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: err.message || 'Failed to extract video information' });
  }
});

// -------------------------------------------------------------
// DOWNLOAD JOB QUEUE & CONCURRENCY
// -------------------------------------------------------------
app.post('/api/download/start', (req: Request, res: Response) => {
  try {
    const { url, title, thumbnailUrl, platform, format } = req.body;
    if (!url || !format) {
      return res.status(400).json({ error: 'URL and format selection are required' });
    }

    const userId = getUserFromAuthHeader(req);

    const job = queueManager.createJob({
      userId,
      url,
      title: title || 'Untitled Media',
      thumbnailUrl: thumbnailUrl || '',
      platform: (platform as PlatformType) || 'generic',
      format: format as FormatOption,
    });

    return res.json(job);
  } catch (err: any) {
    console.error('Start job error:', err);
    return res.status(500).json({ error: err.message || 'Failed to start download job' });
  }
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = queueManager.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json(job);
});

// Server-Sent Events (SSE) for zero-latency live progress updates
app.get('/api/jobs/:id/stream', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const job = queueManager.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current state immediately
  res.write(`data: ${JSON.stringify(job)}\n\n`);

  const unsubscribe = queueManager.subscribe(jobId, (updatedJob) => {
    res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
      res.end();
    }
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// File streaming download endpoint with proper attachment headers
app.get('/api/download/file/:jobId/:fileName', (req: Request, res: Response) => {
  const { jobId, fileName } = req.params;
  const filePath = path.resolve(process.cwd(), 'downloads', jobId, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Download file not found or has expired.');
  }

  const stat = fs.statSync(filePath);
  const isMp3 = fileName.toLowerCase().endsWith('.mp3');

  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Type', isMp3 ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

// Real-time queue monitor stats
app.get('/api/queue/stats', (_req: Request, res: Response) => {
  res.json(queueManager.getStats());
});

// -------------------------------------------------------------
// USER AUTHENTICATION & SESSIONS
// -------------------------------------------------------------
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = db.createUser(email, username, password);
    const session = db.createSession(user.id);

    return res.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create user' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const user = db.findUserByEmailOrUsername(identifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = db.verifyPassword(password, user.passwordHash, user.salt);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const session = db.createSession(user.id);

    return res.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getUserFromAuthHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const history = db.getUserHistory(userId);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      totalDownloads: history.length,
    },
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    db.deleteSession(token);
  }
  return res.json({ success: true });
});

// -------------------------------------------------------------
// DOWNLOAD HISTORY
// -------------------------------------------------------------
app.get('/api/history', (req: Request, res: Response) => {
  const userId = getUserFromAuthHeader(req);
  if (!userId) {
    return res.json([]);
  }

  const items = db.getUserHistory(userId);
  return res.json(items);
});

app.delete('/api/history/:id', (req: Request, res: Response) => {
  const userId = getUserFromAuthHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const success = db.deleteHistoryItem(req.params.id, userId);
  return res.json({ success });
});

app.delete('/api/history', (req: Request, res: Response) => {
  const userId = getUserFromAuthHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  db.clearUserHistory(userId);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// SERVER INITIALIZATION & FRONTEND INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
