// ─────────────────────────────────────────────────────────────────────────────
// MainTabNavigator
//
// Bottom tab bar for the main app experience. The Issues tab uses a nested
// stack to allow drilling into LogNewIssue and IssueDetail.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MaintenancePlanScreen from '../screens/plan/MaintenancePlanScreen';
import IssueLogScreen from '../screens/issues/IssueLogScreen';
import LogNewIssueScreen from '../screens/issues/LogNewIssueScreen';
import IssueDetailScreen from '../screens/issues/IssueDetailScreen';
import LawnProfileScreen from '../screens/profile/LawnProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import { MainTabParamList, IssuesStackParamList } from '../types/lawn';
import { Colors, Typography, Spacing } from '../constants/theme';
import { getActiveLawnId } from '../storage/lawnStorage';

// ── Tab icons (inline SVG-like components — swap for an icon library) ─────────

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⌂',
    Plan: '📅',
    Issues: '⚠',
    Profile: '🌿',
    Settings: '⚙',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

// ── Issues stack (nested inside the Issues tab) ───────────────────────────────

const IssuesStack = createNativeStackNavigator<IssuesStackParamList>();

function IssuesNavigator({ lawnId }: { lawnId: string }) {
  return (
    <IssuesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.parchment },
      }}
    >
      <IssuesStack.Screen
        name="IssueLog"
        component={IssueLogScreen}
        options={{ title: 'Issue Log' }}
        initialParams={{ lawnId }}
      />
      <IssuesStack.Screen
        name="LogNewIssue"
        component={LogNewIssueScreen}
        options={{ title: 'Log New Issue' }}
        initialParams={{ lawnId }}
      />
      <IssuesStack.Screen
        name="IssueDetail"
        component={IssueDetailScreen}
        options={{ title: 'Issue Detail' }}
        initialParams={{ lawnId, issueId: '' }}
      />
    </IssuesStack.Navigator>
  );
}

// ── Bottom tabs ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const [activeLawnId, setActiveLawnId] = useState<string>('');

  useEffect(() => {
    getActiveLawnId().then((id) => setActiveLawnId(id ?? ''));
  }, []);

  if (!activeLawnId) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ lawnId: activeLawnId }}
        options={{ title: 'Home', headerTitle: 'Grass Guru' }}
      />
      <Tab.Screen
        name="MaintenancePlan"
        component={MaintenancePlanScreen}
        initialParams={{ lawnId: activeLawnId }}
        options={{ title: 'Plan' }}
      />
      <Tab.Screen
        name="IssueLog"
        options={{ title: 'Issues', headerShown: false }}
      >
        {() => <IssuesNavigator lawnId={activeLawnId} />}
      </Tab.Screen>
      <Tab.Screen
        name="LawnProfile"
        component={LawnProfileScreen}
        initialParams={{ lawnId: activeLawnId }}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.border,
    height: 60,
    paddingBottom: Spacing.sm,
  },
  tabLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
  },
});
