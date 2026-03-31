import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingParamList, LawnZone } from '../../types/lawn';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';
import { v4 as uuidv4 } from 'uuid';

type Props = NativeStackScreenProps<OnboardingParamList, 'Measurement'>;

interface ZoneDraft {
  label: string;
  length: string;
  width: string;
}

const DEFAULT_ZONES: ZoneDraft[] = [
  { label: 'Front Yard', length: '', width: '' },
  { label: 'Back Yard', length: '', width: '' },
];

export default function MeasurementScreen({ navigation, route }: Props) {
  const { draft } = route.params;
  const [zones, setZones] = useState<ZoneDraft[]>(DEFAULT_ZONES);

  function totalSqFt(): number {
    return zones.reduce((sum, z) => {
      const l = parseFloat(z.length) || 0;
      const w = parseFloat(z.width) || 0;
      return sum + l * w;
    }, 0);
  }

  function updateZone(index: number, field: keyof ZoneDraft, value: string) {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, [field]: value } : z)));
  }

  function addZone() {
    setZones((prev) => [...prev, { label: `Zone ${prev.length + 1}`, length: '', width: '' }]);
  }

  function removeZone(index: number) {
    if (zones.length <= 1) return;
    setZones((prev) => prev.filter((_, i) => i !== index));
  }

  function handleOpenMeasureApp() {
    // Deep-link into Apple Measure app. Note: returning data to the app is not
    // natively supported — prompt the user to note their measurement and enter it here.
    Alert.alert(
      'Apple Measure App',
      'The Measure app will open. Measure your lawn area, note the result, then come back and enter it below.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Measure',
          onPress: () => Linking.openURL('measure://').catch(() =>
            Alert.alert('Not available', 'The Measure app is not available on this device.'),
          ),
        },
      ],
    );
  }

  function handleNext() {
    const total = totalSqFt();
    if (total === 0) {
      Alert.alert('Enter measurements', 'Please enter at least one zone with length and width.');
      return;
    }

    const lawnZones: LawnZone[] = zones
      .filter((z) => parseFloat(z.length) > 0 && parseFloat(z.width) > 0)
      .map((z) => ({
        zone_id: uuidv4(),
        label: z.label,
        sq_ft: parseFloat(z.length) * parseFloat(z.width),
        sun_exposure: 'full_sun', // will be set in next step
        irrigation: 'none', // will be set in next step
      }));

    navigation.navigate('Condition', {
      draft: { ...draft, zones: lawnZones, total_sq_ft: total },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>How big is your lawn?</Text>
        <Text style={styles.sub}>
          Enter the length × width for each zone. You can add multiple zones for
          front yard, back yard, side strips, etc.
        </Text>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.measureButton} onPress={handleOpenMeasureApp} activeOpacity={0.8}>
            <Text style={styles.measureIcon}>📐</Text>
            <View>
              <Text style={styles.measureTitle}>Open Apple Measure App</Text>
              <Text style={styles.measureSub}>Measure, then enter results below</Text>
            </View>
          </TouchableOpacity>
        )}

        {zones.map((zone, index) => (
          <View key={index} style={styles.zoneCard}>
            <View style={styles.zoneHeader}>
              <TextInput
                style={styles.zoneLabel}
                value={zone.label}
                onChangeText={(v) => updateZone(index, 'label', v)}
                placeholder="Zone name"
                placeholderTextColor={Colors.textMuted}
              />
              {zones.length > 1 && (
                <TouchableOpacity onPress={() => removeZone(index)}>
                  <Text style={styles.removeZone}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dimensions}>
              <View style={styles.dimField}>
                <Text style={styles.dimLabel}>Length (ft)</Text>
                <TextInput
                  style={styles.dimInput}
                  value={zone.length}
                  onChangeText={(v) => updateZone(index, 'length', v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <Text style={styles.times}>×</Text>
              <View style={styles.dimField}>
                <Text style={styles.dimLabel}>Width (ft)</Text>
                <TextInput
                  style={styles.dimInput}
                  value={zone.width}
                  onChangeText={(v) => updateZone(index, 'width', v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.dimField}>
                <Text style={styles.dimLabel}>Sq Ft</Text>
                <Text style={styles.sqFtValue}>
                  {((parseFloat(zone.length) || 0) * (parseFloat(zone.width) || 0)).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addZone} onPress={addZone} activeOpacity={0.7}>
          <Text style={styles.addZoneText}>+ Add Another Zone</Text>
        </TouchableOpacity>

        {totalSqFt() > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Lawn Area</Text>
            <Text style={styles.totalValue}>{totalSqFt().toLocaleString()} sq ft</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Next →</Text>
        </TouchableOpacity>
        <Text style={styles.steps}>Step 4 of 5</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['2xl'] },
  heading: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  sub: { fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: Typography.size.base * Typography.leading.relaxed },
  measureButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primaryPale, borderRadius: Radii.md, padding: Spacing.md,
  },
  measureIcon: { fontSize: 28 },
  measureTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.primary },
  measureSub: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  zoneCard: { ...CardStyle, gap: Spacing.sm },
  zoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zoneLabel: { flex: 1, fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  removeZone: { fontSize: 16, color: Colors.error, padding: Spacing.xs },
  dimensions: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  dimField: { flex: 1 },
  dimLabel: { fontSize: Typography.size.xs, color: Colors.textMuted, marginBottom: 2 },
  dimInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    fontSize: Typography.size.base, color: Colors.textPrimary, textAlign: 'center',
    backgroundColor: Colors.white,
  },
  sqFtValue: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, textAlign: 'center', paddingVertical: Spacing.xs },
  times: { fontSize: Typography.size.lg, color: Colors.textMuted, marginBottom: Spacing.xs },
  addZone: { alignItems: 'center', padding: Spacing.sm },
  addZoneText: { fontSize: Typography.size.base, color: Colors.primary, fontWeight: Typography.weight.semibold },
  totalCard: { ...CardStyle, backgroundColor: Colors.primaryPale, alignItems: 'center', gap: 2 },
  totalLabel: { fontSize: Typography.size.sm, color: Colors.primaryLight, fontWeight: Typography.weight.semibold },
  totalValue: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.primary },
  footer: { padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  cta: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  ctaText: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.white },
  steps: { fontSize: Typography.size.sm, color: Colors.textMuted },
});
