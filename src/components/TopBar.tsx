import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { Label } from './Label';

interface Props {
  title: string;
  sub?: string;
  /** When true, the right-side affordance is a back chevron instead of the clock. */
  onBack?: () => void;
  right?: React.ReactNode;
}

export function TopBar({ title, sub, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 4,
        paddingHorizontal: 20,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        {onBack && (
          <Pressable
            onPress={onBack}
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
              marginBottom: 2,
            })}
          >
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
              <Path d="M15 6l-6 6 6 6" />
            </Svg>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {sub && <Label style={{ marginBottom: 4 }}>{sub}</Label>}
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 32, color: colors.ink, letterSpacing: -0.6, lineHeight: 34 }}>
            {title}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {right ?? <ClockButton />}
      </View>
    </View>
  );
}

function ClockButton() {
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.surface,
        borderWidth: 0.5,
        borderColor: colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={1.7}>
        <Circle cx={12} cy={12} r={9} />
        <Path d="M12 7v5l3 2" />
      </Svg>
    </View>
  );
}
