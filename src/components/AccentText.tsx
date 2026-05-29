import React from 'react';
import { Text, TextStyle } from 'react-native';
import { colors, fonts } from '../theme';
import { parseAccentText } from './accentParse';

// Renders a string with {{em:like this}} markers as inline italic terracotta.
// Used by the morning briefing headline + similar serif leads.
export function AccentText({
  children,
  style,
  accentColor = colors.accent,
}: {
  children: string;
  style?: TextStyle;
  accentColor?: string;
}) {
  const parts = parseAccentText(children);
  return (
    <Text style={style}>
      {parts.map((p, idx) =>
        p.em ? (
          <Text
            key={idx}
            style={{ color: accentColor, fontFamily: fonts.serifItalic, fontStyle: 'italic' }}
          >
            {p.text}
          </Text>
        ) : (
          <Text key={idx}>{p.text}</Text>
        ),
      )}
    </Text>
  );
}
