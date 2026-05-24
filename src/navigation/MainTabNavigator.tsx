// ─────────────────────────────────────────────────────────────────────────────
// Main 4-tab navigator: Home, Plan, Issues, Profile.
// Custom tab bar uses the Sprint 2 SVG glyphs and Porch ethos colors.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MaintenancePlanScreen from '../screens/plan/MaintenancePlanScreen';
import IssueLogScreen from '../screens/issues/IssueLogScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import { MainTabParamList } from '../types/lawn';
import { COLORS } from '../design/tokens';
import { HomeTab, PlanTab, IssuesTab, ProfileTab } from '../design/icons';
import { getActiveLawnId } from '../storage/lawnStorage';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Custom tab bar ───────────────────────────────────────────────────────────

const TAB_DEFS: { id: keyof MainTabParamList; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'Dashboard',       label: 'Home',    Icon: HomeTab },
  { id: 'MaintenancePlan', label: 'Plan',    Icon: PlanTab },
  { id: 'IssueLog',        label: 'Issues',  Icon: IssuesTab },
  { id: 'Settings',        label: 'Profile', Icon: ProfileTab },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.barInner}>
        {TAB_DEFS.map((def, i) => {
          const active = state.index === i;
          const route = state.routes[i];
          return (
            <Pressable
              key={def.id}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabBtn}
            >
              <def.Icon active={active} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{def.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Tab navigator ───────────────────────────────────────────────────────────

export default function MainTabNavigator() {
  const [activeLawnId, setActiveLawnId] = useState<string>('');

  useEffect(() => {
    getActiveLawnId().then((id) => setActiveLawnId(id ?? ''));
  }, []);

  if (!activeLawnId) {
    return <View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View>;
  }

  return (
    <Tab.Navigator
      tabBar={CustomTabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ lawnId: activeLawnId }}
      />
      <Tab.Screen
        name="MaintenancePlan"
        component={MaintenancePlanScreen}
        initialParams={{ lawnId: activeLawnId }}
      />
      <Tab.Screen
        name="IssueLog"
        component={IssueLogScreen}
        initialParams={{ lawnId: activeLawnId }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.cream,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    paddingTop: 8,
  },
  barInner: { flexDirection: 'row', justifyContent: 'space-around' },
  tabBtn: {
    alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: COLORS.deepGreen,
    opacity: 0.45,
    marginTop: 3,
  },
  tabLabelActive: { opacity: 1 },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
  loadingText: { color: COLORS.inkSoft, fontSize: 16 },
});
