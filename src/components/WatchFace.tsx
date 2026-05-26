import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, fonts } from '../theme';

// A Steward-native watch face — not an Apple HIG complication, not a Garmin
// data field. It's our own thing: a circular or rounded-square dial showing
// the protein/calories rings concentric, with a serif date header and a
// single coach line at the bottom. Same content for any wrist hardware; the
// shape adapts.

export type WatchShape = 'round' | 'square';

interface Props {
  shape?: WatchShape;
  diameter?: number;
  proteinValue: number;
  proteinTarget: number;
  caloriesValue: number;
  caloriesTarget: number;
  date: Date;
  coachLine: string;
  /** Small note above the rings — typically the active goal label. */
  goalTag?: string;
}

export function WatchFace({
  shape = 'round',
  diameter = 240,
  proteinValue,
  proteinTarget,
  caloriesValue,
  caloriesTarget,
  date,
  coachLine,
  goalTag,
}: Props) {
  // Container handles shape + frame; the inner content is identical for both
  // shapes so the layout reads the same on any device.
  return (
    <View
      style={{
        width: diameter,
        height: diameter,
        borderRadius: shape === 'round' ? diameter / 2 : 40,
        backgroundColor: colors.ink,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      }}
    >
      {/* Inner face — cream linen surface with a soft radial */}
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: shape === 'round' ? diameter / 2 : 34,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="g" cx="50%" cy="35%" r="65%">
              <Stop offset="0%" stopColor={colors.surface} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.bg} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="100%" fill="url(#g)" />
        </Svg>

        <FaceContent
          diameter={diameter - 12}
          proteinValue={proteinValue}
          proteinTarget={proteinTarget}
          caloriesValue={caloriesValue}
          caloriesTarget={caloriesTarget}
          date={date}
          coachLine={coachLine}
          goalTag={goalTag}
        />
      </View>
    </View>
  );
}

function FaceContent({
  diameter,
  proteinValue,
  proteinTarget,
  caloriesValue,
  caloriesTarget,
  date,
  coachLine,
  goalTag,
}: {
  diameter: number;
  proteinValue: number;
  proteinTarget: number;
  caloriesValue: number;
  caloriesTarget: number;
  date: Date;
  coachLine: string;
  goalTag?: string;
}) {
  const ringSize = diameter * 0.6;
  const proteinPct = Math.round((proteinValue / proteinTarget) * 100);
  return (
    <View
      style={{
        width: diameter,
        height: diameter,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: diameter * 0.07,
      }}
    >
      {/* Header arc — goal tag + date */}
      <View style={{ alignItems: 'center' }}>
        {goalTag && (
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: diameter * 0.04,
              color: colors.accent,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {goalTag}
          </Text>
        )}
        <Text
          style={{
            marginTop: 2,
            fontFamily: fonts.serifBold,
            fontSize: diameter * 0.065,
            color: colors.ink,
            letterSpacing: -0.4,
          }}
        >
          {date.toLocaleDateString(undefined, { weekday: 'long' })}
        </Text>
      </View>

      {/* Rings */}
      <WatchRings
        size={ringSize}
        outer={{ value: proteinValue, target: proteinTarget, color: colors.accent, label: 'PROTEIN' }}
        inner={{ value: caloriesValue, target: caloriesTarget, color: colors.accentAlt, label: 'KCAL' }}
        centerLabel={`${proteinPct}`}
      />

      {/* Coach line — italic serif, one short sentence */}
      <View style={{ paddingHorizontal: diameter * 0.06, alignItems: 'center' }}>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: fonts.serifRegItalic,
            fontStyle: 'italic',
            fontSize: diameter * 0.052,
            color: colors.body,
            lineHeight: diameter * 0.072,
            textAlign: 'center',
            letterSpacing: -0.1,
          }}
        >
          {coachLine}
        </Text>
      </View>
    </View>
  );
}

function WatchRings({
  size,
  outer,
  inner,
  centerLabel,
}: {
  size: number;
  outer: { value: number; target: number; color: string; label: string };
  inner: { value: number; target: number; color: string; label: string };
  centerLabel: string;
}) {
  const innerSize = size * 0.7;
  const stroke = Math.max(6, size * 0.08);
  const innerStroke = Math.max(5, size * 0.065);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <RingArc value={outer.value} target={outer.target} color={outer.color} size={size} stroke={stroke} />
      <View style={{ position: 'absolute' }}>
        <RingArc value={inner.value} target={inner.target} color={inner.color} size={innerSize} stroke={innerStroke} />
      </View>
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: fonts.monoBold,
            fontSize: size * 0.22,
            color: colors.ink,
            letterSpacing: -0.5,
          }}
        >
          {centerLabel}
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontFamily: fonts.mono,
            fontSize: size * 0.07,
            color: colors.muted,
            letterSpacing: 0.6,
          }}
        >
          % P
        </Text>
      </View>
    </View>
  );
}

function RingArc({ value, target, color, size, stroke }: { value: number; target: number; color: string; size: number; stroke: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / target));
  const dash = c * pct;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.surfaceAlt} strokeWidth={stroke} />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
      />
    </Svg>
  );
}
