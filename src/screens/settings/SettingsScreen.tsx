import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loadActiveLawnProfile, saveLawnProfile } from '../../storage/lawnStorage';
import { LawnProfile, RootParamList } from '../../types/lawn';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type NavProp = NativeStackNavigationProp<RootParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const [profile, setProfile] = useState<LawnProfile | null>(null);

  useEffect(() => {
    loadActiveLawnProfile().then(setProfile);
  }, []);

  async function toggleNotifications(value: boolean) {
    if (!profile) return;
    const updated = {
      ...profile,
      notification_preferences: { ...profile.notification_preferences, enabled: value },
    };
    await saveLawnProfile(updated);
    setProfile(updated);
  }

  function handleResetOnboarding() {
    Alert.alert(
      'Reset Onboarding',
      'This will clear your active lawn ID and return you to the welcome screen. Your lawn data will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const { deleteAsync, documentDirectory } = await import('expo-file-system');
            const keyFile = `${documentDirectory}active_lawn_id.txt`;
            try { await deleteAsync(keyFile, { idempotent: true }); } catch {}
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ],
    );
  }

  const notificationsEnabled = profile?.notification_preferences.enabled ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <SettingRow
          label="Push Notifications"
          sub="Lawn care reminders and seasonal alerts"
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={notificationsEnabled ? Colors.primary : Colors.textMuted}
            />
          }
        />
        <SettingRow
          label="Advance Notice"
          sub="Days before task to send reminder"
          right={<Text style={styles.valueText}>{profile?.notification_preferences.advance_days ?? 3} days</Text>}
        />
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <SettingRow label="App Version" right={<Text style={styles.valueText}>1.0.0</Text>} />
        <SettingRow label="Model" right={<Text style={styles.valueText}>Claude Opus 4.6</Text>} />
        <SettingRow
          label="AI Disclaimer"
          sub="Grass Guru provides informational recommendations only and is not a substitute for professional agronomic advice."
        />
      </View>

      {/* Account */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <SettingRow label="Plan" right={
          <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>Free</Text></View>
        } />
        <TouchableOpacity style={styles.proButton} activeOpacity={0.85}>
          <Text style={styles.proButtonText}>Upgrade to Grass Guru Pro</Text>
          <Text style={styles.proButtonSub}>$4.99/mo or $39/yr · Unlimited profiles, full export, priority AI</Text>
        </TouchableOpacity>
      </View>

      {/* Data */}
      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.dangerRow} onPress={handleResetOnboarding}>
          <Text style={styles.dangerText}>Reset Onboarding</Text>
          <Text style={styles.dangerSub}>Returns to welcome screen without deleting data</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Grass Guru · Built by TOV Labs · tovlabs.ai</Text>
    </ScrollView>
  );
}

function SettingRow({
  label,
  sub,
  right,
}: {
  label: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.md, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  sectionTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { ...CardStyle, padding: 0, overflow: 'hidden', gap: 0 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: Typography.size.base, color: Colors.textPrimary },
  rowSub: { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2, lineHeight: Typography.size.sm * Typography.leading.relaxed },
  rowRight: { marginLeft: Spacing.sm },
  valueText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  freeBadge: { backgroundColor: Colors.surface, borderRadius: Radii.full, paddingVertical: 2, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  freeBadgeText: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.semibold },
  proButton: {
    backgroundColor: Colors.primary, margin: Spacing.md, borderRadius: Radii.md,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  proButtonText: { color: Colors.white, fontWeight: Typography.weight.bold, fontSize: Typography.size.base },
  proButtonSub: { color: Colors.accentLight, fontSize: Typography.size.xs, textAlign: 'center' },
  dangerRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  dangerText: { fontSize: Typography.size.base, color: Colors.error, fontWeight: Typography.weight.semibold },
  dangerSub: { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2 },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: Typography.size.sm, marginTop: Spacing.md },
});
