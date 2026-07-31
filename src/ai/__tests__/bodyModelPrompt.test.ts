import { bodyModelBlock } from '../systemPrompt';
import type { LogEntry, MemoryItem } from '../../data/types';

const ASOF = '2026-07-31';

function day(n: number): string {
  const d = new Date(Date.UTC(2026, 6, 31));
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function entry(p: Partial<LogEntry>): LogEntry {
  return { id: 'x', kind: 'meal', title: 't', source: 'quick', createdAt: `${day(0)}T12:00:00.000Z`, ...p } as LogEntry;
}

// 14 days of weigh-ins losing 1 lb/week, plus 14 days at 2,150 kcal.
function cuttingLog(): LogEntry[] {
  const log: LogEntry[] = [];
  for (let n = 0; n < 14; n++) {
    log.push(
      entry({ kind: 'weigh-in', createdAt: `${day(n)}T11:00:00.000Z`, body: { weightLb: n < 7 ? 190 : 191 } }),
    );
    log.push(
      entry({
        createdAt: `${day(n)}T18:00:00.000Z`,
        macros: { kcal: 2150, protein_g: 185, carb_g: 200, fat_g: 70 },
      }),
    );
  }
  return log;
}

describe('bodyModelBlock', () => {
  it('gives the coach a measured maintenance number, not the static estimate', () => {
    const text = bodyModelBlock(cuttingLog(), [], ASOF, 2600).join('\n');
    expect(text).toContain('Maintenance ~2650 kcal/day — MEASURED');
    expect(text).toContain('solid');
    expect(text).toContain('supersedes any generic calculator estimate');
  });

  it('reports the weekly average and reads the loss rate against the target band', () => {
    const text = bodyModelBlock(cuttingLog(), [], ASOF, 2600).join('\n');
    expect(text).toContain('190.0 lb (7-day average, vs 191.0 the week before)');
    expect(text).toContain('on target for a cut');
    expect(text).toContain('Single-morning readings are water noise');
  });

  it('calls out under-eating when the loss rate runs away', () => {
    const fast = cuttingLog().map(e =>
      e.kind === 'weigh-in' && e.body?.weightLb === 191 ? { ...e, body: { weightLb: 193 } } : e,
    );
    expect(bodyModelBlock(fast, [], ASOF, 2600).join('\n')).toContain('under-eating, not winning');
  });

  it('labels the cold-start estimate and forbids passing it off as measured', () => {
    const text = bodyModelBlock([], [], ASOF, 2600).join('\n');
    expect(text).toContain('STATIC ESTIMATE');
    expect(text).toContain('No weigh-in history yet');
    expect(text).toContain('Do NOT present this number as measured');
    expect(text).not.toContain('MEASURED from');
  });

  it('tells the coach how much more logging a real number needs', () => {
    const sparse = [
      entry({ kind: 'weigh-in', createdAt: `${day(1)}T11:00:00.000Z`, body: { weightLb: 190 } }),
      entry({ kind: 'weigh-in', createdAt: `${day(9)}T11:00:00.000Z`, body: { weightLb: 191 } }),
    ];
    const text = bodyModelBlock(sparse, [], ASOF, 2600).join('\n');
    expect(text).toContain('too sparse to measure');
    expect(text).toMatch(/more consistent day\(s\) needed/);
  });

  it('omits the composition section entirely when there are no scans', () => {
    expect(bodyModelBlock(cuttingLog(), [], ASOF, 2600).join('\n')).not.toContain('BODY COMPOSITION');
  });

  it('reports fat vs lean between two scans and refuses to guess between them', () => {
    const scans: LogEntry[] = [
      entry({
        kind: 'weigh-in',
        createdAt: '2026-05-01T12:00:00.000Z',
        body: { weightLb: 200, bodyFatPct: 20, scan: 'dexa' },
      }),
      entry({
        kind: 'weigh-in',
        createdAt: '2026-07-01T12:00:00.000Z',
        body: { weightLb: 190, bodyFatPct: 16, scan: 'dexa' },
      }),
    ];
    const text = bodyModelBlock([...cuttingLog(), ...scans], [], ASOF, 2600).join('\n');
    expect(text).toContain('BODY COMPOSITION');
    expect(text).toContain('2026-05-01 → 2026-07-01: -10 lb total — -9.6 lb fat, -0.4 lb lean');
    expect(text).toContain('NOT measurable');
    expect(text).toContain('Never estimate it');
  });

  it('anchors on scans recorded before the schema existed', () => {
    const memory: MemoryItem[] = [
      { id: 'a', kind: 'fact', headline: 'InBody · 2026-05-01', detail: 'Weight 200 lb · 20% BF', createdAt: 'x' },
      { id: 'b', kind: 'fact', headline: 'InBody · 2026-07-01', detail: 'Weight 190 lb · 16% BF', createdAt: 'x' },
    ];
    const text = bodyModelBlock(cuttingLog(), memory, ASOF, 2600).join('\n');
    expect(text).toContain('2026-05-01 → 2026-07-01');
    expect(text).toContain('-9.6 lb fat');
  });
});
