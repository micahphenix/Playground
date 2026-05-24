// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (Home tab) — Sprint 2 redesign
// Mirrors design_handoff_grass_guru_sprint2/screens.jsx → DashboardScreen.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MainTabParamList, LawnProfile } from '../../types/lawn';
import { loadLawnProfile } from '../../storage/lawnStorage';
import { COLORS, RADII, SPACING, TYPE, ACCENT_FONT } from '../../design/tokens';
import {
  AppHeader, Card, CategoryTag, Eyebrow, HealthBadge, Heading,
} from '../../design/components';
import {
  ChevronRight, PlotLawnArt, PlusCircle, CalendarIcon, TodoSquare,
} from '../../design/icons';
import { Sigil } from '../../design/Sigil';
import { findNextTask, MONTHS } from '../../data/seed';
import { fromLog, formatLoggedAt, Issue } from '../../data/issueModel';
import { lawnContextFromProfile, greeting, healthPhrase, LawnContextShape } from '../../data/lawnContext';
import { OverlayParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Dashboard'>;

export default function DashboardScreen({ route, navigation }: Props) {
  const overlayNav = useNavigation<NativeStackNavigationProp<OverlayParamList>>();
  const { lawnId } = route.params;
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await loadLawnProfile(lawnId);
    setProfile(p);
    setLoading(false);
  }, [lawnId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const lawn = useMemo(() => (profile ? lawnContextFromProfile(profile) : null), [profile]);
  const issues = useMemo<Issue[]>(() => (profile?.issue_log ?? []).map(fromLog), [profile]);
  const todoIssues = issues.filter((i) => i.status === 'active' && i.inTodo);

  const nextTask = useMemo(() => findNextTask(), []);

  if (loading || !profile || !lawn) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.deepGreen} size="large" />
      </View>
    );
  }

  const greet = greeting();
  const phrase = healthPhrase(lawn.health);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.cream }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader
        eyebrow={lawn.street.toUpperCase()}
        right={<HealthBadge status={lawn.health} />}
        bottomPad={18}
        title={
          <Heading level={1} italic>
            {greet},{'\n'}
            <Text style={{ opacity: 0.7 }}>your lawn is</Text>{' '}
            <Text style={{ color: COLORS.leafGreen }}>{phrase}</Text>.
          </Heading>
        }
      />

      <View style={{ paddingHorizontal: SPACING.appX }}>
        <LawnHeroPlot lawn={lawn} />

        {todoIssues.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <View style={[styles.sectionHead, { paddingLeft: 4 }]}>
              <Eyebrow>To-do</Eyebrow>
              <Text style={styles.outstanding}>
                {todoIssues.length} OUTSTANDING
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {todoIssues.map((iss) => (
                <Card
                  key={iss.id}
                  padding={14}
                  onPress={() => overlayNav.navigate('CareCard', { lawnId, issueId: iss.id })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.todoStripe} />
                    <View style={styles.todoAvatar}>
                      <TodoSquare />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                      <Text style={styles.todoTitle}>{iss.care.title || iss.type}</Text>
                      <Text style={styles.todoSub}>
                        {iss.zone} · logged {formatLoggedAt(iss.loggedAt)}
                      </Text>
                    </View>
                    <ChevronRight />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {nextTask && (
          <View style={{ marginTop: 18 }}>
            <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>Coming up</Eyebrow>
            <Card onPress={() => navigation.navigate('MaintenancePlan', { lawnId })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <CategoryTag cat={nextTask.task.cat} />
                  <Text style={styles.nextTaskTitle}>{nextTask.task.title}</Text>
                  <Text style={styles.nextTaskDetail}>{nextTask.task.detail}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.thisWeek}>
                    {nextTask.month === MONTHS[new Date().getMonth()] ? 'THIS WEEK' : nextTask.month.toUpperCase()}
                  </Text>
                  <Text style={styles.dayOfWeek}>{dayOfWeek()}</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        <View style={{ marginTop: 22 }}>
          <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>Quick actions</Eyebrow>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <QuickAction
              icon={<PlusCircle />}
              label={'Log\nIssue'}
              onPress={() => overlayNav.navigate('LogIssue', { lawnId })}
            />
            <QuickAction
              icon={<Sigil size={22} tone="cream" />}
              label={'Ask\nGuru'}
              onPress={() => overlayNav.navigate('AskGuru', { lawnId })}
            />
            <QuickAction
              icon={<CalendarIcon />}
              label={'View\nPlan'}
              onPress={() => navigation.navigate('MaintenancePlan', { lawnId })}
            />
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>Conditions</Eyebrow>
          <Card padding={16}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ConditionCol label="Soil temp" value="58°F" sub="rising" />
              <ConditionCol label="Rainfall" value={'0.4"'} sub="past 7d" />
              <ConditionCol label="Mow day" value="Sat" sub="next" />
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

function LawnHeroPlot({ lawn }: { lawn: LawnContextShape }) {
  const W = Math.min(358, Dimensions.get('window').width - SPACING.appX * 2);
  const H = 210;
  return (
    <View style={{ borderRadius: RADII.card, overflow: 'hidden', height: H, width: W, alignSelf: 'center' }}>
      <PlotLawnArt width={W} height={H} />
      <View style={styles.heroOverlay}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>{lawn.grassType.toUpperCase()}</Text>
          <Text style={styles.heroNumber}>
            {lawn.sqft.toLocaleString()}
            <Text style={styles.heroNumberSuffix}> sq ft</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.heroEyebrow}>{lawn.zone.toUpperCase()}</Text>
          <View style={styles.heroHealthPill}>
            <View style={styles.heroHealthDot} />
            <Text style={styles.heroHealthText}>{lawn.health}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Card padding={14} onPress={onPress} style={{ alignItems: 'center' }}>
        <View style={styles.qaIconBg}>{icon}</View>
        <Text style={styles.qaLabel}>{label}</Text>
      </Card>
    </View>
  );
}

function ConditionCol({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.condLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.condValue}>{value}</Text>
      <Text style={styles.condSub}>{sub}</Text>
    </View>
  );
}

function dayOfWeek(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short' });
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  outstanding: {
    ...ACCENT_FONT,
    fontSize: 11,
    color: COLORS.deepGreen,
    opacity: 0.55,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },

  todoStripe: { width: 4, alignSelf: 'stretch', minHeight: 32, borderRadius: 4, backgroundColor: COLORS.amber },
  todoAvatar: {
    width: 30, height: 30, borderRadius: 999, marginLeft: 12,
    backgroundColor: `${COLORS.amber}1f`,
    alignItems: 'center', justifyContent: 'center',
  },
  todoTitle: {
    ...TYPE.headingSM,
    fontSize: 16, lineHeight: 20,
    fontStyle: 'italic',
  },
  todoSub: { ...TYPE.bodySoft, fontSize: 12.5, marginTop: 2 },

  nextTaskTitle: {
    ...TYPE.headingMD,
    fontSize: 19, lineHeight: 24,
    marginTop: 10,
  },
  nextTaskDetail: { ...TYPE.bodySoft, marginTop: 6 },
  thisWeek: {
    ...ACCENT_FONT,
    fontSize: 12, color: COLORS.deepGreen, opacity: 0.55,
    letterSpacing: 0.96, textTransform: 'uppercase',
  },
  dayOfWeek: {
    ...TYPE.headingMD,
    fontSize: 28, lineHeight: 32, fontStyle: 'italic', marginTop: 4,
  },

  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    padding: 18, flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: 'rgba(26,58,42,0.35)',
  },
  heroEyebrow: {
    color: COLORS.cream,
    fontSize: 12,
    letterSpacing: 1.44,
    textTransform: 'uppercase',
    opacity: 0.78,
    fontWeight: '600',
  },
  heroNumber: {
    color: COLORS.cream,
    fontSize: 34, lineHeight: 38,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 6,
  },
  heroNumberSuffix: {
    fontSize: 16, fontStyle: 'normal', opacity: 0.7,
    fontWeight: '400',
    letterSpacing: 0.8,
  },
  heroHealthPill: {
    flexDirection: 'row', alignItems: 'center', marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.13)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
  },
  heroHealthDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: COLORS.leafGreen, marginRight: 6 },
  heroHealthText: { color: COLORS.cream, fontSize: 12, fontWeight: '600', letterSpacing: 0.48 },

  qaIconBg: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: COLORS.softCardBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  qaLabel: {
    fontSize: 13, fontWeight: '600', color: COLORS.deepGreen,
    textAlign: 'center', lineHeight: 16,
  },

  condLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.08, textTransform: 'uppercase', color: COLORS.deepGreen, opacity: 0.6 },
  condValue: { ...TYPE.headingMD, fontSize: 22, lineHeight: 26, marginTop: 4 },
  condSub: { fontSize: 11, color: COLORS.inkSoft, marginTop: 2 },
});
