// Domain types for Steward. Backed by a Repository — see repository.ts.
// Designed to round-trip cleanly through JSON for export and the future
// Supabase / Notion adapters.

export type GoalId = 'muscle' | 'ride' | 'recover';

export type CoachTone = 'warm-stewardship' | 'plainspoken' | 'direct';

export interface Profile {
  name: string;
  age: number;
  location: string;
  // Stewardship framing — affects coach voice.
  faithFraming: boolean;
  protein_g_target: number;
  calories_target: number;
  // Hard constraints — the coach never violates these.
  constraints: string[];
  // Notes that auto-expire unless re-confirmed.
  limitations: Limitation[];
  activeGoal: GoalId;
  rideTargetDate: string | null;
  notifications: {
    morningBriefingTime: string; // "07:30"
    enabled: boolean;
  };
  tone: CoachTone;
  createdAt: string;
}

export interface Limitation {
  id: string;
  label: string;
  note?: string;
  addedAt: string;
  expiresAt: string | null;
}

// One confirmed entry in the daily log — meal, workout, or recovery.
export type LogKind = 'meal' | 'workout' | 'recovery' | 'note';

export interface LogEntry {
  id: string;
  kind: LogKind;
  title: string;
  detail?: string;
  // For meals
  macros?: { kcal: number; protein_g: number; carb_g: number; fat_g: number };
  items?: MealItem[];
  // For workouts
  workout?: { type: string; durationMin: number; rpe?: number };
  // For recovery
  recovery?: { sleepHrs?: number; soreness?: string; mood?: string };
  // Provenance
  source: 'photo' | 'voice' | 'text' | 'quick';
  rawInput?: string;
  photoUri?: string;
  confidence?: number; // 0-1
  createdAt: string;
}

export interface MealItem {
  name: string;
  qty?: string;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
}

// Persistent memory — what the coach holds about the user over time.
export type MemoryKind = 'fact' | 'decision' | 'pattern' | 'recap' | 'goal-change';

export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  headline: string;
  detail?: string;
  createdAt: string;
}

export interface PatternFlag {
  id: string;
  topic: string; // "right calf · mention frequency"
  summary: string;
  mentions: { at: string; context: string }[];
  status: 'open' | 'watch' | 'resolved';
  tone: 'accent' | 'accentAlt' | 'warn';
  createdAt: string;
}

export interface WeeklyRecap {
  id: string;
  weekStart: string; // ISO date of Monday
  headline: string;
  stats: { label: string; value: string; sub: string; tone: 'accent' | 'accentAlt' | 'warn' | 'good' }[];
  whatWorked: string[];
  whatWasHard: string[];
  nextFocus: string;
  createdAt: string;
}

// Conversation — Today / chat. Not persisted long-term in v0.1.
export type Role = 'user' | 'coach' | 'system';

export interface Message {
  id: string;
  role: Role;
  text?: string;
  photoUri?: string;
  createdAt: string;
  // When set, the bubble is rendered as an inline pattern flag card.
  patternFlagId?: string;
}

export interface Briefing {
  id: string;
  forDate: string; // YYYY-MM-DD
  timestamp: string; // "7:42 am"
  headline: string; // serif lead, may contain an italic accent clause via {{em:...}}
  body: string;
  actions: { label: string; kind: 'primary' | 'alt' | 'ghost' }[];
  dismissed: boolean;
}
