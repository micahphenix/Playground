// ─────────────────────────────────────────────────────────────────────────────
// Sprint 2 lawn context — derives the small shape the new UI consumes from
// the persistent Sprint 1 LawnProfile.  Sensible defaults are applied so the
// dashboard renders even when onboarding fields are sparse.
// ─────────────────────────────────────────────────────────────────────────────

import { LawnProfile, IrrigationType, SunExposure } from '../types/lawn';
import { HealthState } from '../design/tokens';

export interface LawnContextShape {
  grassType: string;
  zone: string;       // "USDA 7a"
  sqft: number;
  irrigation: string;
  sun: string;
  street: string;
  health: HealthState;
}

const IRRIGATION_LABEL: Record<IrrigationType, string> = {
  none:      'No irrigation',
  manual:    'Hand-watered',
  sprinkler: 'In-ground sprinkler',
  drip:      'Drip irrigation',
};

const SUN_LABEL: Record<SunExposure, string> = {
  full_sun:      'Mostly sunny',
  partial_shade: 'Partial shade',
  full_shade:    'Mostly shade',
};

export function lawnContextFromProfile(profile: LawnProfile): LawnContextShape {
  const zoneRaw = profile.location.usda_zone || 'Unknown';
  const zone = zoneRaw.startsWith('USDA') ? zoneRaw : `USDA ${zoneRaw}`;

  // Derive the primary irrigation/sun from the first zone if it exists,
  // otherwise fall back to a sensible default.
  const firstZone = profile.zones[0];
  const irrigation = firstZone ? IRRIGATION_LABEL[firstZone.irrigation] : 'In-ground sprinkler';
  const sun = firstZone ? SUN_LABEL[firstZone.sun_exposure] : 'Mostly sunny';

  return {
    grassType: profile.grass.type || 'Tall Fescue',
    zone,
    sqft: profile.total_sq_ft || 3000,
    irrigation,
    sun,
    street: profile.name || profile.location.city || 'Your lawn',
    health: deriveHealth(profile),
  };
}

function deriveHealth(profile: LawnProfile): HealthState {
  const activeIssues = profile.issue_log.filter((i) => i.status === 'active').length;
  if (activeIssues >= 3) return 'Needs Attention';
  if (activeIssues >= 1) return 'Fair';
  switch (profile.condition) {
    case 'struggling':     return 'Needs Attention';
    case 'starting_fresh': return 'Fair';
    case 'decent':         return 'Good';
    case 'excellent':      return 'Good';
    default:               return 'Good';
  }
}

/** Choose a greeting word from the local hour. */
export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Short health phrase used after "your lawn is …" in the dashboard hero. */
export function healthPhrase(health: HealthState): string {
  switch (health) {
    case 'Good':            return 'doing well';
    case 'Fair':            return 'holding steady';
    case 'Needs Attention': return 'needing some care';
  }
}
