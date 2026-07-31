import type { LogEntry, MemoryItem, PatternFlag, Profile } from '../data/types';
import {
  activeTrackingPlan,
  selectedTrackingPlans,
  mergedChecklist,
  mergedPatternsToWatch,
} from '../data/trackingPlans';
import { todayLocal } from '../data/day';
import {
  allScans,
  compositionDeltas,
  deriveMaintenance,
  intakeDaysFromLog,
  readLossRate,
  weeklyTrend,
  weighInsFromLog,
  type Maintenance,
} from '../data/bodyModel';

// The handoff is explicit about what must be in every system prompt:
// static profile, dynamic profile, trend context, pattern memory, tone.
// We keep this as a single string so the structure is auditable.

interface BuildArgs {
  profile: Profile;
  recentLog: LogEntry[];
  openPatterns: PatternFlag[];
  // Optional so existing callers keep working. Memory only supplies scans
  // recorded before the structured schema existed.
  memory?: MemoryItem[];
  // Injectable "today" so the body-model block is testable.
  today?: string;
}

const LOSS_PHRASING: Record<ReturnType<typeof readLossRate>, string> = {
  gaining: 'gaining',
  maintaining: 'holding steady',
  'on-target': 'on target for a cut (0.5-1.0 lb/wk)',
  fast: 'a little fast — watch for under-eating',
  'too-fast': 'too fast — this is under-eating, not winning. Add food back.',
};

function maintenanceLines(m: Maintenance): string[] {
  if (m.kind === 'estimate') {
    return [
      `  Maintenance ~${m.kcal} kcal/day — STATIC ESTIMATE, never verified against real data.`,
      m.reason === 'cold-start'
        ? '  No weigh-in history yet, so nothing has been measured.'
        : `  Logging is too sparse to measure it — roughly ${m.daysUntilMeasurable} more consistent day(s) needed.`,
      '  Do NOT present this number as measured. If it comes up, say it is still an estimate.',
    ];
  }
  const qualifier = m.confidence === 'solid' ? 'solid' : 'rough — thin data, treat as directional';
  return [
    `  Maintenance ~${m.kcal} kcal/day — MEASURED from ${m.intakeDayCount} logged days and ${m.weighInCount} weigh-ins (${qualifier}).`,
    `  Derived, not guessed: averaged ${m.meanIntakeKcal} kcal/day while weight moved ${m.weeklyDeltaLb > 0 ? '+' : ''}${m.weeklyDeltaLb} lb/week.`,
    '  This supersedes any generic calculator estimate. It also drifts down as bodyweight drops, and is recomputed continuously —',
    '  so if intake holds steady and weight stalls, maintenance has moved, not willpower.',
  ];
}

// The body model, rendered for the coach. Exported for direct testing.
export function bodyModelBlock(
  log: LogEntry[],
  memory: MemoryItem[],
  asOf: string,
  staticEstimateKcal: number,
): string[] {
  const weighIns = weighInsFromLog(log);
  const maintenance = deriveMaintenance(weighIns, intakeDaysFromLog(log), asOf, staticEstimateKcal);
  const lines = ['BODY MODEL (measured from this user\'s own data — not a calculator)', ...maintenanceLines(maintenance)];

  const trend = weeklyTrend(weighIns, asOf);
  if (trend) {
    lines.push(
      `  Weight: ${trend.recentMeanLb.toFixed(1)} lb (7-day average, vs ${trend.priorMeanLb.toFixed(1)} the week before) — ${LOSS_PHRASING[readLossRate(trend.weeklyDeltaLb)]}.`,
      '  Single-morning readings are water noise. Only ever discuss the weekly average.',
    );
  }

  const deltas = compositionDeltas(allScans(log, memory));
  if (deltas.length) {
    lines.push('', 'BODY COMPOSITION (only from real scans)');
    for (const d of deltas) {
      const fmt = (n: number) => `${n > 0 ? '+' : ''}${n} lb`;
      lines.push(`  ${d.fromDate} → ${d.toDate}: ${fmt(d.weightLb)} total — ${fmt(d.fatLb)} fat, ${fmt(d.leanLb)} lean.`);
    }
    lines.push(
      '  Between scans the fat/lean split is NOT measurable. Never estimate it — the scale cannot tell fat from muscle,',
      '  which is the whole reason scans matter. Say plainly that the next scan will answer it.',
    );
  }
  return lines;
}

