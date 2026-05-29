import { parseJsonish } from '../json';

describe('parseJsonish', () => {
  it('parses a bare JSON object', () => {
    expect(parseJsonish<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips ```json code fences', () => {
    const text = '```json\n{"title":"Chicken bowl","kcal":710}\n```';
    expect(parseJsonish<{ title: string; kcal: number }>(text)).toEqual({
      title: 'Chicken bowl',
      kcal: 710,
    });
  });

  it('strips plain ``` fences', () => {
    expect(parseJsonish<{ ok: boolean }>('```\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('ignores prose before and after the object', () => {
    const text = 'Here is what I read:\n{"protein_g":52}\nLet me know if that is off.';
    expect(parseJsonish<{ protein_g: number }>(text)).toEqual({ protein_g: 52 });
  });

  it('handles nested objects by taking the outer braces', () => {
    const text = 'noise {"a":{"b":2},"c":[1,2]} trailing';
    expect(parseJsonish<{ a: { b: number }; c: number[] }>(text)).toEqual({
      a: { b: 2 },
      c: [1, 2],
    });
  });

  it('throws on input with no JSON object', () => {
    expect(() => parseJsonish('no json here')).toThrow();
  });
});
