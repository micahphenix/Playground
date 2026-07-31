// Which calendar day an entry belongs to, from the USER'S point of view.
//
// Everything used to derive this by slicing the ISO timestamp, which is UTC.
// For anyone west of Greenwich that pushes evening entries onto tomorrow: a
// 10pm dinner in US Central is 03:00 UTC the next day, so it landed on
// tomorrow's rings and vanished from today's totals. Micah is in Texas, so
// every late meal he has ever logged has been counted on the wrong day.
//
// It looked cosmetic while it only skewed rings. It stopped being cosmetic
// when the body model started requiring the weight series and the intake
// series to agree on where a day ends — a maintenance figure built from
// misaligned days is quietly wrong rather than obviously wrong.

function fromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// YYYY-MM-DD in the device's timezone. Falls back to the raw ISO date for
// unparseable input rather than throwing inside a render path.
export function localDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : fromDate(d);
}

export function todayLocal(): string {
  return fromDate(new Date());
}

// Walks back `n` local days from a YYYY-MM-DD key. Constructed at local noon so
// a DST transition can't shunt the result into the neighbouring day.
export function shiftDay(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const base = new Date(y, m - 1, d, 12, 0, 0, 0);
  base.setDate(base.getDate() + n);
  return fromDate(base);
}
