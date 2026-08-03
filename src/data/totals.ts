import type { LogEntry } from './types';
import { localDay, todayLocal } from './day';

export interface DayTotals {
  kcal: number;
  protein_g: number;
}

export interface DayLoad {
  workouts: number;
  minutes: number;
  // What the watch said was burned. Deliberately kept OUT of the maintenance
  // calculation — the weight trend already absorbed this expenditure, so
  // feeding it back would double-count. It's here for load and recovery talk.
  activeKcal: number;
}

// Training load for a day. Separate from DayTotals because intake and
// expenditure answer different questions and must never be netted together.
export function sumDayLoad(log: LogEntry[], isoDay = todayLocal()): DayLoad {
  const load: DayLoad = { workouts: 0, minutes: 0, activeKcal: 0 };
  for (const e of log) {
    if (e.kind !== 'workout' || localDay(e.createdAt) !== isoDay) continue;
    load.workouts += 1;
    load.minutes += e.workout?.durationMin ?? 0;
    load.activeKcal += e.workout?.activeKcal ?? 0;
  }
  return load;
}

// Sums macros for entries logged on the given ISO day (default: today).
// Non-meal entries and entries without macros contribute nothing.
export function sumDayTotals(log: LogEntry[], isoDay = todayLocal()): DayTotals {
  let kcal = 0;
  let protein_g = 0;
  for (const e of log) {
    if (localDay(e.createdAt) !== isoDay) continue;
    if (e.macros) {
      kcal += e.macros.kcal;
      protein_g += e.macros.protein_g;
    }
  }
  return { kcal, protein_g };
}
