import { sumDayTotals, sumDayLoad } from '../totals';
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

describe('sumDayLoad', () => {
  const day = '2026-07-31';
  const at = (h: number) => new Date(2026, 6, 31, h).toISOString();

  function workout(p: { durationMin?: number; activeKcal?: number; hour?: number }) {
    return {
      id: Math.random().toString(),
      kind: 'workout' as const,
      title: 'ride',
      workout: { type: 'cycling', durationMin: p.durationMin ?? 0, activeKcal: p.activeKcal },
      source: 'quick' as const,
      createdAt: at(p.hour ?? 9),
    };
  }

  it('sums sessions, minutes and active calories for the day', () => {
    const load = sumDayLoad([workout({ durationMin: 126, activeKcal: 714 }), workout({ durationMin: 45, activeKcal: 300 })], day);
    expect(load).toEqual({ workouts: 2, minutes: 171, activeKcal: 1014 });
  });

  it('ignores meals — intake and expenditure are never netted together', () => {
    const meal = {
      id: 'm',
      kind: 'meal' as const,
      title: 'lunch',
      macros: { kcal: 600, protein_g: 40, carb_g: 50, fat_g: 20 },
      source: 'quick' as const,
      createdAt: at(12),
    };
    expect(sumDayLoad([meal, workout({ durationMin: 30 })], day)).toEqual({
      workouts: 1,
      minutes: 30,
      activeKcal: 0,
    });
  });

  it('tolerates a workout logged with no numbers on it', () => {
    expect(sumDayLoad([workout({})], day)).toEqual({ workouts: 1, minutes: 0, activeKcal: 0 });
  });

  it('is empty on a rest day', () => {
    expect(sumDayLoad([], day)).toEqual({ workouts: 0, minutes: 0, activeKcal: 0 });
  });
});
