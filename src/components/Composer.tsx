import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, radii, fonts, shadows } from '../theme';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onCamera?: () => void;
  onMic?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Composer({
  value,
  onChangeText,
  onSend,
  onCamera,
  onMic,
  placeholder = 'Let me know how I can help…',
  disabled,
}: Props) {
  const [focused, setFocused] = useState(false);
  const canSend = !disabled && value.trim().length > 0;
  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, shadows.composer, focused && { borderColor: colors.lineStrong }]}>
        <IconBtn onPress={onCamera}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.6}>
            <Rect x={3} y={5} width={18} height={14} rx={3} />
            <Circle cx={9} cy={11} r={1.5} />
            <Path d="M21 17l-6-5-8 7" />
          </Svg>
        </IconBtn>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          multiline
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <IconBtn onPress={onMic}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.7}>
            <Rect x={9} y={3} width={6} height={11} rx={3} />
            <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </Svg>
        </IconBtn>
        <Pressable
          onPress={canSend ? onSend : undefined}
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: colors.accent, opacity: canSend ? (pressed ? 0.92 : 1) : 0.4 },
          ]}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.surface} strokeWidth={2.4}>
            <Path d="M12 19V5M5 12l7-7 7 7" />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

function IconBtn({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: colors.line,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  input: {
    flex: 1,
    paddingHorizontal: 6,
    color: colors.body,
    fontFamily: fonts.sans,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
    borderWidth: 0.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
