import { sumDayTotals } from '../totals';
import type { LogEntry } from '../types';

function entry(partial: Partial<LogEntry> & Pick<LogEntry, 'createdAt'>): LogEntry {
  return {
    id: Math.random().toString(36),
    kind: 'meal',
    title: 'x',
    source: 'text',
    ...partial,
  };
}

describe('sumDayTotals', () => {
  const day = '2026-05-23';

  it('sums kcal and protein for entries on the given day', () => {
    const log: LogEntry[] = [
      entry({ createdAt: `${day}T08:00:00.000Z`, macros: { kcal: 250, protein_g: 27, carb_g: 38, fat_g: 3 } }),
      entry({ createdAt: `${day}T13:00:00.000Z`, macros: { kcal: 710, protein_g: 52, carb_g: 78, fat_g: 18 } }),
    ];
    expect(sumDayTotals(log, day)).toEqual({ kcal: 960, protein_g: 79 });
  });

  it('excludes entries from other days', () => {
    const log: LogEntry[] = [
      entry({ createdAt: `${day}T08:00:00.000Z`, macros: { kcal: 250, protein_g: 27, carb_g: 38, fat_g: 3 } }),
      entry({ createdAt: `2026-05-22T20:00:00.000Z`, macros: { kcal: 999, protein_g: 99, carb_g: 0, fat_g: 0 } }),
    ];
    expect(sumDayTotals(log, day)).toEqual({ kcal: 250, protein_g: 27 });
  });

  it('ignores entries without macros (e.g. recovery notes)', () => {
    const log: LogEntry[] = [
      entry({ kind: 'recovery', createdAt: `${day}T07:00:00.000Z`, recovery: { sleepHrs: 6 } }),
      entry({ createdAt: `${day}T12:00:00.000Z`, macros: { kcal: 400, protein_g: 30, carb_g: 20, fat_g: 10 } }),
    ];
    expect(sumDayTotals(log, day)).toEqual({ kcal: 400, protein_g: 30 });
  });

  it('returns zeros for an empty log', () => {
    expect(sumDayTotals([], day)).toEqual({ kcal: 0, protein_g: 0 });
  });
});
