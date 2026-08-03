import { normalizePhotoReading, type PhotoAnalysis, type ParsedEntry } from '../coach';

const meal: PhotoAnalysis = {
  title: 'Chicken rice bowl',
  description: 'Estimated.',
  confidence: 0.8,
  items: [],
  total: { kcal: 600, protein_g: 45, carb_g: 60, fat_g: 15 },
};

const ride: ParsedEntry = {
  kind: 'workout',
  title: 'Road cycling — base aerobic',
  detail: '126 min · 714 active kcal',
  workout: { type: 'cycling', durationMin: 126, activeKcal: 714, avgHr: 128 },
};

describe('normalizePhotoReading', () => {
  it('routes a real meal to the meal confirm', () => {
    expect(normalizePhotoReading({ kind: 'meal', meal })).toEqual({ kind: 'meal', analysis: meal });
  });

  it('routes a workout screenshot to entries, not a meal sheet', () => {
    // The July 31 defect: a cycling summary was read correctly at 95%
    // confidence and then poured into a meal sheet with 0 kcal / 0g protein.
    const out = normalizePhotoReading({ kind: 'entries', reply: 'Bigger than planned.', entries: [ride] });
    expect(out.kind).toBe('entries');
    if (out.kind !== 'entries') return;
    expect(out.entries[0].workout?.activeKcal).toBe(714);
    expect(out.reply).toBe('Bigger than planned.');
  });

  it('trusts the payload over a mislabelled kind', () => {
    // Model says "meal" but hands back workout entries and no meal object.
    const out = normalizePhotoReading({ kind: 'meal', entries: [ride] });
    expect(out.kind).toBe('entries');
  });

  it('falls back to the meal object when entries come back empty', () => {
    expect(normalizePhotoReading({ kind: 'entries', meal, entries: [] }).kind).toBe('meal');
  });

  it('carries a photographed body scan through as an entry', () => {
    const scan: ParsedEntry = {
      kind: 'weigh-in',
      title: 'InBody scan',
      body: { weightLb: 190, bodyFatPct: 18.2, leanLb: 82, scan: 'inbody' },
    };
    const out = normalizePhotoReading({ kind: 'entries', reply: 'Down 1.8% since June.', entries: [scan] });
    if (out.kind !== 'entries') throw new Error('expected entries');
    expect(out.entries[0].body?.bodyFatPct).toBe(18.2);
  });

  it('drops malformed entries rather than logging junk', () => {
    const out = normalizePhotoReading({
      kind: 'entries',
      reply: 'ok',
      entries: [ride, {} as ParsedEntry, { kind: 'workout' } as ParsedEntry],
    });
    if (out.kind !== 'entries') throw new Error('expected entries');
    expect(out.entries).toHaveLength(1);
  });

  it('says so plainly when nothing is readable', () => {
    const out = normalizePhotoReading({ kind: 'unreadable', reply: 'Too blurry to read the numbers.' });
    expect(out).toEqual({ kind: 'unreadable', reply: 'Too blurry to read the numbers.' });
  });

  it('never returns an empty reply on an unreadable photo', () => {
    const out = normalizePhotoReading({});
    expect(out.kind).toBe('unreadable');
    if (out.kind !== 'unreadable') return;
    expect(out.reply.length).toBeGreaterThan(10);
  });
});
