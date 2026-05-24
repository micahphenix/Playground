import React from 'react';
import { Text, TextStyle } from 'react-native';
import { type } from '../theme';

export function Label({ children, style }: { children: React.ReactNode; style?: TextStyle | TextStyle[] }) {
  return <Text style={[type.label, style as TextStyle]}>{children}</Text>;
}
