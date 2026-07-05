import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { localRepo } from './LocalRepository';
import { scheduleMorningBriefing } from '../services/notifications';
import { runDailyBackup } from '../services/backup';
import type { Briefing, LogEntry, MemoryItem, Message, PatternFlag, Profile, WeeklyRecap } from './types';

interface DataState {
  ready: boolean;
  onboarded: boolean;
  profile: Profile | null;
  log: LogEntry[];
  memory: MemoryItem[];
  patterns: PatternFlag[];
  recaps: WeeklyRecap[];
  briefing: Briefing | null;
  chatMessages: Message[];
  refresh: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  addLog: (entry: LogEntry) => Promise<void>;
  updateLog: (id: string, patch: Partial<LogEntry>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  addMemory: (item: MemoryItem) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  upsertPattern: (p: PatternFlag) => Promise<void>;
  addRecap: (r: WeeklyRecap) => Promise<void>;
  addChatMessage: (m: Message) => Promise<void>;
  dismissBriefing: () => Promise<void>;
  restoreBriefing: () => Promise<void>;
  setBriefing: (b: Briefing | null) => Promise<void>;
  exportAll: () => Promise<unknown>;
}

const DataCtx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [memory, setMemory] = useState<MemoryItem[]>([]);
  const [patterns, setPatterns] = useState<PatternFlag[]>([]);
  const [recaps, setRecaps] = useState<WeeklyRecap[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const refresh = useCallback(async () => {
    const done = await localRepo.isOnboarded();
    setOnboarded(done);
    if (done) {
      const [p, l, m, pat, r, b, msgs] = await Promise.all([
        localRepo.getProfile(),
        localRepo.listLog(),
        localRepo.listMemory(),
        localRepo.listPatterns(),
        localRepo.listRecaps(),
        localRepo.getBriefing(),
        localRepo.listMessages(),
      ]);
      setProfile(p);
      setLog(l);
      setMemory(m);
      setPatterns(pat);
      setRecaps(r);
      setBriefing(b);
      setChatMessages(msgs);
      scheduleMorningBriefing(p.notifications.morningBriefingTime, p.notifications.enabled).catch(() => {});
      // Best-effort daily snapshot; see services/backup.ts.
      runDailyBackup(() => localRepo.exportAll());
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const value: DataState = useMemo(
    () => ({
      ready,
      onboarded,
      profile,
      log,
      memory,
      patterns,
      recaps,
      briefing,
      chatMessages,
      refresh,
      async completeOnboarding() {
        await localRepo.markOnboarded();
        await refresh();
      },
      async updateProfile(patch) {
        const next = await localRepo.updateProfile(patch);
        setProfile(next);
        if (patch.notifications) {
          scheduleMorningBriefing(next.notifications.morningBriefingTime, next.notifications.enabled).catch(() => {});
        }
      },
      async addLog(entry) {
        await localRepo.addLog(entry);
        setLog(await localRepo.listLog());
      },
      async updateLog(id, patch) {
        await localRepo.updateLog(id, patch);
        setLog(await localRepo.listLog());
      },
      async deleteLog(id) {
        await localRepo.deleteLog(id);
        setLog(await localRepo.listLog());
      },
      async addMemory(item) {
        await localRepo.addMemory(item);
        setMemory(await localRepo.listMemory());
      },
      async removeMemory(id) {
        await localRepo.removeMemory(id);
        setMemory(await localRepo.listMemory());
      },
      async upsertPattern(p) {
        await localRepo.upsertPattern(p);
        setPatterns(await localRepo.listPatterns());
      },
      async addRecap(r) {
        await localRepo.addRecap(r);
        setRecaps(await localRepo.listRecaps());
      },
      async addChatMessage(m) {
        await localRepo.addMessage(m);
        setChatMessages(prev => [...prev, m]);
      },
      async dismissBriefing() {
        if (!briefing) return;
        const next = { ...briefing, dismissed: true };
        await localRepo.setBriefing(next);
        setBriefing(next);
      },
      async restoreBriefing() {
        if (!briefing) return;
        const next = { ...briefing, dismissed: false };
        await localRepo.setBriefing(next);
        setBriefing(next);
      },
      async setBriefing(b) {
        await localRepo.setBriefing(b);
        setBriefing(b);
      },
      async exportAll() {
        return localRepo.exportAll();
      },
    }),
    [ready, onboarded, profile, log, memory, patterns, recaps, briefing, chatMessages, refresh],
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
