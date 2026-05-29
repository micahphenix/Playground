import { detectMissedProtein } from '../patterns';
import type { LogEntry } from '../../data/types';

function meal(day: string, protein_g: number): LogEntry {
  return {
    id: `${day}-${protein_g}`,
    kind: 'meal',
    title: 'meal',
    macros: { kcal: protein_g * 5, protein_g, carb_g: 0, fat_g: 0 },
    source: 'text',
    createdAt: `${day}T12:00:00.000Z`,
  };
}

describe('detectMissedProtein', () => {
  it('returns null with fewer than 3 days of data', () => {
    const log = [meal('2026-05-20', 100), meal('2026-05-21', 100)];
    expect(detectMissedProtein(log, 185)).toBeNull();
  });

  it('returns null when most days hit target', () => {
    const log = [
      meal('2026-05-20', 190),
      meal('2026-05-21', 188),
      meal('2026-05-22', 186),
    ];
    expect(detectMissedProtein(log, 185)).toBeNull();
  });

  it('flags when at least half of days fall short', () => {
    const log = [
      meal('2026-05-20', 120),
      meal('2026-05-21', 130),
      meal('2026-05-22', 110),
    ];
    const flag = detectMissedProtein(log, 185);
    expect(flag).not.toBeNull();
    expect(flag!.topic.toLowerCase()).toContain('protein');
    expect(flag!.mentions.length).toBe(3);
  });

  it('aggregates multiple meals within the same day', () => {
    const log = [
      meal('2026-05-20', 90),
      meal('2026-05-20', 90), // same day → 180 total, above 0.9*185=166.5
      meal('2026-05-21', 100),
      meal('2026-05-22', 100),
    ];
    const flag = detectMissedProtein(log, 185);
    // Day 05-20 totals 180 (a hit); 05-21 and 05-22 are shortfalls → 2 of 3 short.
    expect(flag).not.toBeNull();
    expect(flag!.mentions.length).toBe(2);
  });
});
