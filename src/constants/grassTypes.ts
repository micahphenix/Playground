// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Grass Type Reference Data
// Used for the onboarding selection list and for AI prompt context.
// ─────────────────────────────────────────────────────────────────────────────

export interface GrassTypeInfo {
  id: string;
  name: string;
  /** "warm_season" | "cool_season" | "transition" */
  season_type: 'warm_season' | 'cool_season' | 'transition';
  /** Primary US regions where this grass thrives */
  regions: string[];
  /** One-line description shown in the picker */
  tagline: string;
  /** Typical mow height range in inches */
  mow_height_min: number;
  mow_height_max: number;
}

export const GRASS_TYPES: GrassTypeInfo[] = [
  {
    id: 'st_augustine',
    name: 'St. Augustine',
    season_type: 'warm_season',
    regions: ['Gulf Coast', 'Florida', 'Southeast', 'Southwest'],
    tagline: 'Thick, carpet-like blades. Loves heat and shade tolerance.',
    mow_height_min: 2.5,
    mow_height_max: 4.0,
  },
  {
    id: 'bermuda',
    name: 'Bermuda',
    season_type: 'warm_season',
    regions: ['South', 'Southwest', 'Transition Zone'],
    tagline: 'Dense, fine-bladed. Extremely drought-tolerant.',
    mow_height_min: 0.5,
    mow_height_max: 1.5,
  },
  {
    id: 'zoysia',
    name: 'Zoysia',
    season_type: 'warm_season',
    regions: ['Southeast', 'Midwest', 'Transition Zone'],
    tagline: 'Dense and weed-resistant. Slow to establish.',
    mow_height_min: 1.0,
    mow_height_max: 2.5,
  },
  {
    id: 'centipede',
    name: 'Centipede',
    season_type: 'warm_season',
    regions: ['Southeast', 'Gulf Coast'],
    tagline: 'Low-maintenance warm-season grass. Acidic soil preferred.',
    mow_height_min: 1.0,
    mow_height_max: 2.0,
  },
  {
    id: 'tall_fescue',
    name: 'Tall Fescue',
    season_type: 'cool_season',
    regions: ['Transition Zone', 'Mid-Atlantic', 'Pacific Northwest'],
    tagline: 'Coarse, durable. Tolerates heat better than other cool-season grasses.',
    mow_height_min: 3.0,
    mow_height_max: 4.0,
  },
  {
    id: 'kentucky_bluegrass',
    name: 'Kentucky Bluegrass',
    season_type: 'cool_season',
    regions: ['Midwest', 'Northeast', 'Mountain West'],
    tagline: 'Rich blue-green color. Excellent self-repair via rhizomes.',
    mow_height_min: 2.5,
    mow_height_max: 3.5,
  },
  {
    id: 'perennial_ryegrass',
    name: 'Perennial Ryegrass',
    season_type: 'cool_season',
    regions: ['Pacific Coast', 'Northeast', 'Midwest'],
    tagline: 'Fine-bladed, quick to germinate. Common in blends.',
    mow_height_min: 1.5,
    mow_height_max: 2.5,
  },
  {
    id: 'fine_fescue',
    name: 'Fine Fescue',
    season_type: 'cool_season',
    regions: ['Northeast', 'Pacific Northwest', 'Shady areas nationwide'],
    tagline: 'Extremely shade-tolerant. Low fertilizer needs.',
    mow_height_min: 2.0,
    mow_height_max: 3.0,
  },
  {
    id: 'buffalo',
    name: 'Buffalo Grass',
    season_type: 'warm_season',
    regions: ['Great Plains', 'Midwest'],
    tagline: 'Native prairie grass. Ultra low-water and low-maintenance.',
    mow_height_min: 2.0,
    mow_height_max: 4.0,
  },
  {
    id: 'unknown',
    name: "I don't know",
    season_type: 'transition',
    regions: [],
    tagline: "Use our AI photo identification to find out.",
    mow_height_min: 2.0,
    mow_height_max: 3.5,
  },
];

export const GRASS_TYPE_NAMES = GRASS_TYPES.filter((g) => g.id !== 'unknown').map(
  (g) => g.name,
);

export function getGrassTypeById(id: string): GrassTypeInfo | undefined {
  return GRASS_TYPES.find((g) => g.id === id);
}

export function getGrassTypeByName(name: string): GrassTypeInfo | undefined {
  return GRASS_TYPES.find(
    (g) => g.name.toLowerCase() === name.toLowerCase(),
  );
}
