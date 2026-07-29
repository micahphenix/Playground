import { briefingSeed, plainHeadline } from '../briefingThread';

describe('plainHeadline', () => {
  it('strips the italic accent markers', () => {
    expect(plainHeadline("Three short nights this week — {{em:that's the thread worth pulling}}.")).toBe(
      "Three short nights this week — that's the thread worth pulling.",
    );
  });

  it('handles a headline with no markers', () => {
    expect(plainHeadline('Quiet week so far.')).toBe('Quiet week so far.');
  });

  it('handles multiple accent clauses', () => {
    expect(plainHeadline('{{em:Sleep}} is the thread, and {{em:the calf}} is downstream.')).toBe(
      'Sleep is the thread, and the calf is downstream.',
    );
  });
});

describe('briefingSeed', () => {
  it('opens the thread with the headline and body the card showed', () => {
    expect(briefingSeed('{{em:Short nights}} again.', 'Sleep dipped under six hours three times.')).toBe(
      'Short nights again.\n\nSleep dipped under six hours three times.',
    );
  });

  it('omits the blank line when there is no body', () => {
    expect(briefingSeed('Short nights again.', '   ')).toBe('Short nights again.');
  });
});
