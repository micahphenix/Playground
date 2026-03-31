import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingParamList } from '../../types/lawn';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>Welcome to{'\n'}Grass Guru</Text>
        <Text style={styles.subtitle}>Your AI lawn consultant, always in your pocket.</Text>

        <View style={styles.bullets}>
          {[
            { icon: '📍', text: 'Knows your climate zone and grass type' },
            { icon: '📅', text: 'Generates a personalized annual care plan' },
            { icon: '⚠️', text: 'Diagnoses issues and recommends treatments' },
            { icon: '🔔', text: 'Sends timely reminders so nothing slips' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.bullet}>
              <Text style={styles.bulletIcon}>{icon}</Text>
              <Text style={styles.bulletText}>{text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.permission}>
          On the next screen we'll ask for your location and notification
          permissions to give you the best recommendations.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('Location', { draft: {} })}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Build My Lawn Profile →</Text>
        </TouchableOpacity>
        <Text style={styles.steps}>Step 1 of 5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
  },
  logo: { fontSize: 64, marginBottom: Spacing.md },
  title: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: Typography.size['3xl'] * 1.25,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: Colors.accentLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  bullets: { width: '100%', gap: Spacing.md, marginBottom: Spacing.xl },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  bulletIcon: { fontSize: 20, width: 28 },
  bulletText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.white,
    lineHeight: Typography.size.base * Typography.leading.normal,
  },
  permission: {
    fontSize: Typography.size.sm,
    color: Colors.accentLight,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: Typography.size.sm * Typography.leading.relaxed,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
    alignItems: 'center',
  },
  cta: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.primaryDark,
  },
  steps: { fontSize: Typography.size.sm, color: Colors.accentLight, opacity: 0.6 },
});
