import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList, LawnProfile, MaintenancePlanTask } from '../../types/lawn';
import { loadLawnProfile } from '../../storage/lawnStorage';
import { Colors, Typography, Spacing, Radii, CardStyle, Shadows } from '../../constants/theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Dashboard'>;

export default function DashboardScreen({ route, navigation }: Props) {
  const { lawnId } = route.params;
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const p = await loadLawnProfile(lawnId);
    setProfile(p);
    setLoading(false);
    setRefreshing(false);
  }, [lawnId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!profile) {
    return <View style={styles.centered}><Text>Lawn not found.</Text></View>;
  }

  const currentMonth = new Date().getMonth() + 1;
  const upcomingTasks: MaintenancePlanTask[] = (profile.maintenance_plan?.annual_tasks ?? [])
    .filter((t) => t.month === currentMonth && !t.completed)
    .slice(0, 3);

  const activeIssues = profile.issue_log.filter((i) => i.status === 'active');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
    >
      {/* Lawn card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.lawnName}>{profile.name}</Text>
            <Text style={styles.lawnLocation}>{profile.location.city}, {profile.location.state}</Text>
          </View>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{profile.condition.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Stat label="Grass" value={profile.grass.type} />
          <Stat label="Area" value={`${profile.total_sq_ft.toLocaleString()} sq ft`} />
          <Stat label="Zone" value={profile.location.usda_zone} />
        </View>
      </View>

      {/* Upcoming tasks */}
      <SectionHeader
        title="This Month's Tasks"
        action="See All"
        onAction={() => navigation.navigate('MaintenancePlan', { lawnId })}
      />
      {upcomingTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {profile.maintenance_plan
              ? '✅ No pending tasks for this month.'
              : '📅 Generate your maintenance plan to see tasks here.'}
          </Text>
          {!profile.maintenance_plan && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => navigation.navigate('MaintenancePlan', { lawnId })}
            >
              <Text style={styles.generateButtonText}>Generate Plan</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        upcomingTasks.map((task) => (
          <View key={task.task_id} style={styles.taskCard}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
            <View style={[styles.categoryBadge]}>
              <Text style={styles.categoryText}>{task.category.replace('_', ' ')}</Text>
            </View>
          </View>
        ))
      )}

      {/* Active issues */}
      <SectionHeader
        title="Active Issues"
        action="Log Issue"
        onAction={() =>
          navigation.navigate('IssueLog', { lawnId })
        }
      />
      {activeIssues.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>🌿 No active issues. Looking great!</Text>
        </View>
      ) : (
        activeIssues.slice(0, 3).map((issue) => (
          <View key={issue.issue_id} style={styles.issueCard}>
            <View style={[styles.issueDot, { backgroundColor: Colors.error }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.issueType}>{issue.type.replace('_', ' ')}</Text>
              <Text style={styles.issueDesc} numberOfLines={1}>{issue.description}</Text>
            </View>
            <Text style={styles.issueDate}>{issue.logged_at.slice(0, 10)}</Text>
          </View>
        ))
      )}

      {/* Quick actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickActions}>
        <QuickAction emoji="📷" label="ID Grass" onPress={() => navigation.navigate('LawnProfile', { lawnId })} />
        <QuickAction emoji="⚠️" label="Log Issue" onPress={() => navigation.navigate('IssueLog', { lawnId })} />
        <QuickAction emoji="📋" label="View Plan" onPress={() => navigation.navigate('MaintenancePlan', { lawnId })} />
        <QuickAction emoji="✏️" label="Edit Profile" onPress={() => navigation.navigate('LawnProfile', { lawnId })} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>
      )}
    </View>
  );
}

function QuickAction({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.md, paddingBottom: Spacing['3xl'], gap: Spacing.sm },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heroCard: {
    backgroundColor: Colors.primary, borderRadius: Radii.lg, padding: Spacing.lg,
    ...Shadows.md, gap: Spacing.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lawnName: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.white },
  lawnLocation: { fontSize: Typography.size.sm, color: Colors.accentLight, marginTop: 2 },
  conditionBadge: { backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: 3, paddingHorizontal: Spacing.sm },
  conditionText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.primaryDark },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.white },
  statLabel: { fontSize: Typography.size.xs, color: Colors.accentLight },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  sectionAction: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.semibold },

  emptyCard: { ...CardStyle, alignItems: 'center', gap: Spacing.sm },
  emptyText: { fontSize: Typography.size.base, color: Colors.textSecondary, textAlign: 'center' },
  generateButton: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  generateButtonText: { color: Colors.white, fontWeight: Typography.weight.semibold, fontSize: Typography.size.base },

  taskCard: { ...CardStyle, gap: Spacing.xs },
  taskTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  taskDesc: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * Typography.leading.normal },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primaryPale, borderRadius: Radii.full, paddingVertical: 2, paddingHorizontal: Spacing.sm },
  categoryText: { fontSize: Typography.size.xs, color: Colors.primary, fontWeight: Typography.weight.semibold },

  issueCard: { ...CardStyle, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  issueDot: { width: 8, height: 8, borderRadius: 4 },
  issueType: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, textTransform: 'capitalize' },
  issueDesc: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  issueDate: { fontSize: Typography.size.xs, color: Colors.textMuted },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  quickAction: { flex: 1, ...CardStyle, alignItems: 'center', gap: Spacing.xs, padding: Spacing.md },
  quickActionEmoji: { fontSize: 26 },
  quickActionLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: Typography.weight.medium, textAlign: 'center' },
});
