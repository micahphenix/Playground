import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList, LawnProfile } from '../../types/lawn';
import { loadLawnProfile, saveLawnProfile } from '../../storage/lawnStorage';
import { generateMaintenancePlan } from '../../services/LawnAI';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type Props = BottomTabScreenProps<MainTabParamList, 'MaintenancePlan'>;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MaintenancePlanScreen({ route }: Props) {
  const { lawnId } = route.params;
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingChunks, setGeneratingChunks] = useState('');
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);

  const load = useCallback(async () => {
    const p = await loadLawnProfile(lawnId);
    setProfile(p);
    setLoading(false);
  }, [lawnId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleGenerate() {
    if (!profile) return;
    Alert.alert(
      'Generate Maintenance Plan',
      'This will use the Claude API to create a personalized annual plan for your lawn. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGenerating(true);
            setGeneratingChunks('');
            try {
              await generateMaintenancePlan(
                profile,
                (delta) => setGeneratingChunks((prev) => prev + delta),
                async (result) => {
                  const updated = {
                    ...profile,
                    maintenance_plan: {
                      generated_at: new Date().toISOString(),
                      profile_hash: profile.lawn_id,
                      annual_tasks: [],
                      fertilization_schedule: [],
                      watering_guidelines: '',
                      seasonal_notes: { spring: '', summer: '', fall: '', winter: '' },
                      weed_and_pest_watch: '',
                      raw_plan_markdown: result.plan_markdown,
                    },
                  };
                  await saveLawnProfile(updated);
                  setProfile(updated);
                  setGenerating(false);
                  setGeneratingChunks('');
                },
              );
            } catch (err) {
              Alert.alert('Error', 'Could not generate plan. Check your API key and network connection.');
              setGenerating(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!profile) {
    return <View style={styles.centered}><Text>Lawn not found.</Text></View>;
  }

  const plan = profile.maintenance_plan;

  return (
    <View style={styles.container}>
      {/* Month selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthStrip}
        contentContainerStyle={styles.monthStripContent}
      >
        {MONTH_NAMES.map((name, i) => {
          const month = i + 1;
          const isCurrent = month === new Date().getMonth() + 1;
          const isActive = month === activeMonth;
          return (
            <TouchableOpacity
              key={month}
              style={[styles.monthChip, isActive && styles.monthChipActive, isCurrent && !isActive && styles.monthChipCurrent]}
              onPress={() => setActiveMonth(month)}
            >
              <Text style={[styles.monthLabel, isActive && styles.monthLabelActive]}>{name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* No plan state */}
        {!plan && !generating && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No plan yet</Text>
            <Text style={styles.emptySub}>
              Generate a personalized annual maintenance plan for your {profile.grass.type} lawn in{' '}
              {profile.location.city}, {profile.location.state}.
            </Text>
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} activeOpacity={0.85}>
              <Text style={styles.generateButtonText}>Generate My Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Generation in progress */}
        {generating && (
          <View style={styles.generatingCard}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.generatingTitle}>Generating your plan…</Text>
            <Text style={styles.generatingPreview} numberOfLines={12}>{generatingChunks}</Text>
          </View>
        )}

        {/* Plan markdown */}
        {plan && !generating && (
          <>
            <View style={styles.planMetaCard}>
              <Text style={styles.planMeta}>
                Generated {plan.generated_at.slice(0, 10)} · {profile.grass.type} · {profile.location.usda_zone}
              </Text>
              <TouchableOpacity onPress={handleGenerate}>
                <Text style={styles.regenerateLink}>Regenerate</Text>
              </TouchableOpacity>
            </View>

            {/* Raw markdown rendered as plain text for v1 */}
            <View style={[CardStyle, styles.planCard]}>
              <Text style={styles.planText}>{plan.raw_plan_markdown}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  monthStrip: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 52 },
  monthStripContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: Spacing.xs, alignItems: 'center' },
  monthChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radii.full, backgroundColor: Colors.surface },
  monthChipActive: { backgroundColor: Colors.primary },
  monthChipCurrent: { borderWidth: 1, borderColor: Colors.primary },
  monthLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  monthLabelActive: { color: Colors.white, fontWeight: Typography.weight.bold },
  scroll: { padding: Spacing.md, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  emptyState: { alignItems: 'center', paddingTop: Spacing['2xl'], gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  emptySub: { fontSize: Typography.size.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.size.base * Typography.leading.relaxed },
  generateButton: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  generateButtonText: { color: Colors.white, fontWeight: Typography.weight.bold, fontSize: Typography.size.md },
  generatingCard: { ...CardStyle, alignItems: 'center', gap: Spacing.sm },
  generatingTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  generatingPreview: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * Typography.leading.relaxed },
  planMetaCard: { ...CardStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primaryPale },
  planMeta: { fontSize: Typography.size.sm, color: Colors.textSecondary, flex: 1 },
  regenerateLink: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.semibold },
  planCard: { padding: Spacing.md },
  planText: { fontSize: Typography.size.sm, color: Colors.textPrimary, lineHeight: Typography.size.sm * Typography.leading.relaxed },
});
