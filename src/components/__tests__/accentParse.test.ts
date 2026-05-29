import { parseAccentText } from '../accentParse';

describe('parseAccentText', () => {
  it('returns a single plain segment when there are no markers', () => {
    expect(parseAccentText('Just a normal line.')).toEqual([{ text: 'Just a normal line.', em: false }]);
  });

  it('splits a single em clause with surrounding text', () => {
    expect(parseAccentText('Sleep was rough — {{em:third night under six.}}')).toEqual([
      { text: 'Sleep was rough — ', em: false },
      { text: 'third night under six.', em: true },
    ]);
  });

  it('handles an em clause at the start', () => {
    expect(parseAccentText('{{em:Heads up}} — protein is short.')).toEqual([
      { text: 'Heads up', em: true },
      { text: ' — protein is short.', em: false },
    ]);
  });

  it('handles multiple em clauses', () => {
    expect(parseAccentText('{{em:A}} and {{em:B}} today')).toEqual([
      { text: 'A', em: true },
      { text: ' and ', em: false },
      { text: 'B', em: true },
      { text: ' today', em: false },
    ]);
  });

  it('reassembles to the original text when markers are stripped', () => {
    const input = 'Lead {{em:accent}} tail';
    const joined = parseAccentText(input)
      .map(s => s.text)
      .join('');
    expect(joined).toBe('Lead accent tail');
  });
});
