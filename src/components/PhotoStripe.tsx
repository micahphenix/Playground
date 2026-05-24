import React from 'react';
import { View, Text, Image } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { colors, radii, fonts } from '../theme';

// Striped placeholder used when there's no real photo. Renders the real
// image when uri is provided.
export function PhotoStripe({
  label = 'meal photo',
  height = 130,
  uri,
}: {
  label?: string;
  height?: number;
  uri?: string;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: '100%', height, borderRadius: radii.sm, backgroundColor: colors.surfaceAlt }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        height,
        borderRadius: radii.sm,
        borderWidth: 0.5,
        borderColor: colors.line,
        overflow: 'hidden',
        backgroundColor: colors.surface,
      }}
    >
      <Svg width="100%" height={height}>
        <Defs>
          <Pattern id="stripe" patternUnits="userSpaceOnUse" width={22} height={22} patternTransform="rotate(45)">
            <Rect x={0} y={0} width={22} height={22} fill={colors.surfaceAlt} />
            <Line x1={11} y1={0} x2={11} y2={22} stroke={colors.surface} strokeWidth={10} />
          </Pattern>
        </Defs>
        <Rect width="100%" height={height} fill="url(#stripe)" />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            color: colors.muted,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
