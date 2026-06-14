import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { TopBar } from '../../components/TopBar';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { useData } from '../../data/DataContext';
import { activeTrackingPlan, mergedChecklist, trackingPlanFor } from '../../data/trackingPlans';
import type { ChecklistItem } from '../../data/trackingPlans';
import type { LogEntry } from '../../data/types';

// Workouts tab — what's planned for the week (from the active goals'
// TrackingPlan checklists, merged) and what's actually been logged (log
// entries of kind 'workout'). Planned sessions come straight from "config
// as data"; rows with extra detail expand.
export function WorkoutsScreen() {
  const { profile, log } = useData();
  const plan = profile ? activeTrackingPlan(profile) : trackingPlanFor('muscle');
  const planned: ChecklistItem[] = profile ? mergedChecklist(profile) : trackingPlanFor('muscle').checklist;

  const workouts = useMemo(
    () =>
      log
        .filter(e => e.kind === 'workout')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [log],
  );

  const thisWeek = useMemo(() => workouts.filter(w => withinThisWeek(w.createdAt)), [workouts]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Workouts" sub={plan.name.toLowerCase()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Planned this week — merged across the selected goals' checklists */}
        {planned.length > 0 && (
          <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
            <Label style={{ marginBottom: 8, paddingLeft: 4 }}>
              Planned this week · {Math.min(thisWeek.length, planned.length)}/{planned.length} done
            </Label>
            <Card raised style={{ overflow: 'hidden' }}>
              {planned.map((item, i) => (
                <PlannedRow
                  key={item.label}
                  item={item}
                  done={i < thisWeek.length}
                  last={i === planned.length - 1}
                />
              ))}
            </Card>
            <Text
              style={{
                marginTop: 8,
                paddingLeft: 4,
                fontFamily: fonts.serifRegItalic,
                fontSize: 12.5,
                color: colors.muted,
              }}
            >
              Intentions for the week, not a rigid schedule — windows flex.
            </Text>
          </View>
        )}

        {/* Logged workouts */}
        <View style={{ paddingTop: 18, paddingHorizontal: 16 }}>
          <Label style={{ marginBottom: 8, paddingLeft: 4 }}>Logged</Label>
          <Card raised style={{ overflow: 'hidden' }}>
            {workouts.length === 0 ? (
              <View style={{ padding: 18 }}>
                <Text style={{ fontFamily: fonts.serif, fontSize: 15, color: colors.ink }}>
                  No workouts logged yet.
                </Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 4 }}>
                  Tell the coach "did an upper lift, 45 minutes" and it'll land here.
                </Text>
              </View>
            ) : (
              workouts.map((w, i, arr) => <WorkoutRow key={w.id} entry={w} last={i === arr.length - 1} />)
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function PlannedRow({ item, done, last }: { item: ChecklistItem; done: boolean; last: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!item.detail;
  return (
    <View style={{ borderBottomWidth: last ? 0 : 0.5, borderBottomColor: colors.line }}>
      <Pressable
        onPress={() => hasDetail && setOpen(o => !o)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 13,
          paddingHorizontal: 14,
          backgroundColor: pressed && hasDetail ? colors.surfaceAlt : 'transparent',
        })}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: done ? colors.accent : colors.lineStrong,
          }}
        />
        <Text style={{ flex: 1, fontFamily: fonts.serif, fontSize: 15, color: colors.ink }}>{item.label}</Text>
        {hasDetail && (
          <Svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.muted}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
          </Svg>
        )}
      </Pressable>
      {open && hasDetail && (
        <View style={{ paddingLeft: 34, paddingRight: 14, paddingBottom: 13, marginTop: -2 }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.body, lineHeight: 19 }}>
            {item.detail}
          </Text>
        </View>
      )}
    </View>
  );
}

function WorkoutRow({ entry, last }: { entry: LogEntry; last: boolean }) {
  const meta = [
    entry.workout?.type,
    entry.workout?.durationMin ? `${entry.workout.durationMin} min` : null,
    entry.workout?.rpe ? `RPE ${entry.workout.rpe}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: colors.accentAlt, marginTop: 6 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 15, color: colors.ink }}>{entry.title}</Text>
        {!!meta && (
          <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 }}>{meta}</Text>
        )}
      </View>
      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>{shortDate(entry.createdAt)}</Text>
    </View>
  );
}

function withinThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const monday = new Date(now);
  const day = (now.getDay() + 6) % 7; // 0 = Monday
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return d >= monday;
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
