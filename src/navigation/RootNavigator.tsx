// ─────────────────────────────────────────────────────────────────────────────
// RootNavigator (Sprint 2)
//
// Top-level stack:
//   • Splash → checks for an active lawn
//   • Onboarding (existing flow) when no lawn exists
//   • Main → an overlay stack that wraps the 4-tab navigator. Log Issue,
//     Care Card, Ask Guru and Paywall are pushed as modals above the tabs.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';

import LogIssueScreen from '../screens/overlays/LogIssueScreen';
import CareCardScreen from '../screens/overlays/CareCardScreen';
import AskGuruScreen from '../screens/overlays/AskGuruScreen';
import PaywallScreen from '../screens/overlays/PaywallScreen';

import { getActiveLawnId } from '../storage/lawnStorage';
import { RootParamList } from '../types/lawn';
import { OverlayParamList } from './types';
import { COLORS } from '../design/tokens';

const RootStack = createNativeStackNavigator<RootParamList>();
const OverlayStack = createNativeStackNavigator<OverlayParamList>();

function MainOverlayStack() {
  return (
    <OverlayStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.cream },
      }}
    >
      <OverlayStack.Screen name="MainTabs" component={MainTabNavigator} />
      <OverlayStack.Screen
        name="LogIssue"
        component={LogIssueScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <OverlayStack.Screen
        name="CareCard"
        component={CareCardScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <OverlayStack.Screen
        name="AskGuru"
        component={AskGuruScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <OverlayStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </OverlayStack.Navigator>
  );
}

export default function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    getActiveLawnId()
      .then((id) => setHasProfile(id !== null))
      .catch(() => setHasProfile(false))
      .finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
      </RootStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {hasProfile ? (
        <RootStack.Screen name="Main" component={MainOverlayStack} />
      ) : (
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </RootStack.Navigator>
  );
}
