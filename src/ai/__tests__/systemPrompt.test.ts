import { buildSystemPrompt } from '../systemPrompt';
import { defaultProfile } from '../../data/seed';
import type { LogEntry, PatternFlag, Profile } from '../../data/types';

function profileWith(overrides: Partial<Profile> = {}): Profile {
  return { ...defaultProfile(), ...overrides };
}

const log: LogEntry[] = [
  {
    id: '1',
    kind: 'meal',
    title: 'Chicken rice bowl',
    macros: { kcal: 710, protein_g: 52, carb_g: 78, fat_g: 18 },
    source: 'photo',
    createdAt: '2026-05-23T12:30:00.000Z',
  },
];

const patterns: PatternFlag[] = [
  {
    id: 'p1',
    topic: 'Right calf · mention frequency',
    summary: '4 mentions in 3 weeks',
    mentions: [],
    status: 'open',
    tone: 'accent',
    createdAt: '2026-05-23T00:00:00.000Z',
  },
];

describe('buildSystemPrompt — handoff prompt requirements', () => {
  const out = buildSystemPrompt({ profile: profileWith(), recentLog: log, openPatterns: patterns });

  it('names the user and frames stewardship tone', () => {
    expect(out).toContain('Aaron');
    expect(out.toLowerCase()).toContain('stewardship');
    expect(out.toLowerCase()).toContain('never sham'); // "never shaming"
  });

  it('includes hard constraints verbatim', () => {
    expect(out).toContain('squats off-limits');
    expect(out).toContain('GERD');
  });

  it('includes targets and active goal', () => {
    expect(out).toContain('185');
    expect(out).toContain('2600');
    expect(out).toContain('muscle');
  });

  it('includes recent log entries', () => {
    expect(out).toContain('Chicken rice bowl');
  });

  it('includes open patterns', () => {
    expect(out).toContain('Right calf');
  });

  it('shows the ride target date when pinned', () => {
    const withDate = buildSystemPrompt({
      profile: profileWith({ activeGoal: 'ride', rideTargetDate: '2026-07-18' }),
      recentLog: [],
      openPatterns: [],
    });
    expect(withDate).toContain('2026-07-18');
  });

  it('degrades gracefully with empty log and patterns', () => {
    const empty = buildSystemPrompt({ profile: profileWith(), recentLog: [], openPatterns: [] });
    expect(empty).toContain('(empty)');
    expect(empty).toContain('(none open)');
  });
});
