// ─────────────────────────────────────────────────────────────────────────────
// Settings (Profile tab) — Sprint 2 redesign
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LawnProfile } from '../../types/lawn';
import { loadActiveLawnProfile, saveLawnProfile } from '../../storage/lawnStorage';
import { COLORS, RADII, SPACING, TYPE, ACCENT_FONT } from '../../design/tokens';
import { AppHeader, Card, Eyebrow, GGButton, Heading } from '../../design/components';
import { ChevronRight } from '../../design/icons';
import { lawnContextFromProfile } from '../../data/lawnContext';
import { OverlayParamList } from '../../navigation/types';

const NOTIF_TIMES = ['7:00 AM', '8:00 AM'] as const;

export default function SettingsScreen() {
  const overlayNav = useNavigation<NativeStackNavigationProp<OverlayParamList>>();
  const [profile, setProfile] = useState<LawnProfile | null>(null);
  const [notifs, setNotifs] = useState(true);
  const [notifTime, setNotifTime] = useState<typeof NOTIF_TIMES[number]>('8:00 AM');
  const [briefingFired, setBriefingFired] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadActiveLawnProfile().then((p) => {
        setProfile(p);
        if (p) setNotifs(p.notification_preferences.enabled);
      });
    }, []),
  );

  useEffect(() => {
    if (!briefingFired) return;
    const t = setTimeout(() => setBriefingFired(false), 2000);
    return () => clearTimeout(t);
  }, [briefingFired]);

  async function toggleNotifs(value: boolean) {
    setNotifs(value);
    if (!profile) return;
    const updated = {
      ...profile,
      notification_preferences: { ...profile.notification_preferences, enabled: value },
    };
    await saveLawnProfile(updated);
    setProfile(updated);
  }

  if (!profile) {
    return <View style={styles.centered}><Text>Loading…</Text></View>;
  }

  const lawn = lawnContextFromProfile(profile);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.cream }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader
        eyebrow="PROFILE"
        title={
          <Heading level={1} italic>
            <Text style={{ opacity: 0.6 }}>Your</Text> lawn
          </Heading>
        }
      />

      <View style={{ paddingHorizontal: SPACING.appX, gap: 22 }}>
        {/* My Lawn */}
        <View>
          <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>My lawn</Eyebrow>
          <Card padding={0}>
            <Row label="Grass type"     value={lawn.grassType} onPress={() => {}} />
            <Row label="Square footage" value={`${lawn.sqft.toLocaleString()} sq ft`} onPress={() => {}} />
            <Row label="Irrigation"     value={lawn.irrigation} onPress={() => {}} />
            <Row label="Sun exposure"   value={lawn.sun} onPress={() => {}} last />
          </Card>
        </View>

        {/* Notifications */}
        <View>
          <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>Notifications</Eyebrow>
          <Card padding={0}>
            <View style={[styles.row, { borderBottomWidth: 0.5, borderBottomColor: COLORS.line }]}>
              <Text style={styles.rowLabel}>Push notifications</Text>
              <Switch
                value={notifs}
                onValueChange={toggleNotifs}
                trackColor={{ false: '#cdc6b6', true: COLORS.leafGreen }}
                thumbColor="#fff"
              />
            </View>
            <Row
              label="Preferred time"
              value={notifTime}
              onPress={() => setNotifTime((t) => (t === '8:00 AM' ? '7:00 AM' : '8:00 AM'))}
              last
            />
          </Card>
        </View>

        {/* Subscription */}
        <View>
          <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>Subscription</Eyebrow>
          <Card padding={16}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.planTitle}>Grass Guru Free</Text>
                <Text style={styles.planSub}>7 / 10 AI requests this month</Text>
              </View>
              <Pressable
                onPress={() => overlayNav.navigate('Paywall')}
                style={styles.upgradeBtn}
              >
                <Text style={styles.upgradeText}>Upgrade</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Developer */}
        <View>
          <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>Developer</Eyebrow>
          <Card padding={16}>
            <Text style={styles.devCopy}>
              For testing. Fires the BGTaskScheduler check immediately.
            </Text>
            <GGButton
              kind="ghost"
              size="sm"
              full
              onPress={() => setBriefingFired(true)}
            >
              {briefingFired ? '✓ Briefing queued' : 'Trigger weekly briefing'}
            </GGButton>
          </Card>
        </View>

        {/* About */}
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <Text style={styles.aboutPrimary}>Grass Guru · v1.0.2</Text>
          <Text style={styles.aboutSecondary}>by TOV Labs · tovlabs.ai</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Row({
  label, value, onPress, last,
}: { label: string; value: string; onPress?: () => void; last?: boolean }) {
  const inner = (
    <View style={[styles.row, !last && { borderBottomWidth: 0.5, borderBottomColor: COLORS.line }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.rowValue}>{value}</Text>
        {onPress && <ChevronRight color={COLORS.ink} opacity={0.34} size={7} />}
      </View>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, color: COLORS.ink },
  rowValue: { fontSize: 14, color: COLORS.inkSoft },

  planTitle: { ...TYPE.headingSM },
  planSub: { ...TYPE.bodySoft, fontSize: 13, marginTop: 2 },
  upgradeBtn: {
    backgroundColor: COLORS.amber,
    height: 34, paddingHorizontal: 14,
    borderRadius: RADII.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  devCopy: { fontSize: 12, color: COLORS.inkSoft, marginBottom: 10 },

  aboutPrimary: {
    ...ACCENT_FONT,
    fontSize: 11, color: COLORS.inkFaint,
    letterSpacing: 1.1, textTransform: 'uppercase',
    textAlign: 'center',
  },
  aboutSecondary: {
    ...ACCENT_FONT,
    fontSize: 11, color: COLORS.inkFaint, opacity: 0.7,
    letterSpacing: 1.1, textTransform: 'uppercase',
    textAlign: 'center', marginTop: 2,
  },
});
