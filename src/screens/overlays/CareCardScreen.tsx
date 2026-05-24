// ─────────────────────────────────────────────────────────────────────────────
// Care Card overlay — Sprint 2.
// Renders the AI's structured care recommendation for a single issue.
// Also doubles as the cold-start target for push deep-links.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS, RADII, SPACING, TYPE } from '../../design/tokens';
import { AppHeader, Card, Eyebrow, GGButton, StatusPillLight } from '../../design/components';
import { CheckIcon, CheckboxCheck } from '../../design/icons';
import { Sigil } from '../../design/Sigil';
import { LeafLoader } from '../../design/LeafLoader';
import { OverlayParamList } from '../../navigation/types';
import { loadLawnProfile, updateIssueStatus, saveLawnProfile } from '../../storage/lawnStorage';
import { fromLog, Issue } from '../../data/issueModel';

type Props = NativeStackScreenProps<OverlayParamList, 'CareCard'>;

const MIN_LOADER_MS = 1500;

export default function CareCardScreen({ navigation, route }: Props) {
  const { lawnId, issueId } = route.params;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const profile = await loadLawnProfile(lawnId);
    const log = profile?.issue_log.find((i) => i.issue_id === issueId);
    setIssue(log ? fromLog(log) : null);
  }, [lawnId, issueId]);

  useEffect(() => {
    let active = true;
    const start = Date.now();
    reload().then(() => {
      const remaining = Math.max(0, MIN_LOADER_MS - (Date.now() - start));
      setTimeout(() => { if (active) setLoading(false); }, remaining);
    });
    return () => { active = false; };
  }, [reload]);

  if (loading || !issue) {
    return (
      <View style={styles.loaderScreen}>
        <AppHeader
          onBack={() => navigation.goBack()}
          eyebrow={<Eyebrow color={COLORS.cream}>Guru is thinking</Eyebrow>}
        />
        <View style={styles.loaderBody}>
          <LeafLoader size={72} />
          <Text style={styles.loaderText}>
            Reading your lawn profile and looking up the diagnosis…
          </Text>
        </View>
      </View>
    );
  }

  const isActive = issue.status === 'active';
  const care = issue.care;
  const bannerColor = isActive ? COLORS.amber : COLORS.leafGreen;

  async function markTreated() {
    await updateIssueStatus(lawnId, issueId, {
      status: 'treated',
      resolved_at: new Date().toISOString(),
    });
    // Clear inTodo when treated
    const profile = await loadLawnProfile(lawnId);
    if (profile) {
      profile.issue_log = profile.issue_log.map((i) =>
        i.issue_id === issueId ? { ...i, inTodo: false } : i,
      );
      await saveLawnProfile(profile);
    }
    navigation.goBack();
  }

  async function addToTodo() {
    const profile = await loadLawnProfile(lawnId);
    if (!profile) return;
    profile.issue_log = profile.issue_log.map((i) =>
      i.issue_id === issueId ? { ...i, inTodo: true } : i,
    );
    await saveLawnProfile(profile);
    navigation.goBack();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.cream }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader eyebrow="CARE CARD" onBack={() => navigation.goBack()} bottomPad={6} />

      <View style={{ paddingHorizontal: SPACING.appX }}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: bannerColor }]}>
          <StatusPillLight status={isActive ? 'active' : 'treated'} />
          <Text style={styles.bannerTitle}>{care.title}</Text>
          <Text style={styles.bannerZone}>{issue.zone}</Text>
        </View>

        {/* Recommendation */}
        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <Sigil size={32} />
          <View style={{ flex: 1, marginLeft: 12, paddingTop: 2 }}>
            <Eyebrow>From your Guru</Eyebrow>
            <Text style={styles.recText}>“{care.recommendation}”</Text>
          </View>
        </View>

        {/* Product + rate */}
        <Card padding={18} style={{ marginTop: 22 }}>
          <Eyebrow>Recommended product</Eyebrow>
          <Text style={styles.productText}>{care.product}</Text>
          <View style={styles.rateInset}>
            <View style={{ flex: 1 }}>
              <Eyebrow style={{ fontSize: 9 }}>Application rate</Eyebrow>
              <Text style={styles.rateValue}>{care.rate}</Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={{ flex: 1.2 }}>
              <Eyebrow style={{ fontSize: 9 }}>For your lawn</Eyebrow>
              <Text style={styles.totalValue}>{care.total}</Text>
            </View>
          </View>
        </Card>

        {/* Steps */}
        {care.steps.length > 0 && (
          <View style={{ marginTop: 22, marginBottom: 24 }}>
            <Eyebrow style={{ marginBottom: 12, paddingLeft: 4 }}>Application steps</Eyebrow>
            <View style={{ gap: 10 }}>
              {care.steps.map((step, i) => (
                <View key={i} style={{ flexDirection: 'row' }}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer actions */}
        {isActive ? (
          <View style={{ gap: 10 }}>
            <GGButton kind="leaf" size="lg" full onPress={markTreated} icon={<CheckIcon />}>
              Mark as treated
            </GGButton>
            {!issue.inTodo ? (
              <GGButton
                kind="ghost"
                size="lg"
                full
                onPress={addToTodo}
                icon={<CheckboxCheck color={COLORS.deepGreen} />}
              >
                Add to to-do
              </GGButton>
            ) : (
              <View style={styles.todoBanner}>
                <View style={styles.todoBannerDot} />
                <Text style={styles.todoBannerText}>On your to-do list</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.treatedBanner}>
            <CheckIcon color={COLORS.leafGreen} size={18} />
            <Text style={styles.treatedBannerText}>
              Treated {formatTreatedAt(issue.treatedAt)}. Nice work.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function formatTreatedAt(iso?: string): string {
  if (!iso) return 'today';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'today';
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'today';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  loaderScreen: { flex: 1, backgroundColor: COLORS.deepGreen },
  loaderBody: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 22, gap: 24,
  },
  loaderText: {
    color: COLORS.cream,
    fontSize: 22, lineHeight: 28,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
  },

  banner: {
    padding: 18,
    borderRadius: RADII.card,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 28, lineHeight: 32,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontWeight: '500',
    marginTop: 10,
    letterSpacing: -0.28,
  },
  bannerZone: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.52,
  },

  recText: {
    ...TYPE.headingSM,
    fontStyle: 'italic',
    fontSize: 17, lineHeight: 24,
    marginTop: 8,
  },

  productText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.deepGreen,
    marginTop: 6,
  },
  rateInset: {
    marginTop: 14,
    padding: 14,
    borderRadius: RADII.card * 0.7,
    backgroundColor: COLORS.softCardBg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateValue: {
    fontFamily: 'Georgia',
    fontSize: 14,
    color: COLORS.ink,
    marginTop: 3,
  },
  rateDivider: { width: 1, alignSelf: 'stretch', backgroundColor: COLORS.line, marginHorizontal: 14 },
  totalValue: {
    ...TYPE.headingMD,
    fontSize: 20,
    fontStyle: 'italic',
    marginTop: 3,
  },

  stepNum: {
    width: 28, height: 28, borderRadius: 999,
    backgroundColor: COLORS.deepGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: COLORS.cream, fontSize: 13, fontWeight: '600' },
  stepText: {
    flex: 1,
    marginLeft: 14, marginTop: 3,
    fontSize: 14.5, lineHeight: 22,
    color: COLORS.ink,
  },

  todoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: RADII.button,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${COLORS.amber}66`,
    gap: 10,
  },
  todoBannerDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: COLORS.amber },
  todoBannerText: { fontSize: 13.5, color: COLORS.deepGreen },

  treatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADII.button,
    backgroundColor: `${COLORS.leafGreen}14`,
    gap: 10,
  },
  treatedBannerText: { fontSize: 13.5, color: COLORS.deepGreen },
});
