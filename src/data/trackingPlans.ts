import type { GoalId, Profile } from './types';

// A single planned weekly session. `detail` (sets/reps, pace, intent) is
// optional — rows with it expand in the Workouts tab; rows without stay flat.
export interface ChecklistItem {
  label: string;
  detail?: string;
}

// A goal expressed as DATA, not branching code.
//
// The screens render these fields generically — same rings, same checklist,
// same briefing card, different contents. In v0.1 the three plans below are
// hardcoded; in v0.2 the coach will GENERATE a TrackingPlan from a goal
// conversation ("what does healthier mean to you?") and write it here, with
// no screen changes. This is the "config is data, not code" seam from the
// June 2026 competitive-analysis brief — the configurability moat.
export interface TrackingPlan {
  goalId: GoalId;
  name: string;
  detail: string;
  quote: string;
  // Resolved to a theme color at the UI edge — keeps this data layer
  // free of theme imports so it stays portable to a future generator.
  colorKey: 'accent' | 'accentAlt' | 'muted' | 'good' | 'warn';
  // The "specific challenge" goal needs a pinned event date to periodize.
  rideDateRelevant?: boolean;
  // Ring targets — what the Today rings and watch face fill against.
  rings: { protein_g: number; calories: number };
  // Weekly intentions the coach holds the user to.
  checklist: ChecklistItem[];
  // Topics the coach actively watches for under this goal.
  patternsToWatch: string[];
  // One line steering the daily briefing + coaching emphasis.
  briefingEmphasis: string;
}

export const TRACKING_PLANS: Record<GoalId, TrackingPlan> = {
  muscle: {
    goalId: 'muscle',
    name: 'Build muscle',
    detail: 'High protein · slow lift progression · cycling kept honest',
    quote: 'You are building. Eat enough to grow, sleep enough to repair, lift enough to provoke.',
    colorKey: 'accent',
    rings: { protein_g: 185, calories: 2600 },
    checklist: [
      { label: '2 upper lifts', detail: 'Push/pull focus · 3×6–8 · leave 1–2 reps in reserve' },
      { label: '2 lower/rehab sessions', detail: 'No loaded squats yet — split squats, leg press, single-leg calf raises' },
      { label: '2 easy rides', detail: 'Zone 2, conversational — keep the legs honest without taxing recovery' },
    ],
    patternsToWatch: ['protein shortfall', 'sleep under 6h', 'calf complaints under load'],
    briefingEmphasis:
      'Emphasize hitting protein, progressing lifts within current knee limits, and sleep for repair.',
  },
  ride: {
    goalId: 'ride',
    name: 'Specific challenge',
    detail: 'Marathon, ride, race — periodized to a date',
    quote: 'You are building toward an event. The work earns its place; recovery is part of it.',
    colorKey: 'accentAlt',
    rideDateRelevant: true,
    rings: { protein_g: 160, calories: 2750 },
    checklist: [
      { label: '1 long session', detail: 'Build duration toward event demands · fuel every 45 min' },
      { label: '2 base sessions', detail: 'Steady aerobic work · keep effort easy enough to repeat' },
      { label: '1 maintenance lift', detail: 'Hold strength without adding fatigue before key sessions' },
    ],
    patternsToWatch: ['niggles under load', 'sleep under 6h', 'under-fueling on big days'],
    briefingEmphasis:
      'Emphasize periodization toward the event date, fueling, load management, and recovery.',
  },
  recover: {
    goalId: 'recover',
    name: 'Recover well',
    detail: 'Lighter load · sleep priority · protein floor',
    quote: 'You are mending. The body sets the pace; your job is to listen and feed it.',
    colorKey: 'muted',
    rings: { protein_g: 175, calories: 2400 },
    checklist: [
      { label: 'Sleep 7h+ nightly', detail: 'The single biggest lever while mending' },
      { label: '1 mobility session', detail: 'Gentle range-of-motion work, nothing that aggravates' },
      { label: 'Hit the protein floor daily' },
    ],
    patternsToWatch: ['sleep under 6h', 'soreness lingering', 'protein floor missed'],
    briefingEmphasis:
      'Emphasize sleep, gentle load, and hitting the protein floor; let the body set the pace.',
  },
  weightloss: {
    goalId: 'weightloss',
    name: 'Weight loss',
    detail: 'Modest deficit · protein-forward · steps',
    quote: 'You are paring back. Lose it slow enough to keep the muscle and the joy.',
    colorKey: 'good',
    rings: { protein_g: 170, calories: 2100 },
    checklist: [
      { label: '3 strength sessions', detail: 'Preserve muscle in the deficit — keep the loads up' },
      { label: '2–3 Zone-2 cardio', detail: 'Easy aerobic work for the burn without crushing recovery' },
      { label: '10k+ steps daily', detail: 'The quiet driver of the deficit' },
    ],
    patternsToWatch: ['protein shortfall in a deficit', 'energy or sleep dropping', 'weekend calorie creep'],
    briefingEmphasis:
      'Emphasize a modest calorie deficit, high protein to preserve muscle, daily steps, and steady energy.',
  },
  tone: {
    goalId: 'tone',
    name: 'Tone / recomposition',
    detail: 'Hold muscle · lean out gradually',
    quote: 'You are reshaping, not shrinking. Strength stays; the rest follows.',
    colorKey: 'accent',
    rings: { protein_g: 175, calories: 2300 },
    checklist: [
      { label: '3 full-body lifts', detail: 'Compound-led · enough volume to hold muscle' },
      { label: '2 conditioning sessions', detail: 'Intervals or circuits to nudge the recomposition' },
      { label: 'Protein each meal' },
    ],
    patternsToWatch: ['protein shortfall', 'recovery between sessions', 'sleep under 6h'],
    briefingEmphasis:
      'Emphasize recomposition: enough protein and lifting to hold muscle while leaning out gradually.',
  },
  other: {
    goalId: 'other',
    name: 'Something else',
    detail: 'A general baseline — refine it in chat',
    quote: 'Tell the coach what healthier means to you, and the plan will shape to it.',
    colorKey: 'muted',
    rings: { protein_g: 160, calories: 2400 },
    checklist: [
      { label: 'Move daily' },
      { label: 'Strength 2–3×/week' },
      { label: 'Protein each meal' },
    ],
    patternsToWatch: ['sleep under 6h', 'protein shortfall'],
    briefingEmphasis:
      'A general stewardship baseline — adjust the plan as the goal becomes clearer in conversation.',
  },
};

