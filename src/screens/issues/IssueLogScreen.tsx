// ─────────────────────────────────────────────────────────────────────────────
// Issue History (Issues tab) — Sprint 2 redesign
// Chronological list with a "+ Log" pill button in the header.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LawnProfile } from '../../types/lawn';
import { loadLawnProfile } from '../../storage/lawnStorage';
import { COLORS, RADII, SPACING, TYPE } from '../../design/tokens';
import { AppHeader, Card, Heading, StatusPill } from '../../design/components';
import { Sigil } from '../../design/Sigil';
import { ChevronRight, AlertTriangle, TreatedCheck } from '../../design/icons';
import { fromLog, formatLoggedAt, Issue } from '../../data/issueModel';
import { OverlayParamList } from '../../navigation/types';

interface Props {
  route: { params: { lawnId: string } };
}

export default function IssueLogScreen({ route }: Props) {
  const { lawnId } = route.params;
  const overlayNav = useNavigation<NativeStackNavigationProp<OverlayParamList>>();
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLawnProfile(lawnId).then((p) => { setProfile(p); setLoading(false); });
    }, [lawnId]),
  );

  const issues = useMemo<Issue[]>(
    () => (profile?.issue_log ?? [])
      .map(fromLog)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()),
    [profile],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.deepGreen} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <AppHeader
        eyebrow="ISSUE HISTORY"
        title={
          <Heading level={1} italic>
            <Text style={{ opacity: 0.6 }}>What you've</Text> flagged
          </Heading>
        }
        right={
          <Pressable
            onPress={() => overlayNav.navigate('LogIssue', { lawnId })}
            style={styles.logBtn}
          >
            <Text style={styles.logBtnPlus}>+</Text>
            <Text style={styles.logBtnText}>Log</Text>
          </Pressable>
        }
      />

      {issues.length === 0 ? (
        <View style={styles.empty}>
          <Sigil size={48} />
          <Heading level={3} italic>No issues logged yet.</Heading>
          <Text style={styles.emptySub}>
            Tap "Log Issue" from the dashboard when something looks off.
          </Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: SPACING.appX, paddingBottom: 120, gap: 10 }}
          renderItem={({ item }) => (
            <Card
              padding={16}
              onPress={() => overlayNav.navigate('CareCard', { lawnId, issueId: item.id })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.iconTile,
                    { backgroundColor: item.status === 'active' ? `${COLORS.amber}22` : `${COLORS.leafGreen}22` },
                  ]}
                >
                  {item.status === 'active'
                    ? <AlertTriangle />
                    : <TreatedCheck />}
                </View>
                <View style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.issueType}>{item.type}</Text>
                    <StatusPill status={item.status} />
                  </View>
                  <Text style={styles.issueMeta}>
                    Logged {formatLoggedAt(item.loggedAt)} · {item.zone}
                  </Text>
                </View>
                <ChevronRight />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },

  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.deepGreen,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
  },
  logBtnPlus: { color: COLORS.cream, fontSize: 16, fontWeight: '600', marginRight: 4 },
  logBtnText: { color: COLORS.cream, fontSize: 13, fontWeight: '600' },

  iconTile: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  issueType: { ...TYPE.headingSM },
  issueMeta: { ...TYPE.bodySoft, fontSize: 13, marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20, gap: 14 },
  emptySub: { ...TYPE.body, fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', maxWidth: 240 },
});
