import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function SplashScreen() {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        {/* Replace with <Image source={require('../../assets/logo.png')} /> */}
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>Grass Guru</Text>
        <Text style={styles.tagline}>Your AI lawn consultant,{'\n'}always in your pocket.</Text>
      </Animated.View>
      <Text style={styles.footer}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    fontSize: 72,
  },
  title: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: Typography.size.md,
    color: Colors.accentLight,
    textAlign: 'center',
    lineHeight: Typography.size.md * Typography.leading.relaxed,
  },
  footer: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    color: Colors.accentLight,
    fontSize: Typography.size.sm,
    opacity: 0.7,
  },
});
