import type { Repository } from './repository';
import type {
  Briefing,
  LogEntry,
  MemoryItem,
  PatternFlag,
  Profile,
  WeeklyRecap,
} from './types';

// Planned adapter. The handoff calls for Postgres-backed structured data and
// multi-user support via Supabase. Wiring requires:
//   1) `npm i @supabase/supabase-js`
//   2) EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
//   3) Schema:
//        profiles (id, user_id, name, age, ..., constraints jsonb)
//        log_entries (id, user_id, kind, title, macros jsonb, ..., created_at)
//        memory_items (id, user_id, kind, headline, detail, created_at)
//        pattern_flags (id, user_id, topic, summary, mentions jsonb, ...)
//        weekly_recaps (id, user_id, week_start, ...)
//        briefings (user_id, for_date, ..., PRIMARY KEY (user_id, for_date))
//      All tables have a `user_id` column and an RLS policy of
//      `auth.uid() = user_id`.
//   4) Auth — Supabase email-link or Apple sign-in.
//
// Method bodies throw until the swap happens. To use, change DataContext's
// `localRepo` import to `supabaseRepo`.

export class SupabaseRepository implements Repository {
  private notWired(): never {
    throw new Error('SupabaseRepository is not wired yet. See header comment for the setup checklist.');
  }
  isOnboarded(): Promise<boolean> {
    return this.notWired();
  }
  markOnboarded(): Promise<void> {
    return this.notWired();
  }
  getProfile(): Promise<Profile> {
    return this.notWired();
  }
  updateProfile(_: Partial<Profile>): Promise<Profile> {
    return this.notWired();
  }
  listLog(): Promise<LogEntry[]> {
    return this.notWired();
  }
  addLog(_: LogEntry): Promise<void> {
    return this.notWired();
  }
  updateLog(_: string, __: Partial<LogEntry>): Promise<void> {
    return this.notWired();
  }
  deleteLog(_: string): Promise<void> {
    return this.notWired();
  }
  listMemory(): Promise<MemoryItem[]> {
    return this.notWired();
  }
  addMemory(_: MemoryItem): Promise<void> {
    return this.notWired();
  }
  listPatterns(): Promise<PatternFlag[]> {
    return this.notWired();
  }
  upsertPattern(_: PatternFlag): Promise<void> {
    return this.notWired();
  }
  listRecaps(): Promise<WeeklyRecap[]> {
    return this.notWired();
  }
  getBriefing(): Promise<Briefing | null> {
    return this.notWired();
  }
  setBriefing(_: Briefing | null): Promise<void> {
    return this.notWired();
  }
  exportAll(): Promise<unknown> {
    return this.notWired();
  }
}
