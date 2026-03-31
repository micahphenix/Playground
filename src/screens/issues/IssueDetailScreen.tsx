import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IssuesStackParamList, IssueLog, IssueStatus, LawnProfile } from '../../types/lawn';
import { loadLawnProfile, updateIssueStatus } from '../../storage/lawnStorage';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type Props = NativeStackScreenProps<IssuesStackParamList, 'IssueDetail'>;

const STATUS_COLORS: Record<IssueStatus, string> = {
  active: Colors.statusActive,
  treated: Colors.statusTreated,
  resolved: Colors.statusResolved,
  monitoring: Colors.statusMonitoring,
};

export default function IssueDetailScreen({ route, navigation }: Props) {
  const { lawnId, issueId } = route.params;
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLawnProfile(lawnId).then((p) => { setProfile(p); setLoading(false); });
    }, [lawnId]),
  );

  const issue: IssueLog | undefined = profile?.issue_log.find((i) => i.issue_id === issueId);

  async function handleStatusChange(newStatus: IssueStatus) {
    await updateIssueStatus(lawnId, issueId, {
      status: newStatus,
      resolved_at: newStatus === 'resolved' ? new Date().toISOString() : undefined,
    });
    const updated = await loadLawnProfile(lawnId);
    setProfile(updated);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!issue) {
    return <View style={styles.centered}><Text>Issue not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.issueType}>{issue.type.replace('_', ' ')}</Text>
          <Text style={styles.issueMeta}>Zone: {issue.zone}</Text>
          <Text style={styles.issueMeta}>Logged: {issue.logged_at.slice(0, 10)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[issue.status] }]}>
          <Text style={styles.statusText}>{issue.status}</Text>
        </View>
      </View>

      {/* Photo */}
      {issue.photo_uri && (
        <Image source={{ uri: issue.photo_uri }} style={styles.photo} />
      )}

      {/* Description */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text style={styles.cardBody}>{issue.description}</Text>
      </View>

      {/* AI Recommendation */}
      {issue.ai_recommendation ? (
        <View style={[styles.card, styles.aiCard]}>
          <Text style={styles.aiCardTitle}>🤖 AI Recommendation</Text>
          <Text style={styles.cardBody}>{issue.ai_recommendation}</Text>
          <Text style={styles.disclaimer}>
            ⚠️ Informational only. Not professional agronomic advice. Results may vary by local conditions.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardBody}>No AI recommendation yet.</Text>
        </View>
      )}

      {/* Resolution date */}
      {issue.resolved_at && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resolved</Text>
          <Text style={styles.cardBody}>{issue.resolved_at.slice(0, 10)}</Text>
        </View>
      )}

      {/* Status update buttons */}
      {issue.status !== 'resolved' && (
        <View style={styles.statusActions}>
          <Text style={styles.statusActionsLabel}>Update status</Text>
          <View style={styles.statusButtonRow}>
            {(['treated', 'monitoring', 'resolved'] as IssueStatus[])
              .filter((s) => s !== issue.status)
              .map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusButton, { borderColor: STATUS_COLORS[s] }]}
                  onPress={() =>
                    Alert.alert(
                      `Mark as ${s}?`,
                      undefined,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Confirm', onPress: () => handleStatusChange(s) },
                      ],
                    )
                  }
                >
                  <Text style={[styles.statusButtonText, { color: STATUS_COLORS[s] }]}>
                    Mark {s}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.md, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { ...CardStyle, flexDirection: 'row', alignItems: 'flex-start' },
  issueType: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, textTransform: 'capitalize' },
  issueMeta: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radii.full },
  statusText: { color: Colors.white, fontWeight: Typography.weight.bold, fontSize: Typography.size.sm, textTransform: 'capitalize' },
  photo: { width: '100%', height: 220, borderRadius: Radii.md, backgroundColor: Colors.border },
  card: { ...CardStyle, gap: Spacing.xs },
  aiCard: { backgroundColor: Colors.primaryPale, borderWidth: 1, borderColor: Colors.primaryLight },
  cardTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { fontSize: Typography.size.base, color: Colors.textPrimary, lineHeight: Typography.size.base * Typography.leading.relaxed },
  aiCardTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary },
  disclaimer: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' },
  statusActions: { ...CardStyle, gap: Spacing.sm },
  statusActionsLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
  statusButtonRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  statusButton: { borderWidth: 1.5, borderRadius: Radii.full, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
  statusButtonText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, textTransform: 'capitalize' },
});
