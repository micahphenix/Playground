import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Repository } from './repository';
import type {
  Briefing,
  LogEntry,
  MemoryItem,
  Message,
  PatternFlag,
  Profile,
  WeeklyRecap,
} from './types';
import {
  defaultProfile,
  seedBriefing,
  seedLog,
  seedMemory,
  seedPatterns,
  seedRecaps,
} from './seed';

const K = {
  onboarded: 'steward.onboarded',
  profile: 'steward.profile',
  log: 'steward.log',
  memory: 'steward.memory',
  patterns: 'steward.patterns',
  recaps: 'steward.recaps',
  briefing: 'steward.briefing',
  messages: 'steward.messages',
} as const;

// Chat transcript cap. Enough for the coach's 12-turn context window plus a
// scrollback the user can actually read, without letting storage grow forever.
const MAX_MESSAGES = 200;

async function get<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function put<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export class LocalRepository implements Repository {
  async isOnboarded(): Promise<boolean> {
    return (await AsyncStorage.getItem(K.onboarded)) === '1';
  }
  async markOnboarded(): Promise<void> {
    await AsyncStorage.setItem(K.onboarded, '1');
    // Seed everything the first time onboarding completes.
    if (!(await AsyncStorage.getItem(K.profile))) await put(K.profile, defaultProfile());
    if (!(await AsyncStorage.getItem(K.log))) await put(K.log, seedLog());
    if (!(await AsyncStorage.getItem(K.memory))) await put(K.memory, seedMemory());
    if (!(await AsyncStorage.getItem(K.patterns))) await put(K.patterns, seedPatterns());
    if (!(await AsyncStorage.getItem(K.recaps))) await put(K.recaps, seedRecaps());
    if (!(await AsyncStorage.getItem(K.briefing))) await put(K.briefing, seedBriefing());
  }

  async getProfile(): Promise<Profile> {
    return get<Profile>(K.profile, defaultProfile());
  }
  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const next = { ...(await this.getProfile()), ...patch };
    await put(K.profile, next);
    return next;
  }

  async listLog(): Promise<LogEntry[]> {
    const all = await get<LogEntry[]>(K.log, []);
    return [...all].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  async addLog(entry: LogEntry): Promise<void> {
    const all = await get<LogEntry[]>(K.log, []);
    await put(K.log, [entry, ...all]);
  }
  async updateLog(id: string, patch: Partial<LogEntry>): Promise<void> {
    const all = await get<LogEntry[]>(K.log, []);
    await put(K.log, all.map(e => (e.id === id ? { ...e, ...patch } : e)));
  }
  async deleteLog(id: string): Promise<void> {
    const all = await get<LogEntry[]>(K.log, []);
    await put(K.log, all.filter(e => e.id !== id));
  }

  async listMemory(): Promise<MemoryItem[]> {
    return get<MemoryItem[]>(K.memory, []);
  }
  async addMemory(item: MemoryItem): Promise<void> {
    const all = await get<MemoryItem[]>(K.memory, []);
    await put(K.memory, [item, ...all]);
  }
  async removeMemory(id: string): Promise<void> {
    const all = await get<MemoryItem[]>(K.memory, []);
    await put(K.memory, all.filter(m => m.id !== id));
  }

  async listPatterns(): Promise<PatternFlag[]> {
    return get<PatternFlag[]>(K.patterns, []);
  }
  async upsertPattern(p: PatternFlag): Promise<void> {
    const all = await get<PatternFlag[]>(K.patterns, []);
    const idx = all.findIndex(x => x.id === p.id);
    if (idx === -1) await put(K.patterns, [p, ...all]);
    else {
      const next = [...all];
      next[idx] = p;
      await put(K.patterns, next);
    }
  }

  async listRecaps(): Promise<WeeklyRecap[]> {
    const all = await get<WeeklyRecap[]>(K.recaps, []);
    return [...all].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  }
  async addRecap(r: WeeklyRecap): Promise<void> {
    const all = await get<WeeklyRecap[]>(K.recaps, []);
    await put(K.recaps, [r, ...all]);
  }

  async listMessages(): Promise<Message[]> {
    return get<Message[]>(K.messages, []);
  }
  async addMessage(m: Message): Promise<void> {
    const all = await get<Message[]>(K.messages, []);
    const next = [...all, m];
    await put(K.messages, next.slice(-MAX_MESSAGES));
  }

  async getBriefing(): Promise<Briefing | null> {
    return get<Briefing | null>(K.briefing, null);
  }
  async setBriefing(b: Briefing | null): Promise<void> {
    if (b == null) await AsyncStorage.removeItem(K.briefing);
    else await put(K.briefing, b);
  }

  async exportAll(): Promise<unknown> {
    return {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      profile: await this.getProfile(),
      log: await this.listLog(),
      memory: await this.listMemory(),
      patterns: await this.listPatterns(),
      recaps: await this.listRecaps(),
      briefing: await this.getBriefing(),
      messages: await this.listMessages(),
    };
  }
}

export const localRepo = new LocalRepository();
