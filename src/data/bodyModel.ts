// The body model — maintenance as a MEASUREMENT, not an estimate.
//
// Static calculators guess maintenance and never learn whether the guess was
// right. Given the user's own intake and morning weigh-ins, we can derive it:
// whatever they burned through training, steps and NEAT is already absorbed by
// the scale, so none of it needs modelling separately. Average over a long
// enough window and daily noise cancels.
//
//   maintenance = meanDailyIntake − (weeklyWeightDelta_lb × 3500 / 7)
//
// Losing 1 lb/week on 2,150 kcal ⇒ 2,150 − (−1 × 500) ⇒ ~2,650 true maintenance.
//
// Design decisions (the direction note asked these be thought through — see
// docs/direction-2026-07-28-body-model-engine.md):
//
// · Windowing: weekly-MEAN DIFFERENCING over 14 days, not an exponentially
//   weighted average. An EWMA is statistically tidier but opaque; this number
//   drives real food decisions and has to be checkable by hand. Each 7-day mean
//   also cancels water-weight swings on its own.
// · Confidence: the window has to actually contain data. Sparse logging returns
//   a lower confidence or no number at all — never a confident-looking number
//   built on three weigh-ins. ("No fake precision" is a standing principle.)
// · Cold start: before the window fills, fall back to the static estimate and
//   say so, with how many more days are needed.

import type { LogEntry, MemoryItem } from './types';
import { localDay } from './day';

export const KCAL_PER_LB = 3500;
export const WINDOW_DAYS = 14;
const HALF = WINDOW_DAYS / 2;

// Minimum data density before we'll quote a measured number at all.
const MIN_WEIGH_INS_PER_HALF = 3;
const MIN_INTAKE_DAYS = 9;
// Above this, the number is solid; below it we quote but flag it.
const SOLID_WEIGH_INS_PER_HALF = 5;
const SOLID_INTAKE_DAYS = 12;

export interface WeighIn {
  date: string; // YYYY-MM-DD
  lb: number;
}

export interface IntakeDay {
  date: string; // YYYY-MM-DD
  kcal: number;
}

export interface MeasuredMaintenance {
  kind: 'measured';
  kcal: number;
  weeklyDeltaLb: number;
  meanIntakeKcal: number;
  confidence: 'solid' | 'rough';
  weighInCount: number;
  intakeDayCount: number;
}

export interface EstimatedMaintenance {
  kind: 'estimate';
  kcal: number;
  reason: 'cold-start' | 'sparse-data';
  // How many more days of consistent logging before a measured number lands.
  daysUntilMeasurable: number;
}

export type Maintenance = MeasuredMaintenance | EstimatedMaintenance;

// --- date helpers -----------------------------------------------------------
// Dates are YYYY-MM-DD, so lexical compare is chronological. Arithmetic goes
// through UTC to dodge DST shifting a day.

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

