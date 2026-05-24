import Anthropic from '@anthropic-ai/sdk';
import type { LogEntry, MealItem, PatternFlag, Profile } from '../data/types';
import { buildSystemPrompt } from './systemPrompt';

// Single point of contact with Anthropic. Screens never import the SDK directly.
//
// API key strategy: read EXPO_PUBLIC_ANTHROPIC_API_KEY at module load. Fine for
// dev; for production we'll proxy through a server we control (the SDK supports
// a baseURL override).

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const MODEL = 'claude-opus-4-7';

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
    model: MODEL,
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
    model: MODEL,
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

// JSON parsing that tolerates the model adding stray prose or code fences.
function parseJsonish<T>(text: string): T {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1];
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s) as T;
}
