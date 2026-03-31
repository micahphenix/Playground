import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IssuesStackParamList, IssueType } from '../../types/lawn';
import { addIssueToProfile, updateIssueStatus } from '../../storage/lawnStorage';
import { generateIssueRecommendation } from '../../services/LawnAI';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type Props = NativeStackScreenProps<IssuesStackParamList, 'LogNewIssue'>;

const ISSUE_TYPES: { value: IssueType; label: string; emoji: string }[] = [
  { value: 'fungus', label: 'Fungus', emoji: '🍄' },
  { value: 'brown_patch', label: 'Brown Patch', emoji: '🟤' },
  { value: 'grubs', label: 'Grubs', emoji: '🪲' },
  { value: 'chinch_bugs', label: 'Chinch Bugs', emoji: '🐛' },
  { value: 'bare_spots', label: 'Bare Spots', emoji: '⬜' },
  { value: 'weeds', label: 'Weeds', emoji: '🌿' },
  { value: 'drought_stress', label: 'Drought Stress', emoji: '🥵' },
  { value: 'nutrient_deficiency', label: 'Nutrient Deficiency', emoji: '🟡' },
  { value: 'thatch', label: 'Thatch', emoji: '🌾' },
  { value: 'other', label: 'Other', emoji: '❓' },
];

export default function LogNewIssueScreen({ navigation, route }: Props) {
  const { lawnId } = route.params;
  const [issueType, setIssueType] = useState<IssueType>('weeds');
  const [zone, setZone] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePickPhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  }

  async function handleSave() {
    if (!description.trim()) {
      Alert.alert('Description required', 'Please describe the issue you are seeing.');
      return;
    }
    setSaving(true);
    try {
      // Create the issue record
      const newIssue = await addIssueToProfile(lawnId, {
        type: issueType,
        zone: zone || 'General',
        description: description.trim(),
        photo_uri: photoUri ?? undefined,
      });

      if (!newIssue) throw new Error('Failed to save issue');

      // Fetch AI recommendation
      const profile = await import('../../storage/lawnStorage').then((m) =>
        m.loadLawnProfile(lawnId),
      );
      if (profile) {
        const rec = await generateIssueRecommendation(
          newIssue,
          profile,
          photoBase64 ?? undefined,
        );
        const aiText = `**Recommendation:** ${rec.recommendation}\n\n**Product type:** ${rec.product_type}\n**Rate:** ${rec.application_rate}\n**Timing:** ${rec.timing}\n\n⚠️ ${rec.safety_notes}`;
        await updateIssueStatus(lawnId, newIssue.issue_id, { ai_recommendation: aiText });
      }

      navigation.replace('IssueDetail', { lawnId, issueId: newIssue.issue_id });
    } catch (err) {
      Alert.alert('Error', 'Could not save issue. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Issue type</Text>
        <View style={styles.typeGrid}>
          {ISSUE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, issueType === t.value && styles.typeChipSelected]}
              onPress={() => setIssueType(t.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeEmoji}>{t.emoji}</Text>
              <Text style={[styles.typeLabel, issueType === t.value && styles.typeLabelSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Zone / location on lawn</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Back right corner near fence"
          value={zone}
          onChangeText={setZone}
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Describe what you're seeing — size, color, spread, when it started…"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholderTextColor={Colors.textMuted}
          textAlignVertical="top"
        />

        <Text style={styles.sectionLabel}>Photo <Text style={styles.optional}>(optional — improves AI accuracy)</Text></Text>
        {photoUri ? (
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <Text style={styles.retakeText}>Tap to retake</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto} activeOpacity={0.8}>
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={styles.photoText}>Take a Photo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.aiNote}>
          <Text style={styles.aiNoteText}>
            🤖 After saving, our AI will generate a treatment recommendation specific to your lawn.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {saving ? (
          <View style={styles.savingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.savingText}>Saving & getting AI recommendation…</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveButtonText}>Save & Get AI Recommendation</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing['2xl'] },
  sectionLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginTop: Spacing.sm },
  optional: { fontWeight: Typography.weight.regular, color: Colors.textMuted, fontSize: Typography.size.sm },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: { alignItems: 'center', width: '22%', ...CardStyle, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  typeChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  typeEmoji: { fontSize: 22 },
  typeLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  typeLabelSelected: { color: Colors.primary, fontWeight: Typography.weight.semibold },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.size.base, color: Colors.textPrimary, backgroundColor: Colors.white,
  },
  multiline: { minHeight: 100 },
  photoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border, borderRadius: Radii.md,
    padding: Spacing.xl, backgroundColor: Colors.white,
  },
  photoIcon: { fontSize: 28 },
  photoText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  photoPreview: { width: '100%', height: 200, borderRadius: Radii.md },
  retakeText: { textAlign: 'center', color: Colors.primary, marginTop: Spacing.xs, fontSize: Typography.size.sm },
  aiNote: { backgroundColor: Colors.primaryPale, borderRadius: Radii.md, padding: Spacing.md },
  aiNoteText: { fontSize: Typography.size.sm, color: Colors.primary, lineHeight: Typography.size.sm * Typography.leading.relaxed },
  footer: { padding: Spacing.lg },
  saveButton: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.md, alignItems: 'center' },
  saveButtonText: { color: Colors.white, fontWeight: Typography.weight.bold, fontSize: Typography.size.md },
  savingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  savingText: { color: Colors.textSecondary, fontSize: Typography.size.base },
});
