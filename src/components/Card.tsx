import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radii, shadows } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  raised?: boolean;
  /** Adds a 3px left accent stripe — used by pattern flags + profile-update cards. */
  accentEdge?: keyof Pick<typeof colors, 'accent' | 'accentAlt' | 'warn' | 'good'>;
}

export function Card({ children, style, raised = true, accentEdge }: Props) {
  return (
    <View
      style={[
        styles.card,
        raised && shadows.card,
        accentEdge && { borderLeftWidth: 3, borderLeftColor: colors[accentEdge] },
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
});
