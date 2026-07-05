import Anthropic from '@anthropic-ai/sdk';
import type { LogEntry, MealItem, PatternFlag, Profile } from '../data/types';
import { buildSystemPrompt } from './systemPrompt';
import { weekSummaryBlock } from '../data/weekSummary';
import { parseJsonish } from './json';

// Single point of contact with Anthropic. Screens never import the SDK directly.
//
// API key strategy: read EXPO_PUBLIC_ANTHROPIC_API_KEY at module load. Fine for
// dev; for production we'll proxy through a server we control (the SDK supports
// a baseURL override).

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// Two tiers. Synthesis calls (chat, briefing, recap, pattern scan) get the
// full Opus model — quality shows there. Extraction calls (interpret, parse,
// photo) get Sonnet: same structured output, much lower latency per message.
// Sonnet 5 runs adaptive thinking when `thinking` is omitted, so the
// extraction paths disable it explicitly to keep replies snappy and stop
// thinking tokens from eating the max_tokens budget before the JSON lands.
const MODEL = 'claude-opus-4-8';
const FAST_MODEL = 'claude-sonnet-5';
const NO_THINKING = { type: 'disabled' } as const;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_ANTHROPIC_API_KEY');
  if (!client) client = new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
  return client;
}

export function hasApiKey(): boolean {
  return Boolean(API_KEY);
}

interface CoachContext {
  profile: Profile;
  recentLog: LogEntry[];
  openPatterns: PatternFlag[];
}

export interface ChatMessageIn {
  role: 'user' | 'assistant';
  content: string;
}

// 1) Chat — Today / pattern-flag conversations.
export async function chat(messages: ChatMessageIn[], ctx: CoachContext): Promise<string> {
  const system = buildSystemPrompt(ctx);
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 600,
    system,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });
  const out = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
  return out || "I'm here, but the words aren't coming through. Try again?";
}

// 2) Photo analysis — read a meal and propose a structured log entry.
export interface PhotoAnalysis {
  title: string;
  description: string;
  confidence: number; // 0-1
  items: MealItem[];
  total: { kcal: number; protein_g: number; carb_g: number; fat_g: number };
}

const PHOTO_PROMPT = `You are reading a photo of a meal. Identify what's on the plate and
estimate portion + macros. Output ONLY valid JSON matching this shape, nothing else:

{
  "title": "short name, e.g. 'Chicken rice bowl'",
  "description": "one sentence — what you see, called out as estimates",
  "confidence": 0.0-1.0,
  "items": [
    { "name": "string", "qty": "string e.g. '6 oz'", "kcal": number, "protein_g": number, "carb_g": number, "fat_g": number }
  ],
  "total": { "kcal": number, "protein_g": number, "carb_g": number, "fat_g": number }
}

Be honest about uncertainty in the description. If something is occluded, say so.`;

export async function analyzeMealPhoto(base64Jpeg: string, ctx: CoachContext): Promise<PhotoAnalysis> {
  const res = await getClient().messages.create({
    model: FAST_MODEL,
    thinking: NO_THINKING,
    max_tokens: 800,
    system: buildSystemPrompt(ctx) + '\n\n' + PHOTO_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg },
          },
          { type: 'text', text: 'Read this meal.' },
        ],
      },
    ],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  return parseJsonish<PhotoAnalysis>(text);
}

// 3) Voice / text parsing — interpret a freeform log into structured fields.
export type ParsedKind = 'meal' | 'workout' | 'recovery' | 'note';

export interface ParsedEntry {
  kind: ParsedKind;
  title: string;
  detail?: string;
  macros?: { kcal: number; protein_g: number; carb_g: number; fat_g: number };
  workout?: { type: string; durationMin: number; rpe?: number };
  recovery?: { sleepHrs?: number; soreness?: string; mood?: string };
  // The coach can hint at a profile update — e.g. "tweaked calf" → +limitation
  proposedLimitation?: { label: string; note?: string };
}

export interface ParseResult {
  entries: ParsedEntry[];
  clarifyingQuestions: string[];
}

