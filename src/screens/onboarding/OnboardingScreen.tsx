import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, type } from '../../theme';
import { CoachMark } from '../../components/CoachMark';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { useData } from '../../data/DataContext';

const STEPS: { label: string; tone: 'accent' | 'accentAlt' }[] = [
  { label: 'Basics & profile', tone: 'accent' },
  { label: 'Constraints — arthritis, insomnia, etc.', tone: 'accentAlt' },
  { label: 'Active goal mode', tone: 'accent' },
  { label: 'HealthKit permissions', tone: 'accentAlt' },
  { label: 'Coach tone', tone: 'accent' },
];

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useData();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 24,
          paddingHorizontal: 28,
          paddingBottom: 28 + Math.max(insets.bottom, 8),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <CoachMark size={36} />
          <View>
            <Label>Steward · v0.1</Label>
            <Text
              style={{ fontFamily: fonts.serifRegItalic, fontSize: 13, color: colors.body, marginTop: 1 }}
            >
              a coach for the body you've been given
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: 40,
            color: colors.ink,
            letterSpacing: -0.8,
            lineHeight: 44,
            marginTop: 28,
            marginBottom: 12,
          }}
        >
          The body is a{' '}
          <Text style={{ color: colors.accent, fontFamily: fonts.serifItalic, fontStyle: 'italic' }}>
            stewardship
          </Text>
          , not a project.
        </Text>
        <Text style={[type.bodyMd, { color: colors.body, lineHeight: 22 }]}>
          Steward holds the thread across food, training, recovery, and the limits you're actually working within.
          The goal isn't optimization. It's faithfulness.
        </Text>

        <View style={{ flex: 1, minHeight: 24 }} />

        <Card style={{ padding: 18, marginTop: 24 }}>
          <Label>Setup · 5 minutes</Label>
          <View style={{ marginTop: 10, gap: 8 }}>
            {STEPS.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: colors[s.tone] }}
                />
                <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: colors.body }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Pressable
          onPress={completeOnboarding}
          style={({ pressed }) => ({
            backgroundColor: colors.ink,
            borderRadius: radii.pill,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 14,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 15 }}>Let's begin</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
