import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, ACCENT_FONT } from './tokens';

interface LeafLoaderProps {
  size?: number;
  label?: string;
  labelColor?: string;
}

/**
 * A single leaf that sways and pulses. Used for AI-thinking states.
 * Mirrors system.jsx → LeafLoader().
 */
export function LeafLoader({ size = 56, label, labelColor = COLORS.deepGreen }: LeafLoaderProps) {
  const sway = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [sway, pulse]);

  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ rotate }], opacity, width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 60 60">
          <Path
            d="M30 6 C 44 12, 47 28, 33 50 C 31 52, 30 52, 30 52 C 30 52, 29 52, 27 50 C 13 28, 16 12, 30 6 Z"
            fill={COLORS.leafGreen}
          />
          <Path d="M30 8 L 30 50" stroke={COLORS.cream} strokeOpacity={0.7} strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <Path d="M30 20 L 36 22" stroke={COLORS.cream} strokeOpacity={0.45} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <Path d="M30 28 L 38 30" stroke={COLORS.cream} strokeOpacity={0.45} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <Path d="M30 20 L 24 22" stroke={COLORS.cream} strokeOpacity={0.45} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <Path d="M30 28 L 22 30" stroke={COLORS.cream} strokeOpacity={0.45} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      {label && (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14 },
  label: {
    ...ACCENT_FONT,
    fontSize: 13,
    letterSpacing: 1.04,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
});
