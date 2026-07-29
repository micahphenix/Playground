import { parseAccentText } from '../components/accentParse';

// Turning a briefing into the opening turn of a conversation.
//
// Briefing actions used to be terminal: tap "Plan an early wind-down tonight"
// and the app wrote a memory row and closed the card. Nothing was actually
// discussed. Now the tap seeds the chat instead — the briefing becomes the
// coach's opening turn, the tapped label becomes the user's reply, and the
// coach responds to it for real.

// The briefing headline carries {{em:...}} markers for the italic accent. The
// coach should read the sentence, not the markup.
export function plainHeadline(headline: string): string {
  return parseAccentText(headline)
    .map(s => s.text)
    .join('')
    .trim();
}

// The coach turn that opens the thread: exactly what the card said, so the
// conversation reads as a continuation of what the user was just looking at
// rather than starting cold.
export function briefingSeed(headline: string, body: string): string {
  const lead = plainHeadline(headline);
  const rest = body.trim();
  return rest ? `${lead}\n\n${rest}` : lead;
}