function mean(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

// Several weigh-ins on one day (re-steps on the scale) collapse to their mean,
// so a chatty morning doesn't outvote a quiet one.
export function collapseByDate(weighIns: WeighIn[]): WeighIn[] {
  const byDate = new Map<string, number[]>();
  for (const w of weighIns) {
    const list = byDate.get(w.date);
    if (list) list.push(w.lb);
    else byDate.set(w.date, [w.lb]);
  }
  return [...byDate.entries()]
    .map(([date, lbs]) => ({ date, lb: mean(lbs) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface WeeklyTrend {
  weeklyDeltaLb: number;
  recentMeanLb: number;
  priorMeanLb: number;
  recentCount: number;
  priorCount: number;
}

// Difference of two 7-day means across a 14-day window ending at `asOf`.
// Returns null when either half is empty — a delta against nothing is noise.
export function weeklyTrend(weighIns: WeighIn[], asOf: string): WeeklyTrend | null {
  const collapsed = collapseByDate(weighIns);
  const recent: number[] = [];
  const prior: number[] = [];
  for (const w of collapsed) {
    const age = daysBetween(w.date, asOf);
    if (age < 0 || age >= WINDOW_DAYS) continue;
    if (age < HALF) recent.push(w.lb);
    else prior.push(w.lb);
  }
  if (!recent.length || !prior.length) return null;
  const recentMeanLb = mean(recent);
  const priorMeanLb = mean(prior);
  return {
    weeklyDeltaLb: recentMeanLb - priorMeanLb,
    recentMeanLb,
    priorMeanLb,
    recentCount: recent.length,
    priorCount: prior.length,
  };
}

// Days with any intake logged inside the window. A day the user didn't log is
// NOT a zero-calorie day — it's a missing sample, and averaging zeros into the
// mean would fabricate a deficit that never happened.
function intakeInWindow(intake: IntakeDay[], asOf: string): number[] {
  const byDate = new Map<string, number>();
  for (const d of intake) {
    const age = daysBetween(d.date, asOf);
    if (age < 0 || age >= WINDOW_DAYS) continue;
    byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.kcal);
  }
  return [...byDate.values()].filter(kcal => kcal > 0);
}

export function deriveMaintenance(
  weighIns: WeighIn[],
  intake: IntakeDay[],
  asOf: string,
  staticEstimateKcal: number,
): Maintenance {
  const trend = weeklyTrend(weighIns, asOf);
  const intakeDays = intakeInWindow(intake, asOf);

  const haveWeighIns =
    trend !== null &&
    trend.recentCount >= MIN_WEIGH_INS_PER_HALF &&
    trend.priorCount >= MIN_WEIGH_INS_PER_HALF;
  const haveIntake = intakeDays.length >= MIN_INTAKE_DAYS;

  if (!haveWeighIns || !haveIntake) {
    // Days still needed is driven by whichever stream is furthest behind.
    const weighInsShort = trend
      ? Math.max(0, MIN_WEIGH_INS_PER_HALF - Math.min(trend.recentCount, trend.priorCount))
      : MIN_WEIGH_INS_PER_HALF;
    const intakeShort = Math.max(0, MIN_INTAKE_DAYS - intakeDays.length);
    return {
      kind: 'estimate',
      kcal: staticEstimateKcal,
      reason: trend === null ? 'cold-start' : 'sparse-data',
      daysUntilMeasurable: Math.max(weighInsShort, intakeShort),
    };
  }

  const meanIntakeKcal = mean(intakeDays);
  const dailyDeficit = (trend.weeklyDeltaLb * KCAL_PER_LB) / 7;
  const solid =
    Math.min(trend.recentCount, trend.priorCount) >= SOLID_WEIGH_INS_PER_HALF &&
    intakeDays.length >= SOLID_INTAKE_DAYS;

  return {
    kind: 'measured',
    kcal: Math.round(meanIntakeKcal - dailyDeficit),
    weeklyDeltaLb: Number(trend.weeklyDeltaLb.toFixed(2)),
    meanIntakeKcal: Math.round(meanIntakeKcal),
    confidence: solid ? 'solid' : 'rough',
    weighInCount: trend.recentCount + trend.priorCount,
    intakeDayCount: intakeDays.length,
  };
}

// --- rate-of-loss read ------------------------------------------------------
// The direction note pins the target band at 0.5–1.0 lb/week, with faster than
// ~1.5 meaning under-eating rather than winning.

export type LossVerdict = 'gaining' | 'maintaining' | 'on-target' | 'fast' | 'too-fast';

export function readLossRate(weeklyDeltaLb: number): LossVerdict {
  if (weeklyDeltaLb > 0.25) return 'gaining';
  if (weeklyDeltaLb > -0.25) return 'maintaining';
  if (weeklyDeltaLb >= -1.0) return 'on-target';
  if (weeklyDeltaLb >= -1.5) return 'fast';
  return 'too-fast';
}

// --- body composition -------------------------------------------------------

export interface BodyScan {
  date: string; // YYYY-MM-DD
  weightLb: number;
  bodyFatPct: number; // e.g. 18.5
}

export interface CompositionDelta {
  fromDate: string;
  toDate: string;
  weightLb: number;
  fatLb: number;
  leanLb: number;
}

export function fatMassLb(scan: BodyScan): number {
  return scan.weightLb * (scan.bodyFatPct / 100);
}

export function leanMassLb(scan: BodyScan): number {
  return scan.weightLb - fatMassLb(scan);
}

// Fat-vs-muscle change is only ever reported BETWEEN TWO REAL SCANS.
//
// Deliberately no interpolation between them. With sparse scans and dense
// weight/intake you can bound the split, but you cannot measure it, and a
// plotted curve through the gap would read as knowledge the app doesn't have.
// The scale genuinely cannot tell fat from muscle — that's the whole reason
// scans anchor the model. So: measured deltas at the anchors, silence between.
// --- adapters: the log is the model's input -------------------------------
//
// Days are scoped by the UTC slice of `createdAt`, matching sumDayTotals, so
// the weight series and the intake series agree on what "a day" means.

// Every logged weight, whether a plain morning weigh-in or a full scan.
export function weighInsFromLog(log: LogEntry[]): WeighIn[] {
  const out: WeighIn[] = [];
  for (const e of log) {
    const lb = e.body?.weightLb;
    if (e.kind !== 'weigh-in' || typeof lb !== 'number') continue;
    out.push({ date: localDay(e.createdAt), lb });
  }
  return out;
}

// Only days with real logged intake. A day with no meals is absent from this
// list, never present as a zero — see deriveMaintenance.
export function intakeDaysFromLog(log: LogEntry[]): IntakeDay[] {
  const out: IntakeDay[] = [];
  for (const e of log) {
    if (!e.macros || e.macros.kcal <= 0) continue;
    out.push({ date: localDay(e.createdAt), kcal: e.macros.kcal });
  }
  return out;
}

// Composition scans need BOTH weight and body-fat to anchor anything.
export function scansFromLog(log: LogEntry[]): BodyScan[] {
  const out: BodyScan[] = [];
  for (const e of log) {
    const b = e.body;
    if (e.kind !== 'weigh-in' || !b) continue;
    if (typeof b.weightLb !== 'number' || typeof b.bodyFatPct !== 'number') continue;
    out.push({ date: localDay(e.createdAt), weightLb: b.weightLb, bodyFatPct: b.bodyFatPct });
  }
  return out;
}

// Scans recorded before this schema existed live as memory facts holding a
// display string: headline "InBody · 2026-06-14", detail "Weight 190 lb ·
// 18.5% BF · 172 lb SMM". Rather than rewrite stored data, we read it — the
// old entries still anchor the model, and nothing on the phone is touched.
const LEGACY_HEADLINE = /^(InBody|DEXA)\s*·\s*(\d{4}-\d{2}-\d{2})/i;

export function scansFromLegacyMemory(memory: MemoryItem[]): BodyScan[] {
  const out: BodyScan[] = [];
  for (const m of memory) {
    if (m.kind !== 'fact' || !m.detail) continue;
    const head = LEGACY_HEADLINE.exec(m.headline);
    if (!head) continue;
    const weight = /Weight\s+([\d.]+)\s*lb/i.exec(m.detail);
    const bf = /([\d.]+)\s*%\s*BF/i.exec(m.detail);
    if (!weight || !bf) continue; // "—" placeholders land here and are skipped
    out.push({ date: head[2], weightLb: Number(weight[1]), bodyFatPct: Number(bf[1]) });
  }
  return out;
}

// Structured entries win over legacy prose for the same date, so a re-entered
// scan supersedes its old string rather than double-counting.
export function allScans(log: LogEntry[], memory: MemoryItem[]): BodyScan[] {
  const structured = scansFromLog(log);
  const seen = new Set(structured.map(s => s.date));
  return [...structured, ...scansFromLegacyMemory(memory).filter(s => !seen.has(s.date))].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function compositionDeltas(scans: BodyScan[]): CompositionDelta[] {
  const sorted = [...scans].sort((a, b) => a.date.localeCompare(b.date));
  const out: CompositionDelta[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    out.push({
      fromDate: a.date,
      toDate: b.date,
      weightLb: Number((b.weightLb - a.weightLb).toFixed(1)),
      fatLb: Number((fatMassLb(b) - fatMassLb(a)).toFixed(1)),
      leanLb: Number((leanMassLb(b) - leanMassLb(a)).toFixed(1)),
    });
  }
  return out;
}
