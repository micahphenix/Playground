import { localDay, shiftDay, todayLocal } from '../day';

describe('localDay', () => {
  it('returns the calendar day the user experienced, not the UTC one', () => {
    // The whole point: derive from the local calendar, never by slicing the
    // ISO string. In a UTC test environment these agree; west of Greenwich a
    // late-evening timestamp would not.
    const iso = '2026-07-30T23:30:00.000Z';
    const d = new Date(iso);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(localDay(iso)).toBe(expected);
  });

  it('agrees with the local calendar across a month boundary', () => {
    const iso = '2026-07-31T22:00:00.000Z';
    expect(localDay(iso)).toBe(
      new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    );
  });

  it('falls back to the raw date rather than throwing on junk input', () => {
    expect(localDay('not-a-date')).toBe('not-a-date');
    expect(localDay('')).toBe('');
  });
});

describe('todayLocal', () => {
  it('is a well-formed YYYY-MM-DD', () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches the device calendar', () => {
    const n = new Date();
    expect(todayLocal()).toBe(
      `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`,
    );
  });
});

describe('shiftDay', () => {
  it('walks backwards and forwards', () => {
    expect(shiftDay('2026-07-31', -1)).toBe('2026-07-30');
    expect(shiftDay('2026-07-31', 1)).toBe('2026-08-01');
    expect(shiftDay('2026-07-31', 0)).toBe('2026-07-31');
  });

  it('crosses month and year boundaries', () => {
    expect(shiftDay('2026-08-01', -1)).toBe('2026-07-31');
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(shiftDay('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('walks a full week back without drifting across a DST boundary', () => {
    // Constructed at local noon precisely so a 1-hour shift can't land in the
    // neighbouring day. US DST ends Nov 1 2026.
    expect(shiftDay('2026-11-03', -7)).toBe('2026-10-27');
  });
});
