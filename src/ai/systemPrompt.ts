import type { LogEntry, PatternFlag, Profile } from '../data/types';
import {
  activeTrackingPlan,
  selectedTrackingPlans,
  mergedChecklist,
  mergedPatternsToWatch,
} from '../data/trackingPlans';

// The handoff is explicit about what must be in every system prompt:
// static profile, dynamic profile, trend context, pattern memory, tone.
// We keep this as a single string so the structure is auditable.

interface BuildArgs {
  profile: Profile;
  recentLog: LogEntry[];
  openPatterns: PatternFlag[];
}

export function buildSystemPrompt({ profile, recentLog, openPatterns }: BuildArgs): string {
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
    `  Protein target ${plan.rings.protein_g} g/day · Maintenance ${plan.rings.calories} kcal/day`,
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
    'BEHAVIOR',
    '  Recommend the next wise step, given everything above.',
    '  Do not wait to be asked — if a real pattern emerges, raise it (in chat, never via push).',
    '  Estimates are estimates. No fake precision.',
  ].join('\n');
}
