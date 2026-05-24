import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, fonts } from '../theme';

export type CoachMarkVariant = 'monogram' | 'leaf' | 'sun' | 'crescent' | 'bowl' | 'sprout' | 'wordmark';

interface Props {
  size?: number;
  variant?: CoachMarkVariant;
}

// Terracotta chip + chosen glyph. Default: monogram "S" (Crimson Pro semibold).
export function CoachMark({ size = 28, variant = 'monogram' }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {renderGlyph(variant, size)}
    </View>
  );
}

function renderGlyph(v: CoachMarkVariant, size: number) {
  const fg = colors.surface;
  const px = size * 0.62;
  switch (v) {
    case 'monogram':
      return (
        <Text style={{ fontFamily: fonts.serifBold, fontSize: size * 0.5, color: fg, lineHeight: size * 0.55 }}>
          S
        </Text>
      );
    case 'wordmark':
      return (
        <Text
          style={{
            fontFamily: fonts.serifRegItalic,
            fontSize: size * 0.46,
            color: fg,
          }}
        >
          s.
        </Text>
      );
    case 'leaf':
      return (
        <Svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <Path d="M19 5 C 19 14, 14 19, 5 19 C 5 10, 10 5, 19 5 Z" fill={fg} />
          <Path d="M6 18 L 18 6" stroke={colors.accent} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4.2} fill={fg} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = 12 + Math.cos(a) * 7.4,
              y1 = 12 + Math.sin(a) * 7.4;
            const x2 = 12 + Math.cos(a) * 10.4,
              y2 = 12 + Math.sin(a) * 10.4;
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={fg} strokeWidth={1.5} strokeLinecap="round" />;
          })}
        </Svg>
      );
    case 'crescent':
      return (
        <Svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <Path d="M16.5 4.5 a 8.5 8.5 0 1 0 3.5 12 a 6.5 6.5 0 1 1 -3.5 -12 Z" fill={fg} />
        </Svg>
      );
    case 'bowl':
      return (
        <Svg width={px} height={px} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={fg} strokeWidth={1.4} />
          <Circle cx={12} cy={12} r={5.5} stroke={fg} strokeWidth={1.4} />
          <Circle cx={12} cy={12} r={2} fill={fg} />
        </Svg>
      );
    case 'sprout':
      return (
        <Svg
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill="none"
          stroke={fg}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M12 20 L 12 11" />
          <Path d="M12 12 C 7 12, 5 9, 5 6 C 9 6, 12 8, 12 12 Z" fill={fg} stroke="none" />
          <Path d="M12 14 C 17 14, 19 11, 19 8 C 15 8, 12 10, 12 14 Z" fill={fg} stroke="none" />
        </Svg>
      );
  }
}
