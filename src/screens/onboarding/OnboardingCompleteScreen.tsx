import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OnboardingParamList, RootParamList } from '../../types/lawn';
import { createProfileFromDraft, saveLawnProfile, setActiveLawnId } from '../../storage/lawnStorage';
import { generateMaintenancePlan } from '../../services/LawnAI';
import { Colors, Typography, Spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingParamList, 'OnboardingComplete'>;

type Step = 'saving' | 'generating' | 'done' | 'error';

export default function OnboardingCompleteScreen({ route }: Props) {
  const { draft } = route.params;
  const rootNav = useNavigation<NativeStackNavigationProp<RootParamList>>();

  const [step, setStep] = useState<Step>('saving');
  const [planPreview, setPlanPreview] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    runSetup();
  }, []);

  async function runSetup() {
    try {
      // 1. Create and persist the profile
      setStep('saving');
      const profile = createProfileFromDraft(draft);
      await saveLawnProfile(profile);
      await setActiveLawnId(profile.lawn_id);

      // 2. Generate the maintenance plan (streamed)
      setStep('generating');
      await generateMaintenancePlan(
        profile,
        (delta) => setPlanPreview((prev) => prev + delta),
        async (result) => {
          // Attach the completed plan to the profile and re-save
          profile.maintenance_plan = {
            generated_at: new Date().toISOString(),
            profile_hash: profile.lawn_id,
            annual_tasks: [],
            fertilization_schedule: [],
            watering_guidelines: '',
            seasonal_notes: { spring: '', summer: '', fall: '', winter: '' },
            weed_and_pest_watch: '',
            raw_plan_markdown: result.plan_markdown,
          };
          await saveLawnProfile(profile);
          setStep('done');
        },
      );
    } catch (err) {
      console.error('Onboarding setup error:', err);
      setStep('error');
    }
  }

  useEffect(() => {
    if (step === 'done') {
      // Brief pause so the user can read the "done" state before navigating
      const timer = setTimeout(() => {
        rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const messages: Record<Step, { icon: string; title: string; sub: string }> = {
    saving: { icon: '💾', title: 'Building your profile…', sub: 'Saving your lawn details.' },
    generating: { icon: '🤖', title: 'Generating your plan…', sub: 'Our AI is crafting a personalized maintenance plan for your lawn.' },
    done: { icon: '✅', title: 'Your plan is ready!', sub: 'Launching Grass Guru…' },
    error: { icon: '⚠️', title: 'Something went wrong', sub: 'We couldn\'t generate your plan right now. You can retry from the dashboard.' },
  };

  const { icon, title, sub } = messages[step];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>

        {(step === 'saving' || step === 'generating') && (
          <ActivityIndicator color={Colors.accent} size="large" style={styles.spinner} />
        )}

        {step === 'generating' && planPreview.length > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Plan preview</Text>
            <Text style={styles.previewText} numberOfLines={8}>
              {planPreview}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: { alignItems: 'center', width: '100%', gap: Spacing.md },
  icon: { fontSize: 72 },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  sub: {
    fontSize: Typography.size.base,
    color: Colors.accentLight,
    textAlign: 'center',
    lineHeight: Typography.size.base * Typography.leading.relaxed,
  },
  spinner: { marginTop: Spacing.sm },
  previewBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  previewLabel: {
    fontSize: Typography.size.xs,
    color: Colors.accentLight,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  previewText: {
    fontSize: Typography.size.sm,
    color: Colors.white,
    lineHeight: Typography.size.sm * Typography.leading.relaxed,
    opacity: 0.85,
  },
});
