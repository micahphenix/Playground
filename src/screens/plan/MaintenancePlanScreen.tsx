// ─────────────────────────────────────────────────────────────────────────────
// Maintenance Plan (Plan tab) — Sprint 2 redesign
// Year-at-a-glance calendar. Reads from the static seed plan for v1.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { MainTabParamList } from '../../types/lawn';
import { COLORS, RADII, SPACING, TYPE, ACCENT_FONT } from '../../design/tokens';
import { AppHeader, Card, CategoryTag, Eyebrow, Heading } from '../../design/components';
import { Sigil } from '../../design/Sigil';
import { CATEGORY } from '../../design/tokens';
import { MONTHS, MonthKey, SEED_PLAN } from '../../data/seed';

type Props = BottomTabScreenProps<MainTabParamList, 'MaintenancePlan'>;

const MONTH_PILL_W = 64; // approximate — used to center selected month

export default function MaintenancePlanScreen({}: Props) {
  const [month, setMonth] = useState<MonthKey>(MONTHS[new Date().getMonth()]);
  const scrollRef = useRef<ScrollView>(null);

  // Scroll the selected pill into horizontal center.
  useEffect(() => {
    const idx = MONTHS.indexOf(month);
    const x = Math.max(0, idx * MONTH_PILL_W - 120);
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [month]);

  const tasks = SEED_PLAN[month] ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <AppHeader
        eyebrow="MAINTENANCE PLAN"
        title={
          <Heading level={1} italic>
            <Text style={{ opacity: 0.6 }}>Year of</Text> care
          </Heading>
        }
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }}
        contentContainerStyle={styles.monthRow}
      >
        {MONTHS.map((m) => {
          const active = m === month;
          const hasTask = SEED_PLAN[m].length > 0;
          return (
            <Pressable
              key={m}
              onPress={() => setMonth(m)}
              style={[styles.monthPill, active && styles.monthPillActive]}
            >
              <Text style={[styles.monthLabel, active && styles.monthLabelActive]}>{m}</Text>
              {hasTask && !active && <View style={styles.monthDot} />}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.appX, paddingTop: 18, paddingBottom: 120 }}
      >
        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <Sigil size={48} />
            <Heading level={3} italic>Your lawn gets a break this month.</Heading>
            <Text style={styles.emptySub}>No tasks scheduled for {month}. Enjoy the quiet.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {tasks.map((task) => (
              <Card key={task.id} padding={16}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[styles.catStripe, { backgroundColor: CATEGORY[task.cat].color }]} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <CategoryTag cat={task.cat} />
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDetail}>{task.detail}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 4,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  monthPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    flexShrink: 0,
  },
  monthPillActive: {
    backgroundColor: COLORS.deepGreen,
  },
  monthLabel: {
    ...ACCENT_FONT,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.78,
    textTransform: 'uppercase',
    color: COLORS.deepGreen,
    opacity: 0.65,
  },
  monthLabelActive: {
    color: COLORS.cream,
    opacity: 1,
  },
  monthDot: {
    position: 'absolute',
    top: 4, right: 6,
    width: 5, height: 5, borderRadius: 5,
    backgroundColor: COLORS.amber,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 14,
  },
  emptySub: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: 'center',
    maxWidth: 240,
  },

  catStripe: {
    width: 4,
    alignSelf: 'stretch',
    minHeight: 38,
    borderRadius: 4,
  },
  taskTitle: {
    ...TYPE.headingSM,
    marginTop: 8,
  },
  taskDetail: {
    ...TYPE.bodySoft,
    marginTop: 4,
  },
});
