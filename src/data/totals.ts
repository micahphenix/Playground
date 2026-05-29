import type { LogEntry } from './types';

export interface DayTotals {
  kcal: number;
  protein_g: number;
}

// Sums macros for entries logged on the given ISO day (default: today).
// Non-meal entries and entries without macros contribute nothing.
export function sumDayTotals(log: LogEntry[], isoDay = new Date().toISOString().slice(0, 10)): DayTotals {
  let kcal = 0;
  let protein_g = 0;
  for (const e of log) {
    if (e.createdAt.slice(0, 10) !== isoDay) continue;
    if (e.macros) {
      kcal += e.macros.kcal;
      protein_g += e.macros.protein_g;
    }
  }
  return { kcal, protein_g };
}
