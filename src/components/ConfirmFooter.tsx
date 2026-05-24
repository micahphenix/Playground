import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii } from '../theme';

interface Props {
  primary: string;
  secondary?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
}

export function ConfirmFooter({ primary, secondary, onPrimary, onSecondary, primaryDisabled, primaryLoading }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        padding: 16,
        paddingBottom: 16 + Math.max(insets.bottom, 4),
        backgroundColor: colors.bg,
        borderTopWidth: 0.5,
        borderTopColor: colors.line,
        gap: 8,
      }}
    >
      <Pressable
        onPress={primaryDisabled || primaryLoading ? undefined : onPrimary}
        style={({ pressed }) => ({
          backgroundColor: colors.ink,
          borderRadius: radii.pill,
          paddingVertical: 15,
          alignItems: 'center',
          opacity: primaryDisabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 15, letterSpacing: -0.1 }}>
          {primaryLoading ? 'Saving…' : primary}
        </Text>
      </Pressable>
      {secondary && (
        <Pressable
          onPress={onSecondary}
          style={({ pressed }) => ({
            backgroundColor: 'transparent',
            borderRadius: radii.pill,
            paddingVertical: 13,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: colors.lineStrong,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: colors.body, fontFamily: fonts.sansMed, fontSize: 13.5 }}>{secondary}</Text>
        </Pressable>
      )}
    </View>
  );
}
