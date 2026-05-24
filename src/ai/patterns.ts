import type { LogEntry, PatternFlag } from '../data/types';

// Quick rule-based pattern detection. Runs on the client before / instead of
// an LLM call so the coach can surface things immediately. The handoff calls
// for richer pattern recognition later via the LLM.

export function detectMissedProtein(log: LogEntry[], targetG: number): PatternFlag | null {
  // last 7 distinct days
  const byDay = new Map<string, number>();
  log.forEach(e => {
    if (e.kind !== 'meal' || !e.macros) return;
    const day = e.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + e.macros.protein_g);
  });
  const days = [...byDay.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 7);
  if (days.length < 3) return null;
  const short = days.filter(([, g]) => g < targetG * 0.9);
  if (short.length < days.length / 2) return null;
  return {
    id: 'auto-protein',
    topic: 'Protein · running short',
    summary: `${short.length} of last ${days.length} days under target`,
    mentions: short.map(([d, g]) => ({ at: d, context: `${Math.round(g)}g of ${targetG}` })),
    status: 'open',
    tone: 'accentAlt',
    createdAt: new Date().toISOString(),
  };
}
