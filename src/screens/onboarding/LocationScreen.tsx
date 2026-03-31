import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { OnboardingParamList } from '../../types/lawn';
import { resolveLocationMetadata } from '../../services/LawnAI';
import { Colors, Typography, Spacing, Radii, CardStyle } from '../../constants/theme';

type Props = NativeStackScreenProps<OnboardingParamList, 'Location'>;

export default function LocationScreen({ navigation, route }: Props) {
  const { draft } = route.params;
  const [zip, setZip] = useState(draft.location?.zip ?? '');
  const [city, setCity] = useState(draft.location?.city ?? '');
  const [state, setState] = useState(draft.location?.state ?? '');
  const [loading, setLoading] = useState(false);

  async function handleUseMyLocation() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enter your ZIP code manually below.');
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(coords.coords);
      if (place) {
        setZip(place.postalCode ?? '');
        setCity(place.city ?? '');
        setState(place.region ?? '');
      }
    } catch {
      Alert.alert('Error', 'Could not determine location. Please enter manually.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    if (!zip && !city) {
      Alert.alert('Location required', 'Please enter your ZIP code or city.');
      return;
    }
    setLoading(true);
    try {
      const query = zip ? zip : `${city}, ${state}`;
      const meta = await resolveLocationMetadata(query);
      navigation.navigate('GrassType', {
        draft: {
          ...draft,
          location: {
            zip,
            city,
            state,
            usda_zone: meta.usda_zone,
            climate_region: meta.climate_region,
          },
        },
      });
    } catch {
      Alert.alert('Error', 'Could not look up location. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>Where is your lawn?</Text>
        <Text style={styles.sub}>
          We use your location to look up your USDA hardiness zone, climate
          region, and frost dates — the foundation of your maintenance plan.
        </Text>

        <TouchableOpacity style={styles.gpsButton} onPress={handleUseMyLocation} activeOpacity={0.8}>
          <Text style={styles.gpsIcon}>📍</Text>
          <Text style={styles.gpsText}>Use My Current Location</Text>
        </TouchableOpacity>

        <Text style={styles.divider}>— or enter manually —</Text>

        <View style={styles.card}>
          <Text style={styles.label}>ZIP Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 75218"
            value={zip}
            onChangeText={setZip}
            keyboardType="number-pad"
            maxLength={10}
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dallas"
            value={city}
            onChangeText={setCity}
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. TX"
            value={state}
            onChangeText={setState}
            maxLength={2}
            autoCapitalize="characters"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" />
        ) : (
          <TouchableOpacity style={styles.cta} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Next →</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.steps}>Step 2 of 5</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment },
  inner: { flex: 1, padding: Spacing.lg },
  heading: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: Typography.size.base * Typography.leading.relaxed,
    marginBottom: Spacing.lg,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  gpsIcon: { fontSize: 20 },
  gpsText: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.primary },
  divider: { textAlign: 'center', color: Colors.textMuted, fontSize: Typography.size.sm, marginVertical: Spacing.sm },
  card: { ...CardStyle, gap: Spacing.xs },
  label: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary, marginTop: Spacing.sm },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.size.base, color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  footer: { padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  cta: {
    backgroundColor: Colors.primary, borderRadius: Radii.full,
    paddingVertical: Spacing.md, width: '100%', alignItems: 'center',
  },
  ctaText: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.white },
  steps: { fontSize: Typography.size.sm, color: Colors.textMuted },
});
