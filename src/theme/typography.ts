import { TextStyle } from 'react-native';
import { colors } from './tokens';

// Crimson Pro, DM Sans, JetBrains Mono — loaded via @expo-google-fonts in App.tsx.
// PostScript family names match the @expo-google-fonts variant keys.

export const fonts = {
  serif: 'CrimsonPro_500Medium',
  serifReg: 'CrimsonPro_400Regular',
  serifBold: 'CrimsonPro_600SemiBold',
  serifItalic: 'CrimsonPro_500Medium_Italic',
  serifRegItalic: 'CrimsonPro_400Regular_Italic',
  sans: 'DMSans_400Regular',
  sansMed: 'DMSans_500Medium',
  // DM Sans ships 400/500/700 via @expo-google-fonts (no 600), so the "bold"
  // weight in our type ramp resolves to 700.
  sansBold: 'DMSans_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_600SemiBold',
} as const;

// Reusable text styles matching the design handoff's type ramp.
export const type = {
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.ink,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  dayTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  cardTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  serif17: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 23,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.body,
    lineHeight: 20,
  },
  bodyMd: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    color: colors.body,
    lineHeight: 21,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    color: colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  chip: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.body,
    letterSpacing: 0.2,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  monoSm: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.6,
  },
} satisfies Record<string, TextStyle>;
