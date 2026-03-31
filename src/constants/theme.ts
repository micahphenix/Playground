// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Design System
// Earthy greens, warm neutrals, clean sans-serif.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Brand greens ────────────────────────────────────────────────────────
  /** Primary CTA, key UI chrome */
  primary: '#2D5016',
  /** Buttons, active tabs, highlights */
  primaryLight: '#4A7C28',
  /** Backgrounds, cards */
  primaryPale: '#EFF5E8',
  /** Hover / pressed state */
  primaryDark: '#1C320D',

  // ── Accent ──────────────────────────────────────────────────────────────
  accent: '#8BC34A',
  accentLight: '#C5E1A5',

  // ── Warm neutrals ───────────────────────────────────────────────────────
  soil: '#6D4C2A',
  soilLight: '#A07850',
  sand: '#F5ECD7',
  parchment: '#FAF6EE',

  // ── Semantic ────────────────────────────────────────────────────────────
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#E53935',
  info: '#1E88E5',

  // ── Greys ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  surface: '#F9F9F7',
  border: '#E0DDD5',
  textMuted: '#8C8982',
  textSecondary: '#5C5A54',
  textPrimary: '#1A1916',
  black: '#000000',

  // ── Issue status badges ──────────────────────────────────────────────────
  statusActive: '#E53935',
  statusTreated: '#FF9800',
  statusResolved: '#4CAF50',
  statusMonitoring: '#1E88E5',
} as const;

export const Typography = {
  // Family (system fallbacks; swap for a custom font via expo-font if desired)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },

  // Scale
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
  },

  // Weight
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line height multipliers
  leading: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const Radii = {
  sm: 6,
  md: 12,
  lg: 18,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ── Reusable component tokens ─────────────────────────────────────────────────

export const CardStyle = {
  backgroundColor: Colors.white,
  borderRadius: Radii.md,
  padding: Spacing.md,
  ...Shadows.sm,
} as const;

export const ScreenStyle = {
  flex: 1,
  backgroundColor: Colors.parchment,
} as const;