export function trackingPlanFor(goal: GoalId): TrackingPlan {
  return TRACKING_PLANS[goal];
}

// The primary plan — drives the rings/targets.
export function activeTrackingPlan(profile: Pick<Profile, 'activeGoal'>): TrackingPlan {
  return TRACKING_PLANS[profile.activeGoal];
}

type GoalSelection = Pick<Profile, 'activeGoal'> & Partial<Pick<Profile, 'secondaryGoals'>>;

// All selected goal ids — primary first, secondaries after, de-duplicated.
export function selectedGoalIds(profile: GoalSelection): GoalId[] {
  const ids = [profile.activeGoal, ...(profile.secondaryGoals ?? [])];
  return ids.filter((id, i) => ids.indexOf(id) === i);
}

export function selectedTrackingPlans(profile: GoalSelection): TrackingPlan[] {
  return selectedGoalIds(profile).map(id => TRACKING_PLANS[id]);
}

// Union of checklist items across all selected plans (deduped by label),
// primary plan's items first. Used by the Workouts tab + system prompt.
export function mergedChecklist(profile: GoalSelection): ChecklistItem[] {
  const seen = new Set<string>();
  const out: ChecklistItem[] = [];
  for (const plan of selectedTrackingPlans(profile)) {
    for (const item of plan.checklist) {
      if (!seen.has(item.label)) {
        seen.add(item.label);
        out.push(item);
      }
    }
  }
  return out;
}

// Union of watched patterns across all selected plans (deduped).
export function mergedPatternsToWatch(profile: GoalSelection): string[] {
  const set = new Set<string>();
  for (const plan of selectedTrackingPlans(profile)) {
    for (const p of plan.patternsToWatch) set.add(p);
  }
  return [...set];
}
