import React from 'react';
import { Pressable, Text, ViewStyle, View } from 'react-native';
import { colors, radii, fonts } from '../theme';

type Kind = 'primary' | 'alt' | 'ghost' | 'ink';

interface Props {
  label: string;
  onPress?: () => void;
  kind?: Kind;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function PillButton({ label, onPress, kind = 'ghost', disabled, style, fullWidth }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          paddingVertical: kind === 'ink' ? 15 : 10,
          paddingHorizontal: kind === 'ink' ? 16 : 14,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: backgroundFor(kind),
          borderWidth: kind === 'ghost' ? 0.5 : 0,
          borderColor: colors.lineStrong,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: disabled ? 0.4 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: textFor(kind),
          fontFamily: fonts.sansBold,
          fontSize: kind === 'ink' ? 15 : 12.5,
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function backgroundFor(kind: Kind): string {
  switch (kind) {
    case 'primary':
      return colors.accent;
    case 'alt':
      return colors.accentAltSoft;
    case 'ink':
      return colors.ink;
    case 'ghost':
    default:
      return 'transparent';
  }
}
function textFor(kind: Kind): string {
  switch (kind) {
    case 'primary':
    case 'ink':
      return colors.surface;
    case 'alt':
      return colors.accentAlt;
    case 'ghost':
    default:
      return colors.body;
  }
}

// Tiny round icon button used by the composer + screen headers.
export function IconButton({
  onPress,
  children,
  size = 34,
  filled = false,
  style,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
  filled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: radii.pill,
          backgroundColor: filled ? colors.accent : colors.bg,
          borderWidth: filled ? 0 : 0.5,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      <View>{children}</View>
    </Pressable>
  );
}
