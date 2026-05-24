// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Sprint 2 Issue model
//
// The Sprint 1 LawnProfile uses `IssueLog { ai_recommendation: string }`.
// The Sprint 2 Care Card needs a structured care record.  This module
// defines the Sprint 2 shape and a converter so we can persist new issues
// via the existing storage layer while still rendering them with the new UI.
// ─────────────────────────────────────────────────────────────────────────────

import { IssueLog } from '../types/lawn';
import { IssueTypeLabel } from './seed';

export interface CareCard {
  title: string;
  recommendation: string;
  product: string;
  rate: string;
  total: string;
  steps: string[];
}

export interface Issue {
  id: string;
  type: IssueTypeLabel;
  zone: string;
  description: string;
  photo: boolean;
  photoUri?: string;
  loggedAt: string;     // ISO datetime
  status: 'active' | 'treated';
  inTodo: boolean;
  treatedAt?: string;
  care: CareCard;
}

/**
 * Compress the Sprint 2 CareCard into a single string we can stuff into the
 * existing IssueLog.ai_recommendation field.  Round-trippable via parseCare().
 */
export function serializeCare(care: CareCard): string {
  return `__GG_CARE_V1__${JSON.stringify(care)}`;
}

export function parseCare(raw: string | undefined): CareCard | null {
  if (!raw) return null;
  if (raw.startsWith('__GG_CARE_V1__')) {
    try {
      return JSON.parse(raw.slice('__GG_CARE_V1__'.length)) as CareCard;
    } catch {
      return null;
    }
  }
  return null;
}

/** Map Sprint 2 type labels onto the IssueLog.type enum used by storage. */
export function typeLabelToEnum(label: IssueTypeLabel): IssueLog['type'] {
  switch (label) {
    case 'Fungus':       return 'fungus';
    case 'Brown Patch':  return 'brown_patch';
    case 'Pests':        return 'chinch_bugs';
    case 'Weeds':        return 'weeds';
    case 'Bare Spot':    return 'bare_spots';
    case 'Drainage':     return 'drought_stress';
    default:             return 'other';
  }
}

export function typeEnumToLabel(t: IssueLog['type']): IssueTypeLabel {
  switch (t) {
    case 'fungus':         return 'Fungus';
    case 'brown_patch':    return 'Brown Patch';
    case 'chinch_bugs':
    case 'grubs':          return 'Pests';
    case 'weeds':          return 'Weeds';
    case 'bare_spots':     return 'Bare Spot';
    case 'drought_stress': return 'Drainage';
    default:               return 'Other';
  }
}

/** Convert a stored IssueLog into the Sprint 2 Issue shape. */
export function fromLog(log: IssueLog): Issue {
  const care = parseCare(log.ai_recommendation) ?? {
    title: typeEnumToLabel(log.type),
    recommendation: log.ai_recommendation ?? 'No recommendation yet.',
    product: '—',
    rate: '—',
    total: '—',
    steps: [],
  };
  return {
    id: log.issue_id,
    type: typeEnumToLabel(log.type),
    zone: log.zone,
    description: log.description,
    photo: !!log.photo_uri,
    photoUri: log.photo_uri,
    loggedAt: log.logged_at,
    status: log.status === 'treated' ? 'treated' : log.status === 'resolved' ? 'treated' : 'active',
    inTodo: (log as IssueLog & { inTodo?: boolean }).inTodo ?? false,
    treatedAt: log.resolved_at,
    care,
  };
}

/** Format an ISO date as "May 14" for the issue list. */
export function formatLoggedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
