import { toHistory } from '../chatHistory';
import type { Message } from '../../data/types';

function msg(p: Partial<Message>): Message {
  return { id: p.id ?? 'x', role: p.role ?? 'user', createdAt: '2026-07-27T12:00:00.000Z', ...p } as Message;
}

describe('toHistory', () => {
  it('maps roles to the API shape', () => {
    expect(
      toHistory([msg({ role: 'user', text: 'hi' }), msg({ role: 'coach', text: 'hey' })]),
    ).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hey' },
    ]);
  });

  it('drops photo-only bubbles, which carry no text', () => {
    expect(toHistory([msg({ role: 'user', photoUri: 'file://a.jpg' }), msg({ role: 'user', text: 'and this' })])).toEqual(
      [{ role: 'user', content: 'and this' }],
    );
  });

  it('drops inline pattern cards — UI affordances, not turns', () => {
    expect(
      toHistory([msg({ role: 'coach', text: 'calf again', patternFlagId: 'p1' }), msg({ role: 'coach', text: 'real' })]),
    ).toEqual([{ role: 'assistant', content: 'real' }]);
  });

  it('preserves order so follow-ups keep their referent', () => {
    const out = toHistory([
      msg({ role: 'user', text: 'what about dinner' }),
      msg({ role: 'coach', text: 'depends' }),
      msg({ role: 'user', text: 'instead of lunch?' }),
    ]);
    expect(out.map(m => m.content)).toEqual(['what about dinner', 'depends', 'instead of lunch?']);
  });

  it('handles an empty transcript', () => {
    expect(toHistory([])).toEqual([]);
  });
});
