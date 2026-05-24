import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from './tokens';

interface SigilProps {
  size?: number;
  /** 'cream' = light ground, 'deep' = dark ground, 'plain' = no ground */
  tone?: 'cream' | 'deep' | 'plain';
}

/**
 * The Grass Guru sigil — a single upward leaf on an optional circular ground.
 * Mirrors system.jsx → Sigil().
 */
export function Sigil({ size = 32, tone = 'cream' }: SigilProps) {
  const bg = tone === 'cream' ? COLORS.cream
           : tone === 'deep'  ? COLORS.deepGreen
           : 'transparent';
  const fg = tone === 'deep' ? COLORS.cream : COLORS.deepGreen;
  const veinColor = tone === 'deep' ? COLORS.deepGreen : COLORS.cream;

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="19.5" fill={bg} stroke={fg} strokeOpacity={0.18} />
      <Path
        d="M20 8 C 27 12, 29 20, 22 30 C 21 31, 20 31, 20 31 C 20 31, 19 31, 18 30 C 11 20, 13 12, 20 8 Z"
        fill={fg}
        fillOpacity={0.92}
      />
      <Path
        d="M20 9 L 20 30"
        stroke={veinColor}
        strokeOpacity={0.5}
        strokeWidth={0.8}
        strokeLinecap="round"
      />
      <Path
        d="M20 30 C 19 33, 17 34, 14 34"
        stroke={fg}
        strokeOpacity={0.55}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
