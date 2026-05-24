import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { CoachMark } from '../components/CoachMark';

export function SplashView() {
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 18 }}
    >
      <CoachMark size={64} />
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
