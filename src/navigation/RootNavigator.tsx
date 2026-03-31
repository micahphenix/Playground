// ─────────────────────────────────────────────────────────────────────────────
// RootNavigator
//
// Top-level navigator. On mount, checks whether any lawn profiles exist:
//   • No profiles → show Onboarding stack
//   • Profiles exist → show Main tabs
//
// The Splash screen is shown while we check storage.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';

import { getActiveLawnId } from '../storage/lawnStorage';
import { RootParamList } from '../types/lawn';

const Stack = createNativeStackNavigator<RootParamList>();

export default function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    checkForExistingProfile();
  }, []);

  async function checkForExistingProfile() {
    try {
      const activeLawnId = await getActiveLawnId();
      setHasProfile(activeLawnId !== null);
    } catch {
      setHasProfile(false);
    } finally {
      setIsReady(true);
    }
  }

  if (!isReady) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {hasProfile ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}
