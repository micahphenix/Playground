import {
  collapseByDate,
  compositionDeltas,
  daysBetween,
  deriveMaintenance,
  fatMassLb,
  leanMassLb,
  readLossRate,
  weeklyTrend,
  type IntakeDay,
  type WeighIn,
} from '../bodyModel';

// Window ends 2026-07-31; days 0-6 are the recent half, 7-13 the prior half.
const ASOF = '2026-07-31';

function dayBefore(n: number): string {
  const d = new Date(Date.UTC(2026, 6, 31));
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Steady loss: prior week averages 191, recent week 190 → -1 lb/week.
function steadyLoss(): WeighIn[] {
  const out: WeighIn[] = [];
  for (let n = 0; n < 7; n++) out.push({ date: dayBefore(n), lb: 190 });
  for (let n = 7; n < 14; n++) out.push({ date: dayBefore(n), lb: 191 });
  return out;
}

function intakeEveryDay(kcal: number, days = 14): IntakeDay[] {
  return Array.from({ length: days }, (_, n) => ({ date: dayBefore(n), kcal }));
}

describe('daysBetween', () => {
  it('counts calendar days forward', () => {
    expect(daysBetween('2026-07-24', '2026-07-31')).toBe(7);
    expect(daysBetween('2026-07-31', '2026-07-31')).toBe(0);
  });

  it('survives a month boundary', () => {
    expect(daysBetween('2026-06-28', '2026-07-02')).toBe(4);
  });
});

describe('collapseByDate', () => {
  it('means multiple weigh-ins on one day and sorts', () => {
    expect(
      collapseByDate([
        { date: '2026-07-30', lb: 191 },
        { date: '2026-07-29', lb: 190 },
        { date: '2026-07-30', lb: 189 },
      ]),
    ).toEqual([
      { date: '2026-07-29', lb: 190 },
      { date: '2026-07-30', lb: 190 },
    ]);
  });
});

describe('weeklyTrend', () => {
  it('differences the two 7-day means', () => {
    const t = weeklyTrend(steadyLoss(), ASOF)!;
    expect(t.weeklyDeltaLb).toBeCloseTo(-1, 5);
    expect(t.recentMeanLb).toBeCloseTo(190, 5);
    expect(t.priorMeanLb).toBeCloseTo(191, 5);
    expect(t.recentCount).toBe(7);
    expect(t.priorCount).toBe(7);
  });

  it('returns null when a half is empty — a delta against nothing is noise', () => {
    const recentOnly = [0, 1, 2].map(n => ({ date: dayBefore(n), lb: 190 }));
    expect(weeklyTrend(recentOnly, ASOF)).toBeNull();
  });

  it('ignores weigh-ins outside the window and in the future', () => {
    const t = weeklyTrend(
      [...steadyLoss(), { date: dayBefore(40), lb: 220 }, { date: '2026-08-05', lb: 150 }],
      ASOF,
    )!;
    expect(t.weeklyDeltaLb).toBeCloseTo(-1, 5);
    expect(t.recentCount + t.priorCount).toBe(14);
  });

  it('cancels a one-day water spike through the 7-day mean', () => {
    const spiked = steadyLoss().map(w => (w.date === dayBefore(2) ? { ...w, lb: 194 } : w));
    const t = weeklyTrend(spiked, ASOF)!;
    // 4 lb spike spread over 7 days moves the mean by ~0.57, not by 4.
    expect(t.weeklyDeltaLb).toBeGreaterThan(-0.5);
    expect(t.weeklyDeltaLb).toBeLessThan(-0.4);
  });
});

describe('deriveMaintenance', () => {
  it('derives maintenance above intake when losing weight', () => {
    // 2,150 kcal/day at -1 lb/week ⇒ 500/day deficit ⇒ ~2,650 maintenance.
    const m = deriveMaintenance(steadyLoss(), intakeEveryDay(2150), ASOF, 2600);
    expect(m.kind).toBe('measured');
    if (m.kind !== 'measured') return;
    expect(m.kcal).toBe(2650);
    expect(m.meanIntakeKcal).toBe(2150);
    expect(m.weeklyDeltaLb).toBeCloseTo(-1, 2);
    expect(m.confidence).toBe('solid');
  });

  it('derives maintenance below intake when gaining weight', () => {
    const gaining = steadyLoss().map(w => ({ ...w, lb: w.lb === 190 ? 191 : 190 }));
    const m = deriveMaintenance(gaining, intakeEveryDay(2650), ASOF, 2600);
    if (m.kind !== 'measured') throw new Error('expected measured');
    expect(m.weeklyDeltaLb).toBeCloseTo(1, 2);
    expect(m.kcal).toBe(2150);
  });

  it('reports maintenance ≈ intake when weight is flat', () => {
    const flat = Array.from({ length: 14 }, (_, n) => ({ date: dayBefore(n), lb: 190 }));
    const m = deriveMaintenance(flat, intakeEveryDay(2400), ASOF, 2600);
    if (m.kind !== 'measured') throw new Error('expected measured');
    expect(m.kcal).toBe(2400);
  });

  it('falls back to the static estimate on a cold start', () => {
    const m = deriveMaintenance([], [], ASOF, 2600);
    expect(m).toMatchObject({ kind: 'estimate', kcal: 2600, reason: 'cold-start' });
  });

  it('refuses a measured number when weigh-ins are too sparse', () => {
    const sparse = [
      { date: dayBefore(1), lb: 190 },
      { date: dayBefore(9), lb: 191 },
    ];
    const m = deriveMaintenance(sparse, intakeEveryDay(2150), ASOF, 2600);
    expect(m).toMatchObject({ kind: 'estimate', reason: 'sparse-data' });
    if (m.kind !== 'estimate') return;
    expect(m.daysUntilMeasurable).toBeGreaterThan(0);
  });

  it('refuses a measured number when intake logging is too sparse', () => {
    const m = deriveMaintenance(steadyLoss(), intakeEveryDay(2150, 4), ASOF, 2600);
    expect(m).toMatchObject({ kind: 'estimate', reason: 'sparse-data' });
  });

  it('never treats an unlogged day as a zero-calorie day', () => {
    // 10 logged days at 2,150 and 4 unlogged. Averaging zeros in would drag the
    // mean to ~1,536 and invent a deficit that never happened.
    const m = deriveMaintenance(steadyLoss(), intakeEveryDay(2150, 10), ASOF, 2600);
    if (m.kind !== 'measured') throw new Error('expected measured');
    expect(m.meanIntakeKcal).toBe(2150);
  });

  it('marks a thin-but-usable window as rough rather than solid', () => {
    const thin: WeighIn[] = [0, 1, 2, 7, 8, 9].map(n => ({ date: dayBefore(n), lb: n < 7 ? 190 : 191 }));
    const m = deriveMaintenance(thin, intakeEveryDay(2150, 10), ASOF, 2600);
    if (m.kind !== 'measured') throw new Error('expected measured');
    expect(m.confidence).toBe('rough');
  });
});

describe('readLossRate', () => {
  it('reads the target band from the direction note', () => {
    expect(readLossRate(0.5)).toBe('gaining');
    expect(readLossRate(0)).toBe('maintaining');
    expect(readLossRate(-0.75)).toBe('on-target');
    expect(readLossRate(-1.0)).toBe('on-target');
    expect(readLossRate(-1.25)).toBe('fast');
    expect(readLossRate(-2.0)).toBe('too-fast');
  });
});

describe('body composition', () => {
  const july: import('../bodyModel').BodyScan = { date: '2026-07-01', weightLb: 200, bodyFatPct: 20 };
  const sept: import('../bodyModel').BodyScan = { date: '2026-09-01', weightLb: 190, bodyFatPct: 16 };

  it('splits a scan into fat and lean mass', () => {
    expect(fatMassLb(july)).toBeCloseTo(40, 5);
    expect(leanMassLb(july)).toBeCloseTo(160, 5);
  });

  it('attributes weight change to fat vs lean between two real scans', () => {
    // 200→190 lb, 20%→16% BF: fat 40→30.4 (−9.6), lean 160→159.6 (−0.4).
    // Ten pounds down, almost all of it fat — the answer the scale can't give.
    expect(compositionDeltas([july, sept])).toEqual([
      { fromDate: '2026-07-01', toDate: '2026-09-01', weightLb: -10, fatLb: -9.6, leanLb: -0.4 },
    ]);
  });

  it('orders scans chronologically regardless of input order', () => {
    expect(compositionDeltas([sept, july])[0].fromDate).toBe('2026-07-01');
  });

  it('reports nothing from a single scan — one point is not a trajectory', () => {
    expect(compositionDeltas([july])).toEqual([]);
    expect(compositionDeltas([])).toEqual([]);
  });
});
