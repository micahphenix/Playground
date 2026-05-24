import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { colors, radii, fonts } from '../theme';

type Tone = 'muted' | 'accent' | 'accentAlt' | 'good' | 'warn';

const map: Record<Tone, { bg: string; fg: string }> = {
  muted: { bg: colors.surfaceAlt, fg: colors.body },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  accentAlt: { bg: colors.accentAltSoft, fg: colors.accentAlt },
  good: { bg: colors.goodSoft, fg: colors.good },
  warn: { bg: colors.warnSoft, fg: colors.warn },
};

export function Chip({
  children,
  tone = 'muted',
  style,
}: {
  children: React.ReactNode;
  tone?: Tone;
  style?: ViewStyle;
}) {
  const c = map[tone];
  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
          borderRadius: radii.pill,
          paddingHorizontal: 9,
          paddingVertical: 4,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text style={{ color: c.fg, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.2 }}>{children}</Text>
    </View>
  );
}
