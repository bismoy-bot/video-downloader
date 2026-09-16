import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Session, DownloadHistoryItem } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export class Database {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private history: DownloadHistoryItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const userList = readJsonFile<User[]>(USERS_FILE, []);
    userList.forEach(u => this.users.set(u.id, u));

    const sessionList = readJsonFile<Session[]>(SESSIONS_FILE, []);
    const now = Date.now();
    sessionList.forEach(s => {
      if (s.expiresAt > now) {
        this.sessions.set(s.token, s);
      }
    });

    this.history = readJsonFile<DownloadHistoryItem[]>(HISTORY_FILE, []);

    // Create a demo user if no users exist
    if (this.users.size === 0) {
      this.createUser('demo@omnidownloader.com', 'demouser', 'Demo1234!');
    }
  }

  private saveUsers() {
    writeJsonFile(USERS_FILE, Array.from(this.users.values()));
  }

  private saveSessions() {
    writeJsonFile(SESSIONS_FILE, Array.from(this.sessions.values()));
  }

  private saveHistory() {
    writeJsonFile(HISTORY_FILE, this.history);
  }

  public hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const userSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, userSalt, 64).toString('hex');
    return { hash, salt: userSalt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }

  public createUser(email: string, username: string, password: string): User {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (existing) {
      throw new Error('User with this email or username already exists');
    }

    const { hash, salt } = this.hashPassword(password);
    const user: User = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      username: username.trim(),
      passwordHash: hash,
      salt,
      createdAt: Date.now(),
    };

    this.users.set(user.id, user);
    this.saveUsers();
    return user;
  }

  public findUserByEmailOrUsername(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
  }

  public findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public createSession(userId: string): Session {
    const token = crypto.randomBytes(32).toString('hex');
    const session: Session = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    this.sessions.set(token, session);
    this.saveSessions();
    return session;
  }

  public getSession(token: string): Session | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(token);
      this.saveSessions();
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string): void {
    if (this.sessions.has(token)) {
      this.sessions.delete(token);
      this.saveSessions();
    }
  }

  // History operations
  public addHistoryItem(item: Omit<DownloadHistoryItem, 'id' | 'timestamp'>): DownloadHistoryItem {
    const newItem: DownloadHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.history.unshift(newItem);
    // Keep last 500 items in database
    if (this.history.length > 500) {
      this.history = this.history.slice(0, 500);
    }
    this.saveHistory();
    return newItem;
  }

  public getUserHistory(userId: string): DownloadHistoryItem[] {
    return this.history.filter(h => h.userId === userId);
  }

  public deleteHistoryItem(id: string, userId: string): boolean {
    const initialLen = this.history.length;
    this.history = this.history.filter(h => !(h.id === id && h.userId === userId));
    if (this.history.length !== initialLen) {
      this.saveHistory();
      return true;
    }
    return false;
  }

  public clearUserHistory(userId: string): void {
    this.history = this.history.filter(h => h.userId !== userId);
    this.saveHistory();
  }
}

export const db = new Database();
