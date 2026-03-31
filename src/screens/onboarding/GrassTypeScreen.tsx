import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingParamList } from '../../types/lawn';
import { identifyGrass } from '../../services/LawnAI';
import { GRASS_TYPES } from '../../constants/grassTypes';
import { Colors, Typography, Spacing, Radii, CardStyle, Shadows } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingParamList, 'GrassType'>;

export default function GrassTypeScreen({ navigation, route }: Props) {
  const { draft } = route.params;
  const [selected, setSelected] = useState<string>(draft.grass?.type ?? '');
  const [identifying, setIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState(
    draft.grass?.type && draft.grass.identified_via === 'photo'
      ? draft.grass
      : null,
  );

  async function handlePhotoIdentify() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to identify your grass.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64) return;

    setIdentifying(true);
    try {
      const aiResult = await identifyGrass(result.assets[0].base64);
      setSelected(aiResult.grass_type);
      setIdentificationResult({
        type: aiResult.grass_type,
        identified_via: 'photo',
        confidence: aiResult.confidence,
        identification_date: new Date().toISOString().slice(0, 10),
        description: aiResult.description,
        care_summary: aiResult.care_summary,
      });
    } catch (err) {
      Alert.alert('Identification failed', 'Could not identify the grass. Please select manually.');
    } finally {
      setIdentifying(false);
    }
  }

  function handleNext() {
    if (!selected) {
      Alert.alert('Select a grass type', 'Please choose your grass type or use photo ID.');
      return;
    }
    const grass = identificationResult ?? {
      type: selected,
      identified_via: 'manual_selection' as const,
      confidence: 1.0,
      identification_date: new Date().toISOString().slice(0, 10),
    };
    navigation.navigate('Measurement', { draft: { ...draft, grass } });
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>What kind of grass do you have?</Text>
        <Text style={styles.sub}>Not sure? Take a close-up photo of a blade and we'll identify it.</Text>

        <TouchableOpacity style={styles.photoButton} onPress={handlePhotoIdentify} activeOpacity={0.8} disabled={identifying}>
          {identifying ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>Identify via Photo</Text>
            </>
          )}
        </TouchableOpacity>

        {identificationResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>AI Identified:</Text>
            <Text style={styles.resultType}>{identificationResult.type}</Text>
            <Text style={styles.resultConfidence}>
              Confidence: {Math.round((identificationResult.confidence ?? 0) * 100)}%
            </Text>
            {identificationResult.description ? (
              <Text style={styles.resultDesc}>{identificationResult.description}</Text>
            ) : null}
          </View>
        )}

        <Text style={styles.orLabel}>— Select manually —</Text>

        {GRASS_TYPES.map((grass) => (
          <TouchableOpacity
            key={grass.id}
            style={[styles.option, selected === grass.name && styles.optionSelected]}
            onPress={() => {
              setSelected(grass.name);
              if (grass.id !== 'unknown') setIdentificationResult(null);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionName, selected === grass.name && styles.optionNameSelected]}>
                  {grass.name}
                </Text>
                {grass.id !== 'unknown' && (
                  <Text style={styles.optionTagline}>{grass.tagline}</Text>
                )}
              </View>
              {selected === grass.name && <Text style={styles.check}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Next →</Text>
        </TouchableOpacity>
        <Text style={styles.steps}>Step 3 of 5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing['2xl'], gap: Spacing.sm },
  heading: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  sub: { fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: Typography.size.base * Typography.leading.relaxed, marginBottom: Spacing.md },
  photoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.sm,
    minHeight: 52,
  },
  photoIcon: { fontSize: 22 },
  photoText: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.white },
  resultCard: { ...CardStyle, backgroundColor: Colors.primaryPale, borderWidth: 1, borderColor: Colors.primaryLight, marginBottom: Spacing.sm },
  resultLabel: { fontSize: Typography.size.sm, color: Colors.primaryLight, fontWeight: Typography.weight.semibold },
  resultType: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.primary, marginTop: 2 },
  resultConfidence: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  resultDesc: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: Typography.size.sm * Typography.leading.relaxed },
  orLabel: { textAlign: 'center', color: Colors.textMuted, fontSize: Typography.size.sm, marginVertical: Spacing.xs },
  option: {
    ...CardStyle, ...Shadows.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  optionName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  optionNameSelected: { color: Colors.primary },
  optionTagline: { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2 },
  check: { fontSize: 18, color: Colors.primary, fontWeight: Typography.weight.bold },
  footer: { padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  cta: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  ctaText: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.white },
  steps: { fontSize: Typography.size.sm, color: Colors.textMuted },
});
