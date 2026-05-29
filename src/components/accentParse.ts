// Splits a string containing {{em:...}} markers into ordered segments so the
// briefing headline can render an inline italic accent clause. Pure + tested;
// AccentText consumes it.
export interface AccentSegment {
  text: string;
  em: boolean;
}

export function parseAccentText(input: string): AccentSegment[] {
  const parts: AccentSegment[] = [];
  let i = 0;
  const re = /\{\{em:([^}]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > i) parts.push({ text: input.slice(i, m.index), em: false });
    parts.push({ text: m[1], em: true });
    i = m.index + m[0].length;
  }
  if (i < input.length) parts.push({ text: input.slice(i), em: false });
  return parts;
}
