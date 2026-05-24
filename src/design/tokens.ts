// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Design Tokens (Porch ethos)
// Source: design_handoff_grass_guru_sprint2/README.md + system.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { Platform, TextStyle } from 'react-native';

export const COLORS = {
  deepGreen: '#1a3a2a',
  leafGreen: '#4a8c5c',
  sage:      '#8fad91',
  amber:     '#c4852a',
  cream:     '#f5f0e8',
  tan:       '#d4c5a0',
  cardBg:    '#fffaf1',
  softCardBg:'#efe7d4',
  ink:       '#1f1d18',
  inkSoft:   'rgba(31,29,24,0.62)',
  inkFaint:  'rgba(31,29,24,0.34)',
  line:      'rgba(31,29,24,0.10)',
  water:     '#5a7d9a',
  needsAtt:  '#b85a3a',
  white:     '#ffffff',
};

export const SPACING = {
  /** App horizontal padding */
  appX: 22,
  cardPad: 18,
  cardPadCompact: 16,
  cardPadDense: 14,
  /** Vertical gap between top-level sections */
  section: 22,
  /** Vertical gap between stacked cards */
  stack: 10,
  /** Header top padding for status bar clearance */
  headerTop: 58,
};

export const RADII = {
  card: 18,
  /** = 0.85 × card radius */
  button: 15.3,
  pill: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#1f1d18',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 2,
  },
} as const;

// Newsreader serif fallback chain. Register actual Newsreader via expo-font for
// pixel-perfect parity. Until then iOS/Android system serifs are used.
export const HEADING_FONT: TextStyle = Platform.select({
  ios: { fontFamily: 'Georgia' },
  android: { fontFamily: 'serif' },
  default: { fontFamily: 'serif' },
})!;

export const ACCENT_FONT: TextStyle = Platform.select({
  ios: { fontFamily: 'Georgia' },
  android: { fontFamily: 'serif' },
  default: { fontFamily: 'serif' },
})!;

/**
 * Typography ramp keyed to README spec.
 * Letter-spacing values are pt-equivalents of the em values in the table
 * (sized at the corresponding font size — RN uses absolute units).
 */
export const TYPE = {
  headingXL: {
    ...HEADING_FONT,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
    letterSpacing: -0.34, // -0.01em
    color: COLORS.deepGreen,
  },
  headingLG: {
    ...HEADING_FONT,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '500' as const,
    letterSpacing: -0.26,
    color: COLORS.deepGreen,
  },
  headingMD: {
    ...HEADING_FONT,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: -0.20,
    color: COLORS.deepGreen,
  },
  headingSM: {
    ...HEADING_FONT,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500' as const,
    letterSpacing: -0.17,
    color: COLORS.deepGreen,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.ink,
  },
  bodySoft: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.inkSoft,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 1.32,        // 0.12em at 11pt
    textTransform: 'uppercase' as const,
    color: COLORS.deepGreen,
  },
  categoryTag: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.11,
  },
} as const;

// ── Category style map ───────────────────────────────────────────────────────
export type CategoryId = 'fertilize' | 'weed' | 'mow' | 'water';

export const CATEGORY: Record<CategoryId, { label: string; color: string; ink: string }> = {
  fertilize: { label: 'Fertilize', color: COLORS.leafGreen, ink: '#fff' },
  weed:      { label: 'Weed',      color: COLORS.amber,     ink: '#fff' },
  mow:       { label: 'Mow',       color: COLORS.sage,      ink: COLORS.deepGreen },
  water:     { label: 'Water',     color: COLORS.water,     ink: '#fff' },
};

// ── Health states ────────────────────────────────────────────────────────────
export type HealthState = 'Good' | 'Fair' | 'Needs Attention';

export const HEALTH_COLOR: Record<HealthState, string> = {
  'Good': COLORS.leafGreen,
  'Fair': COLORS.amber,
  'Needs Attention': COLORS.needsAtt,
};
