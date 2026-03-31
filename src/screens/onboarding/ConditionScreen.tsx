import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingParamList, LawnCondition, SunExposure, IrrigationType } from '../../types/lawn';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingParamList, 'Condition'>;

const CONDITIONS: { value: LawnCondition; label: string; emoji: string; desc: string }[] = [
  { value: 'excellent', label: 'Excellent', emoji: '🌟', desc: 'Lush, thick, and mostly weed-free.' },
  { value: 'decent', label: 'Decent', emoji: '👍', desc: 'Mostly good with a few thin or bare spots.' },
  { value: 'struggling', label: 'Struggling', emoji: '😓', desc: 'Significant bare patches, weeds, or disease.' },
  { value: 'starting_fresh', label: 'Starting Fresh', emoji: '🌱', desc: 'New lawn, bare soil, or complete renovation.' },
];

const SUN_OPTIONS: { value: SunExposure; label: string; emoji: string }[] = [
  { value: 'full_sun', label: 'Full Sun (6+ hrs/day)', emoji: '☀️' },
  { value: 'partial_shade', label: 'Partial Shade (3–6 hrs/day)', emoji: '⛅' },
  { value: 'full_shade', label: 'Full Shade (<3 hrs/day)', emoji: '🌥️' },
];

const IRRIGATION_OPTIONS: { value: IrrigationType; label: string; emoji: string }[] = [
  { value: 'none', label: 'No irrigation (rain only)', emoji: '🌧️' },
  { value: 'manual', label: 'Manual (hose / sprinkler)', emoji: '💧' },
  { value: 'sprinkler', label: 'In-ground sprinkler system', emoji: '🚿' },
  { value: 'drip', label: 'Drip irrigation', emoji: '🔵' },
];

const COMMON_ISSUES = ['Weeds', 'Bare spots', 'Brown patch', 'Grubs', 'Poor drainage', 'Thatch buildup'];

export default function ConditionScreen({ navigation, route }: Props) {
  const { draft } = route.params;
  const [condition, setCondition] = useState<LawnCondition>(draft.condition ?? 'decent');
  const [sunExposure, setSunExposure] = useState<SunExposure>('full_sun');
  const [irrigation, setIrrigation] = useState<IrrigationType>('none');
  const [selectedIssues, setSelectedIssues] = useState<string[]>(draft.onboarding_issues ?? []);

  function toggleIssue(issue: string) {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue],
    );
  }

  function handleNext() {
    // Apply sun and irrigation to all zones
    const updatedZones = (draft.zones ?? []).map((z) => ({
      ...z,
      sun_exposure: sunExposure,
      irrigation,
    }));

    navigation.navigate('OnboardingComplete', {
      draft: {
        ...draft,
        zones: updatedZones,
        condition,
        onboarding_issues: selectedIssues,
      },
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>A bit more about your lawn</Text>
        <Text style={styles.sub}>This helps calibrate your recommendations right away.</Text>

        <Text style={styles.sectionLabel}>Overall condition</Text>
        {CONDITIONS.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.option, condition === c.value && styles.optionSelected]}
            onPress={() => setCondition(c.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionEmoji}>{c.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, condition === c.value && styles.optionLabelSelected]}>
                {c.label}
              </Text>
              <Text style={styles.optionDesc}>{c.desc}</Text>
            </View>
            {condition === c.value && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Sun exposure</Text>
        {SUN_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.option, sunExposure === s.value && styles.optionSelected]}
            onPress={() => setSunExposure(s.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionEmoji}>{s.emoji}</Text>
            <Text style={[styles.optionLabel, sunExposure === s.value && styles.optionLabelSelected]}>
              {s.label}
            </Text>
            {sunExposure === s.value && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Irrigation type</Text>
        {IRRIGATION_OPTIONS.map((ir) => (
          <TouchableOpacity
            key={ir.value}
            style={[styles.option, irrigation === ir.value && styles.optionSelected]}
            onPress={() => setIrrigation(ir.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionEmoji}>{ir.emoji}</Text>
            <Text style={[styles.optionLabel, irrigation === ir.value && styles.optionLabelSelected]}>
              {ir.label}
            </Text>
            {irrigation === ir.value && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Known issues right now <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.issueGrid}>
          {COMMON_ISSUES.map((issue) => (
            <TouchableOpacity
              key={issue}
              style={[styles.issueChip, selectedIssues.includes(issue) && styles.issueChipSelected]}
              onPress={() => toggleIssue(issue)}
              activeOpacity={0.7}
            >
              <Text style={[styles.issueChipText, selectedIssues.includes(issue) && styles.issueChipTextSelected]}>
                {issue}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Build My Plan →</Text>
        </TouchableOpacity>
        <Text style={styles.steps}>Step 5 of 5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing['2xl'] },
  heading: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  sub: { fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: Typography.size.base * Typography.leading.relaxed, marginBottom: Spacing.md },
  sectionLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginTop: Spacing.md },
  optional: { fontWeight: Typography.weight.regular, color: Colors.textMuted },
  option: {
    ...CardStyle, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  optionEmoji: { fontSize: 24, width: 32 },
  optionLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.textPrimary },
  optionLabelSelected: { color: Colors.primary },
  optionDesc: { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 1 },
  check: { fontSize: 18, color: Colors.primary, fontWeight: Typography.weight.bold },
  issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  issueChip: {
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  issueChipSelected: { backgroundColor: Colors.primaryPale, borderColor: Colors.primary },
  issueChipText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  issueChipTextSelected: { color: Colors.primary, fontWeight: Typography.weight.semibold },
  footer: { padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  cta: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  ctaText: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.white },
  steps: { fontSize: Typography.size.sm, color: Colors.textMuted },
});
