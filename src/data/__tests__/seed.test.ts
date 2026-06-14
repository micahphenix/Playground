import { defaultProfile, seedLog, seedMemory, seedPatterns, seedRecaps } from '../seed';

describe('seed data', () => {
  it('defaultProfile reflects the handoff user', () => {
    const p = defaultProfile();
    expect(p.name).toBe('Aaron');
    expect(p.age).toBe(33);
    expect(p.activeGoal).toBe('muscle');
    expect(p.rideTargetDate).toBeNull();
    // Constraint reflects the June 2026 rehab progression, not a permanent ban.
    expect(p.constraints.join(' ')).toMatch(/no loaded squats/i);
    expect(p.constraints.join(' ')).toMatch(/GERD/);
    // Active calf strain seeded as a current limitation.
    expect(p.limitations.some(l => /calf/i.test(l.label))).toBe(true);
  });

  it('seedLog produces meals with macros', () => {
    const log = seedLog();
    expect(log.length).toBeGreaterThan(0);
    for (const e of log) {
      expect(e.kind).toBe('meal');
      expect(e.macros).toBeDefined();
      expect(e.id).toBeTruthy();
    }
  });

  it('seed collections have unique ids', () => {
    const ids = [...seedMemory(), ...seedPatterns(), ...seedRecaps()].map(x => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('seedPatterns includes the calf pattern with mentions', () => {
    const calf = seedPatterns().find(p => /calf/i.test(p.topic));
    expect(calf).toBeDefined();
    expect(calf!.mentions.length).toBeGreaterThanOrEqual(3);
  });
});
