import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IssuesStackParamList, LawnProfile, IssueLog, IssueStatus } from '../../types/lawn';
import { loadLawnProfile } from '../../storage/lawnStorage';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type NavProp = NativeStackNavigationProp<IssuesStackParamList, 'IssueLog'>;

const STATUS_COLORS: Record<IssueStatus, string> = {
  active: Colors.statusActive,
  treated: Colors.statusTreated,
  resolved: Colors.statusResolved,
  monitoring: Colors.statusMonitoring,
};

interface Props {
  route: { params: { lawnId: string } };
}

export default function IssueLogScreen({ route }: Props) {
  const { lawnId } = route.params;
  const navigation = useNavigation<NavProp>();
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      loadLawnProfile(lawnId).then((p) => { setProfile(p); setLoading(false); });
    }, [lawnId]),
  );

  const issues = (profile?.issue_log ?? [])
    .filter((i) => filter === 'all' || i.status === filter)
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        {(['all', 'active', 'treated', 'resolved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.issue_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyTitle}>No issues logged</Text>
            <Text style={styles.emptySub}>
              {filter === 'all'
                ? "Tap the button below to log your first issue."
                : `No ${filter} issues to show.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.issueCard}
            onPress={() => navigation.navigate('IssueDetail', { lawnId, issueId: item.issue_id })}
            activeOpacity={0.7}
          >
            <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[item.status] }]} />
            <View style={styles.issueContent}>
              <View style={styles.issueRow}>
                <Text style={styles.issueType}>{item.type.replace('_', ' ')}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.issueDesc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.issueMeta}>
                Zone: {item.zone} · {item.logged_at.slice(0, 10)}
                {item.photo_uri ? ' · 📷' : ''}
                {item.ai_recommendation ? ' · 🤖 AI Rec' : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogNewIssue', { lawnId })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Log Issue</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] + '22' }]}>
      <Text style={[styles.badgeText, { color: STATUS_COLORS[status] }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterChip: { paddingVertical: 5, paddingHorizontal: Spacing.md, borderRadius: Radii.full, backgroundColor: Colors.surface },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  filterTextActive: { color: Colors.white, fontWeight: Typography.weight.bold },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
  issueCard: {
    ...CardStyle, flexDirection: 'row', padding: 0, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  statusBar: { width: 5 },
  issueContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  issueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  issueType: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, textTransform: 'capitalize' },
  issueDesc: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * Typography.leading.normal },
  issueMeta: { fontSize: Typography.size.xs, color: Colors.textMuted },
  badge: { paddingVertical: 2, paddingHorizontal: Spacing.sm, borderRadius: Radii.full },
  badgeText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
  emptyState: { alignItems: 'center', paddingTop: Spacing['3xl'], gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  emptySub: { fontSize: Typography.size.base, color: Colors.textSecondary, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: Spacing.xl, right: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: Radii.full,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: Colors.white, fontWeight: Typography.weight.bold, fontSize: Typography.size.base },
});
