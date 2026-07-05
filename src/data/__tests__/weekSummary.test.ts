import { summarizeWeek, weekSummaryBlock } from '../weekSummary';
import type { LogEntry } from '../types';

const END = '2026-07-05';

function entry(partial: Partial<LogEntry> & Pick<LogEntry, 'kind' | 'createdAt'>): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'x',
    source: 'text',
    ...partial,
  } as LogEntry;
}

describe('summarizeWeek', () => {
  it('emits exactly 7 days, oldest first, ending on endDay', () => {
    const days = summarizeWeek([], END);
    expect(days).toHaveLength(7);
    expect(days[0].isoDay).toBe('2026-06-29');
    expect(days[6].isoDay).toBe(END);
  });

  it('aggregates meals, workouts, and sleep per day', () => {
    const log: LogEntry[] = [
      entry({ kind: 'meal', createdAt: '2026-07-04T12:00:00Z', macros: { kcal: 600, protein_g: 40, carb_g: 50, fat_g: 20 } }),
      entry({ kind: 'meal', createdAt: '2026-07-04T18:00:00Z', macros: { kcal: 700, protein_g: 55, carb_g: 60, fat_g: 25 } }),
      entry({ kind: 'workout', createdAt: '2026-07-04T07:00:00Z', workout: { type: 'lift', durationMin: 45 } }),
      entry({ kind: 'recovery', createdAt: '2026-07-04T06:30:00Z', recovery: { sleepHrs: 7.2 } }),
    ];
    const day = summarizeWeek(log, END).find(d => d.isoDay === '2026-07-04')!;
    expect(day.meals).toBe(2);
    expect(day.kcal).toBe(1300);
    expect(day.protein_g).toBe(95);
    expect(day.workouts).toBe(1);
    expect(day.workoutMin).toBe(45);
    expect(day.sleepHrs).toBe(7.2);
  });

  it('ignores entries outside the 7-day window', () => {
    const log: LogEntry[] = [
      entry({ kind: 'meal', createdAt: '2026-06-28T12:00:00Z', macros: { kcal: 999, protein_g: 99, carb_g: 0, fat_g: 0 } }),
      entry({ kind: 'meal', createdAt: '2026-07-06T12:00:00Z', macros: { kcal: 999, protein_g: 99, carb_g: 0, fat_g: 0 } }),
    ];
    const days = summarizeWeek(log, END);
    expect(days.every(d => d.kcal === 0)).toBe(true);
  });

  it('meal without macros counts as a meal but adds nothing', () => {
    const log = [entry({ kind: 'meal', createdAt: '2026-07-05T12:00:00Z' })];
    const day = summarizeWeek(log, END).find(d => d.isoDay === END)!;
    expect(day.meals).toBe(1);
    expect(day.kcal).toBe(0);
  });
});

describe('weekSummaryBlock', () => {
  it('marks empty days honestly and includes logged days', () => {
    const log = [
      entry({ kind: 'meal', createdAt: '2026-07-03T12:00:00Z', macros: { kcal: 500, protein_g: 35, carb_g: 40, fat_g: 15 } }),
    ];
    const block = weekSummaryBlock(log, END);
    expect(block).toContain('WEEK DATA');
    expect(block).toContain('2026-07-03: 1 meals · 500 kcal · 35g protein');
    expect(block).toContain('2026-07-05: (no entries)');
  });
});
