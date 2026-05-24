import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { Label } from './Label';

interface Props {
  title: string;
  sub?: string;
  onClose: () => void;
}

export function ModalHeader({ title, sub, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 6,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Pressable
        onPress={onClose}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
          <Path d="M6 6l12 12M18 6L6 18" />
        </Svg>
      </Pressable>
      <View style={{ flex: 1 }}>
        {sub && <Label>{sub}</Label>}
        <Text
          style={{
            fontFamily: fonts.serifBold,
            fontSize: 22,
            color: colors.ink,
            marginTop: 1,
            letterSpacing: -0.4,
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
