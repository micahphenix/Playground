// ─────────────────────────────────────────────────────────────────────────────
// OnboardingNavigator
//
// A linear stack guiding new users through 5 steps to build their first lawn
// profile. The OnboardingDraft is threaded through as route params so each
// screen can append its data and pass the updated draft forward.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LocationScreen from '../screens/onboarding/LocationScreen';
import GrassTypeScreen from '../screens/onboarding/GrassTypeScreen';
import MeasurementScreen from '../screens/onboarding/MeasurementScreen';
import ConditionScreen from '../screens/onboarding/ConditionScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';

import { OnboardingParamList } from '../types/lawn';
import { Colors } from '../constants/theme';

const Stack = createNativeStackNavigator<OnboardingParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.parchment },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Location"
        component={LocationScreen}
        options={{ title: 'Your Location' }}
      />
      <Stack.Screen
        name="GrassType"
        component={GrassTypeScreen}
        options={{ title: 'Grass Type' }}
      />
      <Stack.Screen
        name="Measurement"
        component={MeasurementScreen}
        options={{ title: 'Lawn Size' }}
      />
      <Stack.Screen
        name="Condition"
        component={ConditionScreen}
        options={{ title: 'Current Condition' }}
      />
      <Stack.Screen
        name="OnboardingComplete"
        component={OnboardingCompleteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
