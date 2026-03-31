// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — LawnAI Service
//
// All Claude API calls are funnelled through this module. Keeps the AI layer
// cleanly separated from UI and storage concerns.
//
// Model: claude-opus-4-6 (adaptive thinking enabled for plan generation)
// Pattern: streaming for long outputs (plan generation), single call for
//          classification tasks (grass ID, issue recommendations).
//
// API key must be set via ANTHROPIC_API_KEY environment variable. In Expo,
// use a Constants.expoConfig.extra field or a config plugin to inject the key
// at build time — never ship it in client-side JS without obfuscation.
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { LawnProfile, IssueLog, GrassIdentification } from '../types/lawn';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

const getClient = (): Anthropic => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to your .env file and rebuild.',
    );
  }
  return new Anthropic({ apiKey });
};

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface GrassIdentificationResult {
  grass_type: string;
  confidence: number;
  description: string;
  care_summary: string;
  /** Raw reasoning from the model (available when thinking is enabled) */
  thinking?: string;
}

export interface MaintenancePlanResult {
  /** Full markdown text of the plan */
  plan_markdown: string;
  /** Parsed structured tasks for the calendar — extracted from the markdown */
  raw_json?: string;
}

export interface IssueRecommendationResult {
  recommendation: string;
  product_type: string;
  application_rate: string;
  timing: string;
  safety_notes: string;
}

// ---------------------------------------------------------------------------
// Shared system prompt fragment
// ---------------------------------------------------------------------------

const SYSTEM_BASE = `You are Grass Guru, an expert AI lawn care consultant. \
You give precise, regionally-appropriate, actionable advice. \
Always tailor your guidance to the specific grass type, climate zone, and \
current season. Be concise but thorough. Include product types (not brand names) \
and specific rates/quantities when relevant. \
IMPORTANT DISCLAIMER: Your recommendations are informational only and do not \
constitute professional agronomic advice. Homeowners should use their own \
judgment and consult a local extension service for complex problems.`;

// ---------------------------------------------------------------------------
// 1. Grass identification via photo (vision)
// ---------------------------------------------------------------------------

/**
 * Submit a base64-encoded close-up photo of a grass blade and receive an AI
 * identification with confidence score, description, and care summary.
 *
 * @param imageBase64 - Raw base64 string (no data-URI prefix)
 * @param mediaType   - MIME type of the image
 */
export async function identifyGrass(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<GrassIdentificationResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: SYSTEM_BASE,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Please identify the grass type in this photo. Respond ONLY with a JSON object \
(no markdown fences, no extra text) with these exact fields:
{
  "grass_type": "<identified grass type name, e.g. St. Augustine>",
  "confidence": <float 0.0–1.0>,
  "description": "<2–3 sentence description of this grass variety>",
  "care_summary": "<3–4 sentence summary of key care requirements: mow height, watering, fertilizing schedule>"
}
If you cannot confidently identify the grass type from the image, set confidence below 0.5 \
and grass_type to your best guess or "Unknown".`,
          },
        ],
      },
    ],
  });

  // Extract thinking if present
  let thinking: string | undefined;
  let jsonText = '';

  for (const block of response.content) {
    if (block.type === 'thinking') {
      thinking = block.thinking;
    } else if (block.type === 'text') {
      jsonText = block.text.trim();
    }
  }

  // Strip accidental markdown fences if the model wrapped the JSON anyway
  jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let parsed: GrassIdentificationResult;
  try {
    parsed = JSON.parse(jsonText) as GrassIdentificationResult;
  } catch {
    throw new Error(`LawnAI: failed to parse grass identification response. Raw: ${jsonText}`);
  }

  return { ...parsed, thinking };
}

// ---------------------------------------------------------------------------
// 2. Full maintenance plan generation (streaming)
// ---------------------------------------------------------------------------

/**
 * Generate a comprehensive annual maintenance plan for the given lawn profile.
 * Uses streaming so the UI can display partial results as they arrive.
 *
 * @param profile      - The fully assembled LawnProfile
 * @param onChunk      - Called with each streamed text delta
 * @param onComplete   - Called with the final assembled result
 */
export async function generateMaintenancePlan(
  profile: LawnProfile,
  onChunk: (delta: string) => void,
  onComplete: (result: MaintenancePlanResult) => void,
): Promise<void> {
  const client = getClient();

  const profileSummary = buildProfileSummary(profile);

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: SYSTEM_BASE,
    messages: [
      {
        role: 'user',
        content: `Generate a comprehensive annual lawn maintenance plan for the following lawn profile.

${profileSummary}

Please format your response in clear Markdown with these sections:

## Annual Maintenance Calendar
A month-by-month breakdown (January–December) of all maintenance tasks. Include:
- Mowing height and frequency
- Fertilization timing and product type
- Aeration and overseeding windows
- Pre-emergent and post-emergent weed control windows

## Fertilization Schedule
A table or list with: Month | NPK Ratio | Product Type | Application Rate per 1,000 sq ft | Notes

## Watering Guidelines
Frequency and duration recommendations by season. Account for the grass type, climate, and irrigation type on file.

## Seasonal Notes
Short paragraphs for Spring, Summer, Fall, and Winter specific tasks and watchouts.

## Weed & Pest Watch
Common threats for this grass type in this region. When to scout and what to look for. Recommended product types (not brand names) and timing.

Be specific to the user's grass type (${profile.grass.type}), climate zone (${profile.location.usda_zone}, ${profile.location.climate_region}), and total square footage (${profile.total_sq_ft.toLocaleString()} sq ft).`,
      },
    ],
  });

  let fullText = '';

  stream.on('text', (delta: string) => {
    fullText += delta;
    onChunk(delta);
  });

  const finalMessage = await stream.finalMessage();

  // Extract thinking block if present
  let rawJson: string | undefined;
  for (const block of finalMessage.content) {
    if (block.type === 'thinking') {
      // We don't surface thinking for plan generation but could log it
    }
  }

  onComplete({
    plan_markdown: fullText,
    raw_json: rawJson,
  });
}

