import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useData } from '../data/DataContext';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { MainTabs } from './MainTabs';
import { ChatScreen } from '../screens/today/ChatScreen';
import { PhotoConfirmModal } from '../screens/flows/PhotoConfirmModal';
import { VoiceConfirmModal } from '../screens/flows/VoiceConfirmModal';
import { ProfileUpdateModal } from '../screens/flows/ProfileUpdateModal';
import { WeeklyRecapModal } from '../screens/memory/WeeklyRecapModal';
import { GoalSwitcherModal } from '../screens/profile/GoalSwitcherModal';
import { PatternDetailModal } from '../screens/flows/PatternDetailModal';
import { QuickEntryModal } from '../screens/flows/QuickEntryModal';
import { SplashView } from '../screens/SplashView';
import type { PhotoAnalysis, ParsedEntry } from '../ai/coach';
import type { PatternFlag, WeeklyRecap } from '../data/types';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Chat: undefined;
  PhotoConfirm: { photoUri: string; analysis: PhotoAnalysis };
  VoiceConfirm: { transcript: string; durationSec: number; entries: ParsedEntry[] };
  ProfileUpdate: { rawInput: string; proposals: { kind: 'limitation' | 'plan'; label: string; note?: string }[] };
  PatternDetail: { pattern: PatternFlag };
  WeeklyRecap: { recap: WeeklyRecap };
  GoalSwitcher: undefined;
  QuickEntry: { kind: 'recovery' | 'inbody' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { ready, onboarded } = useData();
  if (!ready) return <SplashView />;
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F1E2' } }}
    >
      {!onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: 'card' }} />
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="PhotoConfirm" component={PhotoConfirmModal} />
            <Stack.Screen name="VoiceConfirm" component={VoiceConfirmModal} />
            <Stack.Screen name="ProfileUpdate" component={ProfileUpdateModal} />
            <Stack.Screen name="PatternDetail" component={PatternDetailModal} />
            <Stack.Screen name="WeeklyRecap" component={WeeklyRecapModal} />
            <Stack.Screen name="GoalSwitcher" component={GoalSwitcherModal} />
            <Stack.Screen name="QuickEntry" component={QuickEntryModal} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}
