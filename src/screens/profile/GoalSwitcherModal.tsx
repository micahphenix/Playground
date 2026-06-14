import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts, radii } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { PillButton } from '../../components/PillButton';
import { useData } from '../../data/DataContext';
import { TRACKING_PLANS, selectedGoalIds } from '../../data/trackingPlans';
import type { GoalId } from '../../data/types';

// One row per goal, derived from the single TrackingPlan registry.
const COLOR_BY_KEY = {
  accent: colors.accent,
  accentAlt: colors.accentAlt,
  muted: colors.muted,
  good: colors.good,
  warn: colors.warn,
} as const;

const GOALS = Object.values(TRACKING_PLANS).map(p => ({
  id: p.goalId,
  name: p.name,
  detail: p.detail,
  quote: p.quote,
  color: COLOR_BY_KEY[p.colorKey],
  dateNeeded: p.rideDateRelevant ?? false,
}));

export function GoalSwitcherModal() {
  const nav = useNavigation();
  const { profile, updateProfile } = useData();
  const [picking, setPicking] = useState(false);
  if (!profile) return null;

  const selected = selectedGoalIds(profile);

  async function onPickDate(_: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setPicking(false);
    if (!date) return;
    await updateProfile({ rideTargetDate: date.toISOString().slice(0, 10) });
  }

  async function toggleGoal(id: GoalId) {
    if (!profile) return;
    if (!selected.includes(id)) {
      await updateProfile({ secondaryGoals: [...profile.secondaryGoals, id] });
      return;
    }
    if (id === profile.activeGoal) {
      // Removing the primary — promote the first secondary if there is one;
      // never leave zero goals.
      if (profile.secondaryGoals.length > 0) {
        const [next, ...rest] = profile.secondaryGoals;
        await updateProfile({ activeGoal: next, secondaryGoals: rest });
      }
      return;
    }
    await updateProfile({ secondaryGoals: profile.secondaryGoals.filter(x => x !== id) });
  }

  async function makePrimary(id: GoalId) {
    if (!profile || id === profile.activeGoal) return;
    await updateProfile({
      activeGoal: id,
      secondaryGoals: [profile.activeGoal, ...profile.secondaryGoals.filter(x => x !== id)],
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Your goals" sub="tap to track · first is primary" onClose={nav.goBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
        {GOALS.map(g => {
          const isSelected = selected.includes(g.id);
          const isPrimary = profile.activeGoal === g.id;
          return (
            <Pressable key={g.id} onPress={() => toggleGoal(g.id)}>
              <Card
                style={{
                  padding: 16,
                  borderColor: isSelected ? g.color : colors.line,
                  borderWidth: isSelected ? 1.5 : 0.5,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: g.color }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifBold, fontSize: 19, color: colors.ink, letterSpacing: -0.4 }}>
                      {g.name}
                    </Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 2 }}>
                      {g.detail}
                    </Text>
                  </View>
                  {isPrimary ? (
                    <Chip tone="accent">Primary</Chip>
                  ) : isSelected ? (
                    <Pressable onPress={() => makePrimary(g.id)} hitSlop={8}>
                      <Chip>Make primary</Chip>
                    </Pressable>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontFamily: fonts.serifRegItalic,
                    fontStyle: 'italic',
                    fontSize: 14.5,
                    color: colors.body,
                    marginTop: 12,
                    lineHeight: 22,
                    paddingLeft: 14,
                    borderLeftWidth: 2,
                    borderLeftColor: g.color,
                  }}
                >
                  "{g.quote}"
                </Text>
                {g.dateNeeded && (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 11,
                      backgroundColor: colors.bg,
                      borderRadius: radii.sm,
                      borderWidth: 0.5,
                      borderColor: profile.rideTargetDate ? colors.line : colors.lineStrong,
                      borderStyle: profile.rideTargetDate ? 'solid' : 'dashed',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={profile.rideTargetDate ? colors.accentAlt : colors.warn} strokeWidth={2}>
                      <Circle cx={12} cy={12} r={9} />
                      <Path d="M12 8v4M12 16h0" />
                    </Svg>
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: fonts.sans,
                        fontSize: 12,
                        color: profile.rideTargetDate ? colors.body : colors.warn,
                      }}
                    >
                      {profile.rideTargetDate
                        ? `Target: ${formatDate(profile.rideTargetDate)} · ${daysUntil(profile.rideTargetDate)} days`
                        : 'Pin a target date to enable periodization.'}
                    </Text>
                    <PillButton
                      label={profile.rideTargetDate ? 'Change' : 'Set date'}
                      onPress={() => setPicking(true)}
                    />
                  </View>
                )}
              </Card>
            </Pressable>
          );
        })}
        <Text
          style={{
            fontFamily: fonts.serifRegItalic,
            fontSize: 13,
            color: colors.muted,
            textAlign: 'center',
            lineHeight: 20,
            marginTop: 4,
            marginHorizontal: 16,
          }}
        >
          Targets, framing, and recommendations all shift to match the active goal.
        </Text>
      </ScrollView>
      {picking && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          value={profile.rideTargetDate ? new Date(profile.rideTargetDate) : eightWeeksOut()}
          minimumDate={new Date()}
          onChange={onPickDate}
        />
      )}
      {Platform.OS === 'ios' && picking && (
        <View style={{ padding: 12, alignItems: 'center', backgroundColor: colors.surface, borderTopWidth: 0.5, borderTopColor: colors.line }}>
          <PillButton label="Done" kind="ink" onPress={() => setPicking(false)} />
        </View>
      )}
    </View>
  );
}

function eightWeeksOut() {
  const d = new Date();
  d.setDate(d.getDate() + 56);
  return d;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 86_400_000));
}