export function buildSystemPrompt({ profile, recentLog, openPatterns, memory = [], today }: BuildArgs): string {
  const constraints = profile.constraints.map(c => `  - ${c}`).join('\n');
  const limitations = profile.limitations.length
    ? profile.limitations.map(l => `  - ${l.label}${l.note ? ` — ${l.note}` : ''}`).join('\n')
    : '  - (none active)';

  const recent = recentLog
    .slice(0, 12)
    .map(e => `  - [${e.kind}] ${e.title}${e.macros ? ` (${e.macros.kcal} kcal · ${e.macros.protein_g}g P)` : ''}`)
    .join('\n');

  const patterns = openPatterns.length
    ? openPatterns.map(p => `  - ${p.topic} — ${p.summary} (${p.status})`).join('\n')
    : '  - (none open)';

  const plan = activeTrackingPlan(profile);
  const secondaryNames = selectedTrackingPlans(profile)
    .slice(1)
    .map(p => p.name);
  const checklist = mergedChecklist(profile)
    .map(c => `  - ${c.label}${c.detail ? ` (${c.detail})` : ''}`)
    .join('\n');
  const watching = mergedPatternsToWatch(profile)
    .map(p => `  - ${p}`)
    .join('\n');

  return [
    `You are Steward, a personal body-stewardship coach for ${profile.name}.`,
    '',
    'TONE',
    '  Warm. Honest. Grounded. Stewardship-oriented, never shaming.',
    "  The body is a stewardship responsibility, not a project to optimize.",
    '  Be convicting but never harsh. Be calibrated about uncertainty — say so when an estimate is rough.',
    '  Speak like a knowledgeable friend on a back porch. 2-4 sentences. No bullet points. No headers.',
    '',
    'HARD CONSTRAINTS (never violate)',
    constraints || '  - (none)',
    '',
    'CURRENT LIMITATIONS (recent flexion notes)',
    limitations,
    '',
    'PROFILE',
    `  ${profile.age} yo · ${profile.location}`,
    // Deliberately "target", not "maintenance". During a cut the ring target IS
    // the deficit — labelling it maintenance told the coach that eating to
    // target meant holding weight. Real maintenance is in the BODY MODEL block.
    `  Protein target ${plan.rings.protein_g} g/day · Daily calorie target ${plan.rings.calories} kcal/day`,
    `  Primary goal: ${plan.name}${profile.eventLabel ? ` — ${profile.eventLabel}` : ''}${profile.rideTargetDate ? ` (target ${profile.rideTargetDate})` : ''}`,
    secondaryNames.length ? `  Also tracking: ${secondaryNames.join(', ')}` : '  Also tracking: (none)',
    `  Emphasis: ${plan.briefingEmphasis}`,
    '',
    'GOALS — WEEKLY CHECKLIST',
    checklist,
    '',
    'GOALS — PATTERNS TO WATCH',
    watching,
    '',
    'RECENT LOG (most recent first)',
    recent || '  - (empty)',
    '',
    'OPEN PATTERNS',
    patterns,
    '',
    ...bodyModelBlock(recentLog, memory, today ?? todayLocal(), plan.rings.calories),
    '',
    'BEHAVIOR',
    '  Recommend the next wise step, given everything above.',
    '  Do not wait to be asked — if a real pattern emerges, raise it (in chat, never via push).',
    '  Estimates are estimates. No fake precision.',
  ].join('\n');
}
