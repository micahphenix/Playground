import React from 'react';
import { Text, TextStyle } from 'react-native';
import { colors, fonts } from '../theme';

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
  const parts: { text: string; em: boolean }[] = [];
  let i = 0;
  const re = /\{\{em:([^}]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(children))) {
    if (m.index > i) parts.push({ text: children.slice(i, m.index), em: false });
    parts.push({ text: m[1], em: true });
    i = m.index + m[0].length;
  }
  if (i < children.length) parts.push({ text: children.slice(i), em: false });
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
