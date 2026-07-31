import {
  allScans,
  deriveMaintenance,
  intakeDaysFromLog,
  scansFromLegacyMemory,
  scansFromLog,
  weighInsFromLog,
} from '../bodyModel';
import type { LogEntry, MemoryItem } from '../types';

function entry(p: Partial<LogEntry>): LogEntry {
  return {
    id: p.id ?? 'x',
    kind: p.kind ?? 'meal',
    title: p.title ?? 't',
    source: 'quick',
    createdAt: p.createdAt ?? '2026-07-31T12:00:00.000Z',
    ...p,
  } as LogEntry;
}

function fact(headline: string, detail: string): MemoryItem {
  return { id: 'm', kind: 'fact', headline, detail, createdAt: '2026-07-31T12:00:00.000Z' };
}

describe('weighInsFromLog', () => {
  it('pulls dated weights off weigh-in entries', () => {
    expect(
      weighInsFromLog([
        entry({ kind: 'weigh-in', body: { weightLb: 190.4 }, createdAt: '2026-07-30T11:00:00.000Z' }),
        entry({ kind: 'meal', macros: { kcal: 600, protein_g: 40, carb_g: 50, fat_g: 20 } }),
      ]),
    ).toEqual([{ date: '2026-07-30', lb: 190.4 }]);
  });

  it('ignores weigh-in entries with no number on them', () => {
    expect(weighInsFromLog([entry({ kind: 'weigh-in', body: { bodyFatPct: 18 } })])).toEqual([]);
    expect(weighInsFromLog([entry({ kind: 'weigh-in' })])).toEqual([]);
  });

  it('includes full scans — a scan is a weigh-in that also knows composition', () => {
    const out = weighInsFromLog([
      entry({ kind: 'weigh-in', body: { weightLb: 188, bodyFatPct: 17, scan: 'inbody' } }),
    ]);
    expect(out).toEqual([{ date: '2026-07-31', lb: 188 }]);
  });
});

describe('intakeDaysFromLog', () => {
  it('takes kcal from any entry carrying macros', () => {
    expect(
      intakeDaysFromLog([
        entry({ macros: { kcal: 600, protein_g: 40, carb_g: 50, fat_g: 20 } }),
        entry({ macros: { kcal: 550, protein_g: 35, carb_g: 40, fat_g: 18 } }),
      ]),
    ).toEqual([
      { date: '2026-07-31', kcal: 600 },
      { date: '2026-07-31', kcal: 550 },
    ]);
  });

  it('skips entries with no macros, so untracked days stay absent not zero', () => {
    expect(intakeDaysFromLog([entry({ kind: 'note' }), entry({ kind: 'weigh-in', body: { weightLb: 190 } })])).toEqual(
      [],
    );
  });
});

describe('scansFromLog', () => {
  it('requires both weight and body fat to anchor anything', () => {
    expect(scansFromLog([entry({ kind: 'weigh-in', body: { weightLb: 190 } })])).toEqual([]);
    expect(
      scansFromLog([entry({ kind: 'weigh-in', body: { weightLb: 190, bodyFatPct: 18.5, scan: 'inbody' } })]),
    ).toEqual([{ date: '2026-07-31', weightLb: 190, bodyFatPct: 18.5 }]);
  });
});

describe('scansFromLegacyMemory', () => {
  it('reads scans recorded before the schema existed', () => {
    expect(
      scansFromLegacyMemory([fact('InBody · 2026-06-14', 'Weight 195 lb · 20.1% BF · 172 lb SMM')]),
    ).toEqual([{ date: '2026-06-14', weightLb: 195, bodyFatPct: 20.1 }]);
  });

  it('reads DEXA rows the same way', () => {
    expect(scansFromLegacyMemory([fact('DEXA · 2026-05-02', 'Weight 200 lb · 22% BF')])).toEqual([
      { date: '2026-05-02', weightLb: 200, bodyFatPct: 22 },
    ]);
  });

  it('skips rows saved with em-dash placeholders', () => {
    expect(scansFromLegacyMemory([fact('InBody · 2026-06-14', 'Weight — lb · —% BF · — lb SMM')])).toEqual([]);
  });

  it('ignores unrelated memory facts', () => {
    expect(scansFromLegacyMemory([fact('Knee replacement', 'Aug 2025 · 8 mo post-op')])).toEqual([]);
  });
});

describe('allScans', () => {
  it('merges structured and legacy scans in date order', () => {
    const log = [entry({ kind: 'weigh-in', body: { weightLb: 190, bodyFatPct: 18, scan: 'inbody' } })];
    const memory = [fact('InBody · 2026-06-14', 'Weight 195 lb · 20.1% BF · 172 lb SMM')];
    expect(allScans(log, memory).map(s => s.date)).toEqual(['2026-06-14', '2026-07-31']);
  });

  it('lets a re-entered scan supersede its legacy string rather than double-count', () => {
    const log = [
      entry({
        kind: 'weigh-in',
        createdAt: '2026-06-14T12:00:00.000Z',
        body: { weightLb: 196, bodyFatPct: 20, scan: 'inbody' },
      }),
    ];
    const memory = [fact('InBody · 2026-06-14', 'Weight 195 lb · 20.1% BF · 172 lb SMM')];
    const out = allScans(log, memory);
    expect(out).toHaveLength(1);
    expect(out[0].weightLb).toBe(196);
  });
});

describe('log → maintenance, end to end', () => {
  it('derives maintenance straight off a realistic log', () => {
    const log: LogEntry[] = [];
    for (let n = 0; n < 14; n++) {
      const d = new Date(Date.UTC(2026, 6, 31));
      d.setUTCDate(d.getUTCDate() - n);
      const day = d.toISOString().slice(0, 10);
      log.push(
        entry({
          kind: 'weigh-in',
          createdAt: `${day}T11:00:00.000Z`,
          body: { weightLb: n < 7 ? 190 : 191 },
        }),
      );
      log.push(
        entry({
          kind: 'meal',
          createdAt: `${day}T18:00:00.000Z`,
          macros: { kcal: 2150, protein_g: 185, carb_g: 200, fat_g: 70 },
        }),
      );
    }
    const m = deriveMaintenance(weighInsFromLog(log), intakeDaysFromLog(log), '2026-07-31', 2600);
    expect(m.kind).toBe('measured');
    if (m.kind !== 'measured') return;
    expect(m.kcal).toBe(2650);
    expect(m.confidence).toBe('solid');
  });
});
