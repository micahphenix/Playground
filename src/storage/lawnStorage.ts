// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Lawn Storage Layer
//
// Persists LawnProfile objects as individual JSON files in the app's document
// directory using expo-file-system. Each lawn gets its own file:
//   <DocumentDirectory>/lawns/<lawn_id>.json
//
// An index file tracks all lawn IDs so we can list them without reading every
// profile:
//   <DocumentDirectory>/lawns/index.json
// ─────────────────────────────────────────────────────────────────────────────

import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import { LawnProfile, LawnProfileSummary, OnboardingDraft } from '../types/lawn';

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const LAWNS_DIR = `${FileSystem.documentDirectory}lawns/`;
const INDEX_FILE = `${LAWNS_DIR}index.json`;

function profilePath(lawnId: string): string {
  return `${LAWNS_DIR}${lawnId}.json`;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/** Ensure the lawns directory exists. Call once at app startup. */
export async function initStorage(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(LAWNS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(LAWNS_DIR, { intermediates: true });
  }

  const indexInfo = await FileSystem.getInfoAsync(INDEX_FILE);
  if (!indexInfo.exists) {
    await FileSystem.writeAsStringAsync(INDEX_FILE, JSON.stringify([]));
  }
}

// ---------------------------------------------------------------------------
// Index management
// ---------------------------------------------------------------------------

async function readIndex(): Promise<string[]> {
  try {
    const raw = await FileSystem.readAsStringAsync(INDEX_FILE);
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  await FileSystem.writeAsStringAsync(INDEX_FILE, JSON.stringify(ids));
}

async function addToIndex(lawnId: string): Promise<void> {
  const ids = await readIndex();
  if (!ids.includes(lawnId)) {
    ids.push(lawnId);
    await writeIndex(ids);
  }
}

async function removeFromIndex(lawnId: string): Promise<void> {
  const ids = await readIndex();
  await writeIndex(ids.filter((id) => id !== lawnId));
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Save (create or update) a LawnProfile to disk. */
export async function saveLawnProfile(profile: LawnProfile): Promise<void> {
  await initStorage();
  const updated: LawnProfile = {
    ...profile,
    updated_at: new Date().toISOString(),
  };
  await FileSystem.writeAsStringAsync(profilePath(profile.lawn_id), JSON.stringify(updated, null, 2));
  await addToIndex(profile.lawn_id);
}

/** Load a single LawnProfile by ID. Returns null if not found. */
export async function loadLawnProfile(lawnId: string): Promise<LawnProfile | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(profilePath(lawnId));
    return JSON.parse(raw) as LawnProfile;
  } catch {
    return null;
  }
}

/** Load all LawnProfiles. */
export async function loadAllProfiles(): Promise<LawnProfile[]> {
  await initStorage();
  const ids = await readIndex();
  const profiles = await Promise.all(ids.map(loadLawnProfile));
  return profiles.filter((p): p is LawnProfile => p !== null);
}

/** Load lightweight summaries for the profile switcher. */
export async function loadAllProfileSummaries(): Promise<LawnProfileSummary[]> {
  const profiles = await loadAllProfiles();
  return profiles
    .map((p) => ({
      lawn_id: p.lawn_id,
      name: p.name,
      grass_type: p.grass.type,
      total_sq_ft: p.total_sq_ft,
      updated_at: p.updated_at,
    }))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

/** Delete a LawnProfile from disk. */
export async function deleteLawnProfile(lawnId: string): Promise<void> {
  const path = profilePath(lawnId);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path);
  }
  await removeFromIndex(lawnId);
}

// ---------------------------------------------------------------------------
// Profile factory
// ---------------------------------------------------------------------------

/**
 * Assemble a new LawnProfile from an OnboardingDraft with sensible defaults.
 * A fresh UUID is assigned and timestamps are set to now.
 */
export function createProfileFromDraft(draft: OnboardingDraft): LawnProfile {
  const now = new Date().toISOString();

  return {
    lawn_id: uuidv4(),
    name: draft.name ?? 'My Lawn',
    created_at: now.slice(0, 10),
    updated_at: now,
    location: {
      zip: draft.location?.zip ?? '',
      city: draft.location?.city ?? '',
      state: draft.location?.state ?? '',
      usda_zone: draft.location?.usda_zone ?? 'Unknown',
      climate_region: draft.location?.climate_region ?? 'Unknown',
      latitude: draft.location?.latitude,
      longitude: draft.location?.longitude,
    },
    grass: {
      type: draft.grass?.type ?? 'Unknown',
      identified_via: draft.grass?.identified_via ?? 'unknown',
      confidence: draft.grass?.confidence ?? 0,
      identification_date: draft.grass?.identification_date ?? now.slice(0, 10),
      description: draft.grass?.description,
      care_summary: draft.grass?.care_summary,
    },
    zones: draft.zones ?? [],
    total_sq_ft: draft.total_sq_ft ?? 0,
    condition: draft.condition ?? 'decent',
    onboarding_issues: draft.onboarding_issues ?? [],
    maintenance_plan: undefined,
    issue_log: [],
    notification_preferences: {
      enabled: false, // user must opt in
      advance_days: 3,
      quiet_hours_start: 21,
      quiet_hours_end: 8,
    },
    is_pro: false,
  };
}

// ---------------------------------------------------------------------------
// Helpers for the active lawn context
// ---------------------------------------------------------------------------

const ACTIVE_LAWN_KEY_FILE = `${FileSystem.documentDirectory}active_lawn_id.txt`;

/** Persist the ID of the currently active lawn. */
export async function setActiveLawnId(lawnId: string): Promise<void> {
  await FileSystem.writeAsStringAsync(ACTIVE_LAWN_KEY_FILE, lawnId);
}

/** Read the ID of the currently active lawn. Returns null if none set. */
export async function getActiveLawnId(): Promise<string | null> {
  try {
    const id = await FileSystem.readAsStringAsync(ACTIVE_LAWN_KEY_FILE);
    return id.trim() || null;
  } catch {
    return null;
  }
}

/** Load the currently active LawnProfile. Returns null if none set or not found. */
export async function loadActiveLawnProfile(): Promise<LawnProfile | null> {
  const id = await getActiveLawnId();
  if (!id) return null;
  return loadLawnProfile(id);
}

// ---------------------------------------------------------------------------
// Issue log helpers
// ---------------------------------------------------------------------------

/** Append a new issue to a profile and persist. */
export async function addIssueToProfile(
  lawnId: string,
  issue: Omit<import('../types/lawn').IssueLog, 'issue_id' | 'logged_at' | 'status'>,
): Promise<import('../types/lawn').IssueLog | null> {
  const profile = await loadLawnProfile(lawnId);
  if (!profile) return null;

  const newIssue: import('../types/lawn').IssueLog = {
    ...issue,
    issue_id: uuidv4(),
    logged_at: new Date().toISOString(),
    status: 'active',
  };

  profile.issue_log = [...profile.issue_log, newIssue];
  await saveLawnProfile(profile);
  return newIssue;
}

/** Update the status and optional notes of an existing issue. */
export async function updateIssueStatus(
  lawnId: string,
  issueId: string,
  updates: Partial<Pick<import('../types/lawn').IssueLog, 'status' | 'resolved_at' | 'treatment_notes' | 'ai_recommendation'>>,
): Promise<void> {
  const profile = await loadLawnProfile(lawnId);
  if (!profile) return;

  profile.issue_log = profile.issue_log.map((issue) =>
    issue.issue_id === issueId ? { ...issue, ...updates } : issue,
  );
  await saveLawnProfile(profile);
}
