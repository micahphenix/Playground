import { v4 as uuid } from 'uuid';
import type {
  Briefing,
  LogEntry,
  MemoryItem,
  PatternFlag,
  Profile,
  WeeklyRecap,
} from './types';

// Seed data — the one real user described in the handoff (Aaron).
// Loaded when the app boots fresh, before onboarding writes its own profile.

export function defaultProfile(): Profile {
  return {
    name: 'Aaron',
    age: 33,
    location: 'Euless, TX',
    faithFraming: true,
    protein_g_target: 185,
    calories_target: 2600,
    constraints: [
      'Knee replacement (Aug 2025) — squats off-limits, hard constraint',
      'GERD — no heavy meals after 8 PM',
      'Connective tissue adapts slowly post-op',
    ],
    limitations: [],
    activeGoal: 'muscle',
    rideTargetDate: null,
    notifications: { morningBriefingTime: '07:30', enabled: true },
    tone: 'warm-stewardship',
    createdAt: new Date().toISOString(),
  };
}

const TODAY = new Date();
const yest = (h: number, m: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - 1);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export function seedLog(): LogEntry[] {
  return [
    {
      id: uuid(),
      kind: 'meal',
      title: 'Whey shake + apple',
      macros: { kcal: 250, protein_g: 27, carb_g: 38, fat_g: 3 },
      source: 'quick',
      createdAt: yest(21, 18),
    },
    {
      id: uuid(),
      kind: 'meal',
      title: 'Salmon + rice + asparagus',
      macros: { kcal: 640, protein_g: 44, carb_g: 58, fat_g: 24 },
      source: 'text',
      createdAt: yest(19, 2),
    },
    {
      id: uuid(),
      kind: 'meal',
      title: 'Chicken rice bowl',
      macros: { kcal: 710, protein_g: 52, carb_g: 78, fat_g: 18 },
      source: 'photo',
      createdAt: yest(12, 30),
    },
  ];
}

export function seedBriefing(): Briefing {
  const now = new Date();
  return {
    id: uuid(),
    forDate: now.toISOString().slice(0, 10),
    timestamp: '7:42 am',
    headline: 'Sleep was rough — {{em:third night under six hours.}}',
    body:
      "Protein finished short again yesterday (162g of 185). Today's the upper lift — would a slower session or a 40-minute spin be wiser? Your call.",
    actions: [
      { label: 'Lift lighter', kind: 'primary' },
      { label: 'Walk instead', kind: 'alt' },
      { label: 'Keep plan', kind: 'ghost' },
    ],
    dismissed: false,
  };
}

export function seedMemory(): MemoryItem[] {
  const now = new Date().toISOString();
  return [
    { id: uuid(), kind: 'fact', headline: 'Knee replacement', detail: 'Aug 2025 · 8 mo post-op', createdAt: now },
    { id: uuid(), kind: 'fact', headline: 'Squats', detail: 'Off-limits · hard constraint', createdAt: now },
    { id: uuid(), kind: 'fact', headline: 'GERD', detail: 'Affects timing of late meals', createdAt: now },
    { id: uuid(), kind: 'fact', headline: 'Protein target', detail: '185 g/day', createdAt: now },
    { id: uuid(), kind: 'fact', headline: 'Maintenance', detail: '~2,600 kcal/day', createdAt: now },
    { id: uuid(), kind: 'fact', headline: 'Active goal', detail: 'Build muscle · 50-mi (date TBD)', createdAt: now },
  ];
}

export function seedPatterns(): PatternFlag[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuid(),
      topic: 'Right calf · mention frequency',
      summary: '4 mentions in 3 weeks · avg mile 15',
      mentions: [
        { at: 'May 22', context: '22 mi ride — grumbled at 15' },
        { at: 'May 15', context: '18 mi ride — tight calf' },
        { at: 'May 09', context: '16 mi ride — calf again' },
        { at: 'May 04', context: '20 mi ride — calf flared up' },
      ],
      status: 'open',
      tone: 'accent',
      createdAt: now,
    },
    {
      id: uuid(),
      topic: 'Sleep · sub-6h streak',
      summary: 'Mon Wed Thu this week',
      mentions: [],
      status: 'open',
      tone: 'warn',
      createdAt: now,
    },
    {
      id: uuid(),
      topic: 'Protein · weekend shortfall',
      summary: 'Sat/Sun avg 142g vs. weekday 174g',
      mentions: [],
      status: 'watch',
      tone: 'accentAlt',
      createdAt: now,
    },
  ];
}

export function seedRecaps(): WeeklyRecap[] {
  return [
    {
      id: uuid(),
      weekStart: '2026-05-18',
      headline:
        '"A reasonable week — protein landed four days, the calf came up once on the ride, and you slept less than you needed three nights running. Worth easing into next."',
      stats: [
        { label: 'Protein hit', value: '4/7', sub: 'days at 185g', tone: 'accent' },
        { label: 'Lifts done', value: '2/2', sub: 'upper body', tone: 'accentAlt' },
        { label: 'Cycling', value: '48 mi', sub: 'across 2 rides', tone: 'accent' },
        { label: 'Sleep avg', value: '6h 12m', sub: '3 nights low', tone: 'warn' },
      ],
      whatWorked: [
        'Two solid upper lifts despite the calf',
        'Weekend shake habit closed the protein gap',
        'Lunch logging stayed consistent',
      ],
      whatWasHard: [
        'Sleep deficit — work ran late three nights',
        'Calf flagged again on the longer ride',
      ],
      nextFocus:
        'Hold lifting at current load. Trade the long ride for two shorter ones with calf mobility before each. Sleep north of 6.5h on lift days.',
      createdAt: new Date().toISOString(),
    },
  ];
}
