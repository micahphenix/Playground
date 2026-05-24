import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { colors, radii, fonts } from '../theme';

interface Props {
  from: 'user' | 'coach';
  children: React.ReactNode;
  time?: string;
  style?: ViewStyle;
}

export function Bubble({ from, children, time, style }: Props) {
  const isCoach = from === 'coach';
  return (
    <View style={[{ alignItems: isCoach ? 'flex-start' : 'flex-end', maxWidth: '88%' }, style]}>
      <View
        style={{
          maxWidth: '100%',
          paddingHorizontal: 13,
          paddingVertical: 10,
          backgroundColor: isCoach ? colors.surface : colors.accent,
          borderRadius: radii.card,
          borderBottomLeftRadius: isCoach ? 4 : radii.card,
          borderBottomRightRadius: isCoach ? radii.card : 4,
          borderWidth: isCoach ? 0.5 : 0,
          borderColor: colors.line,
        }}
      >
        {typeof children === 'string' ? (
          <Text
            style={{
              color: isCoach ? colors.body : colors.surface,
              fontFamily: fonts.sans,
              fontSize: 14.5,
              lineHeight: 21,
              letterSpacing: -0.1,
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
      {time && (
        <Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: 10, marginTop: 4, paddingHorizontal: 4 }}>
          {time}
        </Text>
      )}
    </View>
  );
}