const PARSE_PROMPT = `You are parsing a freeform log entry from the user. Output ONLY valid JSON.

The user may mention multiple things at once: a meal AND a recovery note AND a
profile-affecting injury. Return one entry per thing in entries[].

Shape:
{
  "entries": [
    {
      "kind": "meal" | "workout" | "recovery" | "note",
      "title": "string",
      "detail": "string (optional)",
      "macros": { "kcal": n, "protein_g": n, "carb_g": n, "fat_g": n }   // meals only
      "workout": { "type": "...", "durationMin": n, "rpe": n }            // workouts only
      "recovery": { "sleepHrs": n, "soreness": "...", "mood": "..." }     // recovery only
      "proposedLimitation": { "label": "...", "note": "..." }             // if user mentioned an injury / tweak
    }
  ],
  "clarifyingQuestions": []  // only if a critical detail is missing
}`;

export async function parseFreeform(raw: string, ctx: CoachContext): Promise<ParseResult> {
  const res = await getClient().messages.create({
    model: FAST_MODEL,
    thinking: NO_THINKING,
    max_tokens: 800,
    system: buildSystemPrompt(ctx) + '\n\n' + PARSE_PROMPT,
    messages: [{ role: 'user', content: raw }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  return parseJsonish<ParseResult>(text);
}

// 3b) Interpret — single call that decides whether the user logged something,
// asked a question, or both. Used by the chat surface so users don't have to
// pick a mode.
export interface InterpretResult {
  // Loggable entries the coach extracted. Empty for pure conversation.
  entries: ParsedEntry[];
  // Conversational reply. Always present.
  reply: string;
  // Whether the user mentioned something profile-affecting (injury, plan change).
  // Captured inside entries[].proposedLimitation; surfaced separately here for
  // routing the ProfileUpdateModal.
  hasProfileProposal: boolean;
}

const INTERPRET_PROMPT = `Read what the user just said. Decide what it is and respond accordingly.

Output ONLY valid JSON, this exact shape:

{
  "reply": "your conversational response — 2-4 sentences, stewardship tone, no headers, no bullets. If they logged something, briefly acknowledge it.",
  "entries": [
    // ONE entry per concrete thing they logged. Empty array if they only asked a question.
    {
      "kind": "meal" | "workout" | "recovery" | "note",
      "title": "string",
      "detail": "string (optional)",
      "macros": { "kcal": n, "protein_g": n, "carb_g": n, "fat_g": n },
      "workout": { "type": "...", "durationMin": n, "rpe": n },
      "recovery": { "sleepHrs": n, "soreness": "...", "mood": "..." },
      "proposedLimitation": { "label": "...", "note": "..." }
    }
  ]
}

Rules:
- If they're just asking a question, leave entries: [].
- If they logged a meal/workout/recovery, include it as an entry. Macros are estimates — say so in reply.
- If they mentioned an injury or limitation ("tweaked my calf", "knee's grumbling"), put it in entries[].proposedLimitation.
- Don't ask clarifying questions in reply unless something critical is missing.`;

// `history` is the running conversation (older turns first). Without it every
// message stands alone and follow-ups like "what about dinner instead?" lose
// their referent. Capped to the last 12 turns to bound tokens.
export async function interpret(
  raw: string,
  ctx: CoachContext,
  history: ChatMessageIn[] = [],
): Promise<InterpretResult> {
  // The API requires the first message to be a user turn — drop leading
  // assistant turns (the seeded greeting) after windowing.
  const window = history.slice(-12);
  while (window.length && window[0].role !== 'user') window.shift();
  const res = await getClient().messages.create({
    model: FAST_MODEL,
    thinking: NO_THINKING,
    max_tokens: 800,
    system: buildSystemPrompt(ctx) + '\n\n' + INTERPRET_PROMPT,
    messages: [
      ...window.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: raw },
    ],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  const parsed = parseJsonish<{ entries?: ParsedEntry[]; reply?: string }>(text);
  const entries = parsed.entries ?? [];
  return {
    entries,
    reply: parsed.reply ?? "I'm here.",
    hasProfileProposal: entries.some(e => !!e.proposedLimitation),
  };
}

// 4) Morning briefing — interprets yesterday + recent context into a serif lead.
export interface BriefingDraft {
  headline: string; // may include {{em:...}} for inline italic accent
  body: string;
  actions: { label: string; kind: 'primary' | 'alt' | 'ghost' }[];
}

const BRIEFING_PROMPT = `Write the user's morning briefing.

Output ONLY valid JSON:
{
  "headline": "one short sentence; wrap one short clause in {{em:like this}} for italic accent",
  "body": "one or two sentences. Interpret, don't just quote numbers.",
  "actions": [{"label":"...","kind":"primary"|"alt"|"ghost"}]  // 1-3 suggested next moves
}

Stewardship tone. Honest about uncertainty. Never shame.`;

export async function generateBriefing(ctx: CoachContext): Promise<BriefingDraft> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 400,
    system: buildSystemPrompt(ctx) + '\n\n' + BRIEFING_PROMPT,
    messages: [{ role: 'user', content: "Write today's morning briefing." }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  return parseJsonish<BriefingDraft>(text);
}


// 5) LLM-driven pattern scan. Looks across recent logs + open patterns for
// signals worth surfacing. Returns flag *candidates* — the UI decides whether
// to persist them.
export interface PatternCandidate {
  topic: string;
  summary: string;
  mentions: { at: string; context: string }[];
  tone: 'accent' | 'accentAlt' | 'warn';
}

const PATTERN_PROMPT = `Look across the user's recent log and current open patterns. Identify
patterns the coach should raise IF they cross the threshold of "worth flagging."

A pattern is worth flagging when ONE of these is true:
- Same complaint appears 3+ times in 3 weeks
- A target is missed 4+ days in a row
- A sequence of bad recovery nights (5+ under 6 hours)
- A constraint is being approached repeatedly (e.g. "knee" mentions)

Output ONLY valid JSON:
{
  "patterns": [
    {
      "topic": "right calf · mention frequency",
      "summary": "4 mentions in 3 weeks · avg mile 15",
      "mentions": [{"at":"May 22","context":"…"}],
      "tone": "accent" | "accentAlt" | "warn"
    }
  ]
}

If nothing crosses the threshold, return { "patterns": [] }. Don't manufacture patterns to fill the array.`;

// 6) Weekly recap generation — synthesizes the week from log + patterns +
// existing memory into a serif lead + stat grid + lists + next-focus.
export interface RecapDraft {
  weekStart: string;
  headline: string;
  stats: { label: string; value: string; sub: string; tone: 'accent' | 'accentAlt' | 'warn' | 'good' }[];
  whatWorked: string[];
  whatWasHard: string[];
  nextFocus: string;
}

const RECAP_PROMPT = `Synthesize a weekly recap for the user. Look at the last 7 days of log
entries, open patterns, and the active goal. Tone: stewardship — honest about
what didn't go well, generous about what did, never shaming.

Output ONLY valid JSON:
{
  "weekStart": "YYYY-MM-DD (Monday of the week being recapped)",
  "headline": "one quoted serif lead, 1-2 sentences — interpret, don't list",
  "stats": [
    { "label": "Protein hit", "value": "4/7", "sub": "days at target", "tone": "accent" | "accentAlt" | "warn" | "good" }
    // 3-4 stats total. value is short. sub is one-line context.
  ],
  "whatWorked": ["..."],    // 2-4 items
  "whatWasHard": ["..."],   // 1-3 items, honest
  "nextFocus": "2-3 sentences — what to weight next week"
}

If there isn't enough data for a real recap, say so in the headline and keep
the lists short.`;

export async function generateRecap(ctx: CoachContext): Promise<RecapDraft> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 900,
    system: buildSystemPrompt(ctx) + '\n\n' + weekSummaryBlock(ctx.recentLog) + '\n\n' + RECAP_PROMPT,
    messages: [{ role: 'user', content: "Recap the past week." }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  return parseJsonish<RecapDraft>(text);
}

export async function detectPatterns(ctx: CoachContext): Promise<PatternCandidate[]> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 600,
    system: buildSystemPrompt(ctx) + '\n\n' + weekSummaryBlock(ctx.recentLog) + '\n\n' + PATTERN_PROMPT,
    messages: [{ role: 'user', content: 'Scan for patterns.' }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  const parsed = parseJsonish<{ patterns?: PatternCandidate[] }>(text);
  return parsed.patterns ?? [];
}
