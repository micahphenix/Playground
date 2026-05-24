// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Ask Guru chat + Other-issue care synthesis
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { CareCard } from '../data/issueModel';

interface LawnContext {
  grassType: string;
  zone: string;
  sqft: number;
  irrigation: string;
  sun: string;
}

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

const MODEL = 'claude-opus-4-7';

/**
 * Send a single question to Guru and return a 2–4 sentence answer.
 * The lawn profile is injected into the system prompt so responses are
 * never generic.
 */
export async function askGuru(question: string, lawn: LawnContext): Promise<string> {
  const client = getClient();
  if (!client) {
    return "Couldn't reach Guru right now. Check your connection and try again.";
  }

  const profile = `Lawn profile: ${lawn.grassType}, ${lawn.zone}, ${lawn.sqft} sq ft, ${lawn.irrigation}, ${lawn.sun}.`;
  const system = `You are "Guru," a calm, knowledgeable lawn-care advisor for a homeowner. Their lawn profile is ALWAYS in context — never give generic advice. ${profile} Be confident, warm, plain-spoken. 2-4 sentences. No bullet points, no headers. Speak like a knowledgeable neighbor on a back porch.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: question }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return text || "Couldn't reach Guru right now. Check your connection and try again.";
  } catch {
    return "Couldn't reach Guru right now. Check your connection and try again.";
  }
}

/**
 * Diagnose an "Other" issue from a free-form description and return a
 * structured CareCard.  Falls back to the canned synthesis if the
 * response is unparseable.
 */
export async function diagnoseOtherIssue(
  args: { description: string; zone: string; hasPhoto: boolean },
  lawn: LawnContext,
): Promise<CareCard | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `You are Guru, a calm, knowledgeable lawn-care advisor for a homeowner.
They couldn't categorize their issue — read what they wrote and diagnose
it from their lawn profile.

LAWN PROFILE: ${lawn.grassType}, ${lawn.zone}, ${lawn.sqft} sq ft, ${lawn.irrigation}, ${lawn.sun}
LOCATION ON LAWN: ${args.zone || 'unspecified'}
THEIR DESCRIPTION: ${args.description || '(no description provided)'}
PHOTO ATTACHED: ${args.hasPhoto ? 'yes' : 'no'}

Respond with ONLY valid JSON, no prose before or after. Match this shape exactly:
{ "title": "...", "recommendation": "...", "product": "...",
  "rate": "...", "total": "...", "steps": [ "..." ] }`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    let text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(text) as CareCard;
    if (!parsed.title || !Array.isArray(parsed.steps)) return null;
    return parsed;
  } catch {
    return null;
  }
}
