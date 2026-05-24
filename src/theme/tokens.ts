// Clay palette — earthy linen, terracotta + sage, layered cards.
// Lifted from design_handoff_steward_coach/shared.jsx.

export const colors = {
  bg: '#F8F1E2',
  surface: '#FDF7E9',
  surfaceAlt: '#ECDFC6',
  ink: '#2A211A',
  body: '#4A3E32',
  muted: '#8A7A62',
  line: 'rgba(42,33,26,0.10)',
  lineStrong: 'rgba(42,33,26,0.22)',
  accent: '#C2643F',
  accentSoft: 'rgba(194,100,63,0.12)',
  accentAlt: '#6B7A57',
  accentAltSoft: 'rgba(107,122,87,0.14)',
  good: '#5C7345',
  goodSoft: 'rgba(95,120,80,0.13)',
  warn: '#B0671E',
  warnSoft: 'rgba(160,100,30,0.13)',
  white: '#FFFFFF',
} as const;

export const radii = {
  card: 18,
  sm: 12,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 28,
} as const;

export const ringStroke = 7;

export const shadows = {
  card: {
    shadowColor: '#2A211A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  composer: {
    shadowColor: '#2A211A',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;
