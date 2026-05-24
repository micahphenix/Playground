// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Seed data
// Source: design_handoff_grass_guru_sprint2/data.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { CategoryId } from '../design/tokens';

export interface PlanTask {
  id: string;
  title: string;
  detail: string;
  cat: CategoryId;
}

export type MonthKey = 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' |
  'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';

export const MONTHS: MonthKey[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Seeded annual maintenance plan for a 3,000 sq ft Tall Fescue lawn.
 * Sparse on purpose — Plan is a calendar, not a to-do app.
 */
export const SEED_PLAN: Record<MonthKey, PlanTask[]> = {
  Jan: [
    { id: 'm-jan-1', title: 'Sharpen mower blades', detail: 'Off-season tune-up. A clean cut prevents disease in spring.', cat: 'mow' },
  ],
  Feb: [],
  Mar: [
    { id: 'm-mar-1', title: 'Apply pre-emergent herbicide', detail: 'Prevents crabgrass before soil temps hit 55°F. Time it 1–2 weeks before forsythia blooms.', cat: 'weed' },
    { id: 'm-mar-2', title: 'First mow of the season', detail: 'Cut high — leave the blade at 3.5". Bag the clippings this once.', cat: 'mow' },
  ],
  Apr: [
    { id: 'm-apr-1', title: 'Spring fertilizer (slow-release N)', detail: 'For your 3,000 sq ft fescue: about 6.5 lb of 46-0-0 urea, watered in.', cat: 'fertilize' },
    { id: 'm-apr-2', title: 'Spot-treat broadleaf weeds', detail: 'Dandelion, clover, plantain. Hand-pull or use a selective herbicide.', cat: 'weed' },
  ],
  May: [
    { id: 'm-may-1', title: 'Mow weekly, 3.5–4"', detail: 'Never remove more than ⅓ of blade length per cut.', cat: 'mow' },
    { id: 'm-may-2', title: 'Deep, infrequent watering', detail: 'About 1" per week — including rainfall. Early morning is best.', cat: 'water' },
  ],
  Jun: [
    { id: 'm-jun-1', title: 'Raise mower deck to 4"', detail: 'Taller grass shades the soil and slows evaporation during summer stress.', cat: 'mow' },
  ],
  Jul: [
    { id: 'm-jul-1', title: 'Watch for brown patch', detail: 'High humidity + warm nights are prime fungus weather. Walk the lawn weekly.', cat: 'water' },
  ],
  Aug: [],
  Sep: [
    { id: 'm-sep-1', title: 'Core aerate the lawn', detail: 'Fall is the best window for cool-season grasses. Plugs the size of your pinky.', cat: 'mow' },
    { id: 'm-sep-2', title: 'Overseed thin areas', detail: 'Apply 6 lb of tall fescue seed per 1,000 sq ft → ~18 lb for your lawn.', cat: 'fertilize' },
  ],
  Oct: [
    { id: 'm-oct-1', title: 'Fall fertilizer (winterizer)', detail: 'The most important feed of the year. Builds roots through winter.', cat: 'fertilize' },
  ],
  Nov: [
    { id: 'm-nov-1', title: 'Final mow, lower to 2.5"', detail: 'A shorter blade going into winter helps prevent snow mold.', cat: 'mow' },
    { id: 'm-nov-2', title: 'Clear leaves', detail: 'Mulch into the lawn with the mower if the layer is light — otherwise rake.', cat: 'mow' },
  ],
  Dec: [],
};

export const ISSUE_TYPES = ['Fungus', 'Pests', 'Brown Patch', 'Weeds', 'Bare Spot', 'Drainage', 'Other'] as const;
export type IssueTypeLabel = typeof ISSUE_TYPES[number];

export const SUGGESTED_QUESTIONS = [
  'Why does my grass look thin in the shade?',
  'When should I overseed this fall?',
  'Is it too late to apply pre-emergent?',
];

/** Find the next upcoming task across the year, starting from the given month. */
export function findNextTask(fromMonthIndex: number = new Date().getMonth()): { month: MonthKey; task: PlanTask } | null {
  for (let i = 0; i < 12; i++) {
    const idx = (fromMonthIndex + i) % 12;
    const month = MONTHS[idx];
    const tasks = SEED_PLAN[month];
    if (tasks.length > 0) return { month, task: tasks[0] };
  }
  return null;
}