// ---------------------------------------------------------------------------
// 3. Issue-specific AI recommendation (single call)
// ---------------------------------------------------------------------------

/**
 * Generate an on-demand treatment recommendation for a logged lawn issue.
 *
 * @param issue   - The newly logged issue
 * @param profile - The parent lawn profile for full context
 * @param imageBase64 - Optional base64 photo of the issue
 */
export async function generateIssueRecommendation(
  issue: IssueLog,
  profile: LawnProfile,
  imageBase64?: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<IssueRecommendationResult> {
  const client = getClient();

  const profileSummary = buildProfileSummary(profile);

  const userContent: Anthropic.MessageParam['content'] = [];

  if (imageBase64) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: imageBase64,
      },
    });
  }

  userContent.push({
    type: 'text',
    text: `A homeowner has logged the following lawn issue. Provide a targeted treatment recommendation.

LAWN PROFILE:
${profileSummary}

ISSUE DETAILS:
- Issue type: ${issue.type}
- Zone: ${issue.zone}
- Description: ${issue.description}
- Logged: ${issue.logged_at}
${imageBase64 ? '- Photo attached (see image above)' : ''}

Respond ONLY with a JSON object (no markdown fences) with these exact fields:
{
  "recommendation": "<2–4 sentence treatment plan>",
  "product_type": "<type of product to use, e.g. 'azoxystrobin-based systemic fungicide'>",
  "application_rate": "<specific rate, e.g. '0.4 fl oz per 1,000 sq ft'>",
  "timing": "<when to apply, e.g. 'Apply at first sign of symptoms; repeat every 14–21 days if needed'>",
  "safety_notes": "<re-entry interval, pet/child safety, or other precautions>"
}`,
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: SYSTEM_BASE,
    messages: [{ role: 'user', content: userContent }],
  });

  let jsonText = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      jsonText = block.text.trim();
    }
  }

  jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let parsed: IssueRecommendationResult;
  try {
    parsed = JSON.parse(jsonText) as IssueRecommendationResult;
  } catch {
    throw new Error(`LawnAI: failed to parse issue recommendation response. Raw: ${jsonText}`);
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// 4. Location → USDA zone + climate region lookup
// ---------------------------------------------------------------------------

/**
 * Given a ZIP code or city/state, return USDA zone and climate region.
 * Useful when the device location API is unavailable.
 */
export async function resolveLocationMetadata(
  zipOrCity: string,
): Promise<{ usda_zone: string; climate_region: string }> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 256,
    system: SYSTEM_BASE,
    messages: [
      {
        role: 'user',
        content: `What is the USDA Plant Hardiness Zone and general climate region for: "${zipOrCity}"?
Respond ONLY with a JSON object (no markdown fences):
{
  "usda_zone": "<e.g. 8a>",
  "climate_region": "<e.g. humid subtropical>"
}`,
      },
    ],
  });

  let jsonText = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      jsonText = block.text.trim();
    }
  }

  jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    return JSON.parse(jsonText) as { usda_zone: string; climate_region: string };
  } catch {
    throw new Error(`LawnAI: failed to parse location metadata response. Raw: ${jsonText}`);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildProfileSummary(profile: LawnProfile): string {
  const zones = profile.zones
    .map(
      (z) =>
        `  - ${z.label}: ${z.sq_ft.toLocaleString()} sq ft, ${z.sun_exposure.replace('_', ' ')}, ${z.irrigation.replace('_', ' ')} irrigation`,
    )
    .join('\n');

  const recentIssues = profile.issue_log
    .slice(-3)
    .map((i) => `  - ${i.type} (${i.status}) — ${i.description}`)
    .join('\n');

  return `Lawn Name: ${profile.name}
Location: ${profile.location.city}, ${profile.location.state} (ZIP ${profile.location.zip})
USDA Zone: ${profile.location.usda_zone} | Climate: ${profile.location.climate_region}
Grass Type: ${profile.grass.type} (identified via ${profile.grass.identified_via}, confidence ${Math.round(profile.grass.confidence * 100)}%)
Total Area: ${profile.total_sq_ft.toLocaleString()} sq ft
Lawn Condition: ${profile.condition.replace('_', ' ')}
Zones:
${zones || '  (no zones defined)'}
Current Season Issues on File:
${recentIssues || '  (none)'}`;
}
