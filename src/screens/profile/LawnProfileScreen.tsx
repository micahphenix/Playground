import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList, LawnProfile } from '../../types/lawn';
import { loadLawnProfile } from '../../storage/lawnStorage';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type Props = BottomTabScreenProps<MainTabParamList, 'LawnProfile'>;

export default function LawnProfileScreen({ route }: Props) {
  const { lawnId } = route.params;
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLawnProfile(lawnId).then((p) => { setProfile(p); setLoading(false); });
    }, [lawnId]),
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!profile) {
    return <View style={styles.centered}><Text>Lawn not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Identity */}
      <Section title="Lawn Identity">
        <Row label="Name" value={profile.name} />
        <Row label="Created" value={profile.created_at} />
        <Row label="Last updated" value={profile.updated_at.slice(0, 10)} />
      </Section>

      {/* Location */}
      <Section title="Location">
        <Row label="City" value={`${profile.location.city}, ${profile.location.state}`} />
        <Row label="ZIP" value={profile.location.zip} />
        <Row label="USDA Zone" value={profile.location.usda_zone} />
        <Row label="Climate" value={profile.location.climate_region} />
      </Section>

      {/* Grass */}
      <Section title="Grass">
        <Row label="Type" value={profile.grass.type} />
        <Row label="Identified via" value={profile.grass.identified_via.replace('_', ' ')} />
        <Row label="Confidence" value={`${Math.round(profile.grass.confidence * 100)}%`} />
        {profile.grass.description ? (
          <View style={styles.descRow}>
            <Text style={styles.descLabel}>Description</Text>
            <Text style={styles.descValue}>{profile.grass.description}</Text>
          </View>
        ) : null}
        {profile.grass.care_summary ? (
          <View style={styles.descRow}>
            <Text style={styles.descLabel}>Care Summary</Text>
            <Text style={styles.descValue}>{profile.grass.care_summary}</Text>
          </View>
        ) : null}
      </Section>

      {/* Zones */}
      <Section title="Zones">
        {profile.zones.map((zone) => (
          <View key={zone.zone_id} style={styles.zoneCard}>
            <Text style={styles.zoneLabel}>{zone.label}</Text>
            <Row label="Area" value={`${zone.sq_ft.toLocaleString()} sq ft`} />
            <Row label="Sun" value={zone.sun_exposure.replace('_', ' ')} />
            <Row label="Irrigation" value={zone.irrigation.replace('_', ' ')} />
          </View>
        ))}
        <Row label="Total area" value={`${profile.total_sq_ft.toLocaleString()} sq ft`} />
      </Section>

      {/* Condition */}
      <Section title="Condition">
        <Row label="Overall" value={profile.condition.replace('_', ' ')} />
        {profile.onboarding_issues.length > 0 && (
          <Row label="Known issues" value={profile.onboarding_issues.join(', ')} />
        )}
      </Section>

      {/* Plan */}
      <Section title="Maintenance Plan">
        <Row
          label="Status"
          value={profile.maintenance_plan ? `Generated ${profile.maintenance_plan.generated_at.slice(0, 10)}` : 'Not generated yet'}
        />
        <Row label="Tasks" value={String(profile.maintenance_plan?.annual_tasks.length ?? 0)} />
      </Section>

      {/* Issue history */}
      <Section title="Issue History">
        <Row label="Total logged" value={String(profile.issue_log.length)} />
        <Row label="Active" value={String(profile.issue_log.filter((i) => i.status === 'active').length)} />
        <Row label="Resolved" value={String(profile.issue_log.filter((i) => i.status === 'resolved').length)} />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row label="Enabled" value={profile.notification_preferences.enabled ? 'Yes' : 'No'} />
        <Row label="Advance notice" value={`${profile.notification_preferences.advance_days} days`} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.md, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { gap: Spacing.xs },
  sectionTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionCard: { ...CardStyle, gap: 0, padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: Typography.size.base, color: Colors.textSecondary, flex: 1 },
  rowValue: { fontSize: Typography.size.base, color: Colors.textPrimary, fontWeight: Typography.weight.medium, flex: 1, textAlign: 'right', textTransform: 'capitalize' },
  descRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, gap: 4 },
  descLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  descValue: { fontSize: Typography.size.sm, color: Colors.textPrimary, lineHeight: Typography.size.sm * Typography.leading.relaxed },
  zoneCard: { borderBottomWidth: 2, borderBottomColor: Colors.primaryPale, paddingBottom: Spacing.xs, marginBottom: 0 },
  zoneLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
});
