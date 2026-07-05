import type { LogEntry } from './types';

// Computed grounding for the LLM's weekly recap and pattern scan. The system
// prompt only carries the 12 most recent log entries — a normal week exceeds
// that, so without this block the model synthesizes from a partial window
// without knowing it. This walks the FULL log for the last 7 days and emits a
// compact per-day table the model can trust as fact.

export interface DaySummary {
  isoDay: string; // YYYY-MM-DD
  meals: number;
  kcal: number;
  protein_g: number;
  workouts: number;
  workoutMin: number;
  sleepHrs: number | null; // last recovery entry of the day that carried sleep
}

// Summarize the 7 calendar days ending on `endDay` (inclusive), oldest first.
// Days with no entries are still emitted so gaps are visible to the model.
export function summarizeWeek(
  log: LogEntry[],
  endDay = new Date().toISOString().slice(0, 10),
): DaySummary[] {
  const days: DaySummary[] = [];
  const end = new Date(endDay + 'T00:00:00Z');
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const isoDay = d.toISOString().slice(0, 10);
    const day: DaySummary = {
      isoDay,
      meals: 0,
      kcal: 0,
      protein_g: 0,
      workouts: 0,
      workoutMin: 0,
      sleepHrs: null,
    };
    for (const e of log) {
      if (e.createdAt.slice(0, 10) !== isoDay) continue;
      if (e.kind === 'meal') {
        day.meals += 1;
        if (e.macros) {
          day.kcal += e.macros.kcal;
          day.protein_g += e.macros.protein_g;
        }
      } else if (e.kind === 'workout') {
        day.workouts += 1;
        day.workoutMin += e.workout?.durationMin ?? 0;
      } else if (e.kind === 'recovery' && e.recovery?.sleepHrs != null) {
        day.sleepHrs = e.recovery.sleepHrs;
      }
    }
    days.push(day);
  }
  return days;
}

// Render the summary as a prompt block. Honest about blanks — "no entries"
// is data (a day the user didn't log), not something to smooth over.
export function weekSummaryBlock(
  log: LogEntry[],
  endDay = new Date().toISOString().slice(0, 10),
): string {
  const lines = summarizeWeek(log, endDay).map(d => {
    const parts: string[] = [];
    if (d.meals > 0) parts.push(`${d.meals} meals · ${d.kcal} kcal · ${d.protein_g}g protein`);
    if (d.workouts > 0) parts.push(`${d.workouts} workout${d.workouts > 1 ? 's' : ''} (${d.workoutMin} min)`);
    if (d.sleepHrs != null) parts.push(`slept ${d.sleepHrs}h`);
    return `  ${d.isoDay}: ${parts.length ? parts.join(' · ') : '(no entries)'}`;
  });
  return [
    'WEEK DATA (computed from the full log — treat as fact, not estimate)',
    ...lines,
  ].join('\n');
}
