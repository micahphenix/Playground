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
import type { GoalId } from '../../data/types';

const GOALS: {
  id: GoalId;
  name: string;
  detail: string;
  quote: string;
  color: string;
  dateNeeded?: boolean;
}[] = [
  {
    id: 'muscle',
    name: 'Build muscle',
    detail: 'High protein · slow lift progression · cycling kept honest',
    quote: 'You are building. Eat enough to grow, sleep enough to repair, lift enough to provoke.',
    color: colors.accent,
  },
  {
    id: 'ride',
    name: '50-mile ride',
    detail: 'Periodized cycling · taper · lift maintenance',
    quote: 'You are building distance. Long rides earn their place; recovery is part of the work.',
    color: colors.accentAlt,
    dateNeeded: true,
  },
  {
    id: 'recover',
    name: 'Recover well',
    detail: 'Lighter load · sleep priority · protein floor',
    quote: 'You are mending. The body sets the pace; your job is to listen and feed it.',
    color: colors.muted,
  },
];

export function GoalSwitcherModal() {
  const nav = useNavigation();
  const { profile, updateProfile } = useData();
  const [picking, setPicking] = useState(false);
  if (!profile) return null;

  async function onPickDate(_: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setPicking(false);
    if (!date) return;
    await updateProfile({ rideTargetDate: date.toISOString().slice(0, 10) });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Active goal" sub="what guides this season" onClose={nav.goBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
        {GOALS.map(g => {
          const active = profile.activeGoal === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={async () => {
                await updateProfile({ activeGoal: g.id });
              }}
            >
              <Card
                style={{
                  padding: 16,
                  borderColor: active ? g.color : colors.line,
                  borderWidth: active ? 1.5 : 0.5,
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
                  {active && <Chip tone="accent">Active</Chip>}
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
