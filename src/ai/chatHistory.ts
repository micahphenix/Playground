import type { Message } from '../data/types';
import type { ChatMessageIn } from './coach';

// Shared by every surface that can start a conversation (Chat and the Today
// composer). Both write into the same transcript, so both need the same rule
// for what counts as a conversational turn.
//
// Skipped: photo-only bubbles (no text) and inline pattern cards
// (patternFlagId) — they're UI affordances, not things the coach "said".
export function toHistory(msgs: Message[]): ChatMessageIn[] {
  return msgs
    .filter(m => m.text && !m.patternFlagId && (m.role === 'user' || m.role === 'coach'))
    .map(m => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.text! }));
}
