import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  if (!profile) return null;

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
                if (g.dateNeeded && !profile.rideTargetDate) {
                  Alert.alert(
                    'Pin a date',
                    'Set a target date for the 50-mile ride so the coach can periodize the build.',
                    [{ text: 'Later', style: 'cancel' }, { text: 'Set in 8 weeks', onPress: () => setEightWeeks() }],
                  );
                }
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
                {g.dateNeeded && !profile.rideTargetDate && (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 11,
                      backgroundColor: colors.bg,
                      borderRadius: radii.sm,
                      borderWidth: 0.5,
                      borderColor: colors.lineStrong,
                      borderStyle: 'dashed',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.warn} strokeWidth={2}>
                      <Circle cx={12} cy={12} r={9} />
                      <Path d="M12 8v4M12 16h0" />
                    </Svg>
                    <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.warn }}>
                      Pin a target date to enable periodization.
                    </Text>
                    <PillButton label="Set date" onPress={setEightWeeks} />
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
    </View>
  );

  async function setEightWeeks() {
    const d = new Date();
    d.setDate(d.getDate() + 56);
    await updateProfile({ rideTargetDate: d.toISOString().slice(0, 10) });
  }
}
