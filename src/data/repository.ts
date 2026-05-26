import type {
  Briefing,
  LogEntry,
  MemoryItem,
  PatternFlag,
  Profile,
  WeeklyRecap,
} from './types';

// The single seam between the app and storage. Swap LocalRepository for
// SupabaseRepository / NotionMemoryExporter later without touching screens.
export interface Repository {
  // Onboarding gate
  isOnboarded(): Promise<boolean>;
  markOnboarded(): Promise<void>;

  // Profile (read-modify-write through partials)
  getProfile(): Promise<Profile>;
  updateProfile(patch: Partial<Profile>): Promise<Profile>;

  // Daily log
  listLog(): Promise<LogEntry[]>;
  addLog(entry: LogEntry): Promise<void>;
  updateLog(id: string, patch: Partial<LogEntry>): Promise<void>;
  deleteLog(id: string): Promise<void>;

  // Memory + patterns + recaps
  listMemory(): Promise<MemoryItem[]>;
  addMemory(item: MemoryItem): Promise<void>;
  removeMemory(id: string): Promise<void>;

  listPatterns(): Promise<PatternFlag[]>;
  upsertPattern(p: PatternFlag): Promise<void>;

  listRecaps(): Promise<WeeklyRecap[]>;
  addRecap(r: WeeklyRecap): Promise<void>;

  // Today's briefing
  getBriefing(): Promise<Briefing | null>;
  setBriefing(b: Briefing | null): Promise<void>;

  // Full export — for the JSON-download workflow flagged in the handoff.
  exportAll(): Promise<unknown>;
}
