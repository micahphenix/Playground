import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, ringStroke as defaultStroke } from '../theme';

interface Props {
  value: number;
  target: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export function Ring({
  value,
  target,
  size = 80,
  stroke,
  color = colors.accent,
  trackColor = colors.line,
  label,
  sublabel,
}: Props) {
  const s = stroke ?? defaultStroke;
  const r = (size - s) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / target));
  const dash = c * pct;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={s} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={s}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {label != null && (
          <Text
            style={{
              fontFamily: fonts.monoBold,
              color: colors.ink,
              fontSize: size * 0.22,
              letterSpacing: -0.3,
            }}
          >
            {label}
          </Text>
        )}
        {sublabel && (
          <Text
            style={{
              fontFamily: fonts.mono,
              color: colors.muted,
              fontSize: size * 0.11,
              letterSpacing: 0.4,
              marginTop: 3,
            }}
          >
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}

// Concentric two-ring used on Today (outer protein, inner calories).
// Both rings are drawn first; the centered label is layered on top so the
// inner ring's stroke doesn't occlude it.
export function ConcentricRings({
  outer,
  inner,
  size = 132,
  label,
  sublabel,
}: {
  outer: { value: number; target: number; color: string };
  inner: { value: number; target: number; color: string };
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const innerSize = size - 36;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ring value={outer.value} target={outer.target} color={outer.color} size={size} stroke={9} />
      <View style={{ position: 'absolute' }}>
        <Ring value={inner.value} target={inner.target} color={inner.color} size={innerSize} stroke={6} />
      </View>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {label != null && (
          <Text
            style={{
              fontFamily: fonts.monoBold,
              color: colors.ink,
              fontSize: size * 0.22,
              letterSpacing: -0.3,
            }}
          >
            {label}
          </Text>
        )}
        {sublabel && (
          <Text
            style={{
              fontFamily: fonts.mono,
              color: colors.muted,
              fontSize: size * 0.11,
              letterSpacing: 0.4,
              marginTop: 3,
            }}
          >
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}
