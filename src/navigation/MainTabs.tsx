import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { TodayScreen } from '../screens/today/TodayScreen';
import { WorkoutsScreen } from '../screens/workouts/WorkoutsScreen';
import { MemoryScreen } from '../screens/memory/MemoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

export type MainTabParamList = {
  Today: undefined;
  Workouts: undefined;
  Memory: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <ClayTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
      <Tab.Screen name="Memory" component={MemoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ClayTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        borderTopWidth: 0.5,
        borderTopColor: colors.line,
        backgroundColor: colors.surface,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 6),
        flexDirection: 'row',
      }}
    >
      {state.routes.map((route, idx) => {
        const isFocused = state.index === idx;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name as never);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
          >
            <TabIcon name={route.name as keyof MainTabParamList} active={isFocused} />
            <Text
              style={{
                marginTop: 3,
                fontFamily: isFocused ? fonts.sansBold : fonts.sansMed,
                fontSize: 10,
                letterSpacing: 0.2,
                color: isFocused ? colors.accent : colors.muted,
              }}
            >
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ name, active }: { name: keyof MainTabParamList; active: boolean }) {
  const stroke = active ? colors.accent : colors.muted;
  const w = 22,
    h = 22;
  switch (name) {
    case 'Today':
      return (
        <Svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
        </Svg>
      );
    case 'Workouts':
      return (
        <Svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6.5 6.5l11 11M4 9l-1.5 1.5a1.5 1.5 0 0 0 0 2.1l.4.4M20 15l1.5-1.5a1.5 1.5 0 0 0 0-2.1l-.4-.4M9 4l1.5-1.5a1.5 1.5 0 0 1 2.1 0l.4.4M15 20l-1.5 1.5a1.5 1.5 0 0 1-2.1 0l-.4-.4" />
        </Svg>
      );
    case 'Memory':
      return (
        <Svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={3.2} />
          <Path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </Svg>
      );
    case 'Profile':
      return (
        <Svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </Svg>
      );
  }
}

