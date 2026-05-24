// ─────────────────────────────────────────────────────────────────────────────
// Log Issue overlay — Sprint 2.
// Captures photo + type + zone + description, then routes to Care Card.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS, RADII, SPACING, TYPE } from '../../design/tokens';
import { AppHeader, Card, Eyebrow, GGButton, Heading } from '../../design/components';
import { ArrowRight, CameraIcon } from '../../design/icons';
import { ISSUE_TYPES, IssueTypeLabel } from '../../data/seed';
import { OverlayParamList } from '../../navigation/types';

import {
  addIssueToProfile, loadLawnProfile, updateIssueStatus,
} from '../../storage/lawnStorage';
import { serializeCare, typeLabelToEnum } from '../../data/issueModel';
import { synthCare } from '../../services/careSynth';
import { diagnoseOtherIssue } from '../../services/askGuru';
import { lawnContextFromProfile } from '../../data/lawnContext';

type Props = NativeStackScreenProps<OverlayParamList, 'LogIssue'>;

export default function LogIssueScreen({ navigation, route }: Props) {
  const { lawnId } = route.params;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<IssueTypeLabel | null>(null);
  const [zone, setZone] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function pickPhoto() {
    if (photoUri) {
      setPhotoUri(null);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function submit() {
    if (!issueType || submitting) return;
    setSubmitting(true);

    const profile = await loadLawnProfile(lawnId);
    if (!profile) { setSubmitting(false); return; }
    const lawn = lawnContextFromProfile(profile);

    // Build the CareCard up-front: canned for known types, Claude for "Other".
    let care = synthCare(issueType, lawn, desc.trim() || undefined);
    if (issueType === 'Other') {
      const ai = await diagnoseOtherIssue(
        { description: desc.trim(), zone: zone.trim(), hasPhoto: !!photoUri },
        lawn,
      );
      if (ai) care = ai;
    }

    const newIssue = await addIssueToProfile(lawnId, {
      type: typeLabelToEnum(issueType),
      zone: zone.trim() || 'Unspecified',
      description: desc.trim(),
      photo_uri: photoUri ?? undefined,
    });

    if (!newIssue) { setSubmitting(false); return; }
    await updateIssueStatus(lawnId, newIssue.issue_id, {
      ai_recommendation: serializeCare(care),
    });

    setSubmitting(false);
    navigation.replace('CareCard', { lawnId, issueId: newIssue.issue_id });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        eyebrow="NEW REPORT"
        onBack={() => navigation.goBack()}
        title={
          <Heading level={1} italic>
            <Text style={{ opacity: 0.6 }}>What's</Text> happening?
          </Heading>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.appX, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>Photo (optional)</Eyebrow>
        <Pressable onPress={pickPhoto} style={{ marginBottom: 22 }}>
          {photoUri ? (
            <View style={styles.photoFilled}>
              <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.removePill}>
                <Text style={styles.removePillText}>Tap to remove</Text>
              </View>
            </View>
          ) : (
            <View style={styles.photoEmpty}>
              <CameraIcon />
              <Text style={styles.photoTitle}>Add a photo</Text>
              <Text style={styles.photoSub}>Camera or library</Text>
            </View>
          )}
        </Pressable>

        {/* Issue type chips */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>What is it?</Eyebrow>
        <View style={styles.chipWrap}>
          {ISSUE_TYPES.map((t) => {
            const active = issueType === t;
            return (
              <Pressable
                key={t}
                onPress={() => setIssueType(t)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Zone */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 4, marginTop: 22 }}>Where on the lawn?</Eyebrow>
        <TextInput
          value={zone}
          onChangeText={setZone}
          placeholder="e.g. back corner near the fence"
          placeholderTextColor={COLORS.inkFaint}
          style={styles.input}
        />

        {/* Description */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 4, marginTop: 22 }}>Anything else?</Eyebrow>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Describe what you're seeing…"
          placeholderTextColor={COLORS.inkFaint}
          style={[styles.input, styles.textarea]}
          multiline
          textAlignVertical="top"
        />

        <View style={{ marginTop: 24 }}>
          <GGButton
            kind="primary"
            size="lg"
            full
            disabled={!issueType || submitting}
            onPress={submit}
            trailingIcon={<ArrowRight color={COLORS.cream} />}
          >
            {submitting ? 'Getting recommendation…' : 'Get recommendation'}
          </GGButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  photoEmpty: {
    height: 110,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: `${COLORS.deepGreen}33`,
    borderRadius: RADII.card,
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBg,
  },
  photoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.deepGreen },
  photoSub: { fontSize: 12, color: COLORS.inkSoft },

  photoFilled: {
    height: 160,
    borderRadius: RADII.card,
    overflow: 'hidden',
    backgroundColor: COLORS.softCardBg,
  },
  removePill: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  removePillText: { color: '#fff', fontSize: 11, fontWeight: '600', letterSpacing: 0.44 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: `${COLORS.deepGreen}22`,
  },
  chipActive: {
    backgroundColor: COLORS.deepGreen,
    borderColor: COLORS.deepGreen,
  },
  chipText: { fontSize: 13.5, fontWeight: '600', color: COLORS.deepGreen, letterSpacing: -0.07 },
  chipTextActive: { color: COLORS.cream },

  input: {
    width: '100%',
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.button,
    backgroundColor: COLORS.cardBg,
    fontSize: 14.5,
    color: COLORS.ink,
  },
  textarea: {
    height: 110,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
