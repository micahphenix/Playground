import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { v4 as uuid } from 'uuid';
import { colors, fonts, radii } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { ConfirmFooter } from '../../components/ConfirmFooter';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { useData } from '../../data/DataContext';
import type { LogEntry, MemoryItem } from '../../data/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';

// Two related quick-entry flows the suggested-next-steps in the handoff flagged
// as pre-Garmin essentials: manual recovery inputs (sleep, soreness, mood) and
// an InBody scan entry (weight, body fat %, skeletal muscle mass).

export function QuickEntryModal() {
  const nav = useNavigation();
  const { kind } = useRoute<RouteProp<RootStackParamList, 'QuickEntry'>>().params;
  const { addLog, addMemory } = useData();

  const [sleep, setSleep] = useState('');
  const [soreness, setSoreness] = useState('');
  const [mood, setMood] = useState('');

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [scanDate, setScanDate] = useState(new Date().toISOString().slice(0, 10));

  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const now = new Date().toISOString();
    if (kind === 'recovery') {
      const entry: LogEntry = {
        id: uuid(),
        kind: 'recovery',
        title: buildRecoveryTitle({ sleep, soreness, mood }),
        recovery: {
          sleepHrs: sleep ? Number(sleep) : undefined,
          soreness: soreness || undefined,
          mood: mood || undefined,
        },
        source: 'quick',
        createdAt: now,
      };
      await addLog(entry);
    } else if (kind === 'weight') {
      // The daily habit: one number, one tap. This is what feeds the rolling
      // maintenance calculation, so it has to be faster than opening a scan.
      const lb = Number(weight);
      const entry: LogEntry = {
        id: uuid(),
        kind: 'weigh-in',
        title: `${lb} lb`,
        body: { weightLb: lb },
        source: 'quick',
        createdAt: now,
      };
      await addLog(entry);
    } else {
      // A scan is a weigh-in that also knows its composition — same kind, same
      // path. Stored as NUMBERS: the body model trends these, and the display
      // string this used to write could never be trended.
      const entry: LogEntry = {
        id: uuid(),
        kind: 'weigh-in',
        title: `InBody scan · ${scanDate}`,
        detail: `Weight ${weight || '—'} lb · ${bodyFat || '—'}% BF · ${muscle || '—'} lb SMM`,
        body: {
          weightLb: weight ? Number(weight) : undefined,
          bodyFatPct: bodyFat ? Number(bodyFat) : undefined,
          leanLb: muscle ? Number(muscle) : undefined,
          scan: 'inbody',
        },
        source: 'quick',
        createdAt: scanDateToIso(scanDate, now),
      };
      await addLog(entry);
      // Keep the human-readable row in Memory too — scans are exactly the kind
      // of milestone the Memory tab is for, and Micah already looks for them there.
      const item: MemoryItem = {
        id: uuid(),
        kind: 'fact',
        headline: `InBody · ${scanDate}`,
        detail: `Weight ${weight || '—'} lb · ${bodyFat || '—'}% BF · ${muscle || '—'} lb SMM`,
        createdAt: now,
      };
      await addMemory(item);
    }
    setSaving(false);
    nav.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader
        title={kind === 'recovery' ? 'Recovery check-in' : kind === 'weight' ? 'Morning weigh-in' : 'InBody scan'}
        sub={
          kind === 'recovery'
            ? 'pre-Garmin · manual'
            : kind === 'weight'
              ? 'one number · same time daily'
              : 'composition entry'
        }
        onClose={nav.goBack}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
        {kind === 'weight' ? (
          <View style={{ gap: 12 }}>
            <Card style={{ padding: 14 }}>
              <Label>Weight this morning</Label>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, gap: 6 }}>
                <NumericField value={weight} onChange={setWeight} placeholder="190" />
                <Text style={{ fontFamily: fonts.mono, color: colors.muted, fontSize: 13 }}>lb</Text>
              </View>
            </Card>
            <Text style={{ fontFamily: fonts.serifRegItalic, fontSize: 13, color: colors.muted, padding: 4 }}>
              Same time, same conditions — first thing, after the bathroom, before food. Day-to-day
              water swings don't matter; the coach reads the weekly average, not any single morning.
            </Text>
          </View>
        ) : kind === 'recovery' ? (
          <View style={{ gap: 12 }}>
            <Card style={{ padding: 14 }}>
              <Label>Sleep last night</Label>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, gap: 6 }}>
                <NumericField value={sleep} onChange={setSleep} placeholder="6.5" />
                <Text style={{ fontFamily: fonts.mono, color: colors.muted, fontSize: 13 }}>hrs</Text>
              </View>
            </Card>
            <Card style={{ padding: 14 }}>
              <Label>Soreness or aches</Label>
              <TextInput
                value={soreness}
                onChangeText={setSoreness}
                placeholder="e.g. knee — light grumble; calf — fine"
                placeholderTextColor={colors.muted}
                multiline
                style={multilineStyle}
              />
            </Card>
            <Card style={{ padding: 14 }}>
              <Label>Mood / readiness</Label>
              <TextInput
                value={mood}
                onChangeText={setMood}
                placeholder="ready / flat / restless / off"
                placeholderTextColor={colors.muted}
                style={singleLineStyle}
              />
            </Card>
            <Text style={{ fontFamily: fonts.serifRegItalic, fontSize: 13, color: colors.muted, padding: 4 }}>
              Goes into today's recovery notes — the coach reads it before the next briefing.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Card style={{ padding: 14 }}>
              <Label>Weight</Label>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, gap: 6 }}>
                <NumericField value={weight} onChange={setWeight} placeholder="180" />
                <Text style={{ fontFamily: fonts.mono, color: colors.muted, fontSize: 13 }}>lb</Text>
              </View>
            </Card>
            <Card style={{ padding: 14 }}>
              <Label>Body fat</Label>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, gap: 6 }}>
                <NumericField value={bodyFat} onChange={setBodyFat} placeholder="18.5" />
                <Text style={{ fontFamily: fonts.mono, color: colors.muted, fontSize: 13 }}>%</Text>
              </View>
            </Card>
            <Card style={{ padding: 14 }}>
              <Label>Skeletal muscle mass</Label>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, gap: 6 }}>
                <NumericField value={muscle} onChange={setMuscle} placeholder="82" />
                <Text style={{ fontFamily: fonts.mono, color: colors.muted, fontSize: 13 }}>lb</Text>
              </View>
            </Card>
            <Card style={{ padding: 14 }}>
              <Label>Scan date</Label>
              <TextInput
                value={scanDate}
                onChangeText={setScanDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                style={singleLineStyle}
              />
            </Card>
          </View>
        )}
      </ScrollView>
      <ConfirmFooter
        primary="Save"
        secondary="Cancel"
        onPrimary={save}
        onSecondary={() => nav.goBack()}
        primaryLoading={saving}
        primaryDisabled={
          kind === 'recovery'
            ? !sleep && !soreness && !mood
            : kind === 'weight'
              ? !Number(weight)
              : !weight && !bodyFat && !muscle
        }
      />
    </View>
  );
}

// A scan can be backdated through the date field. Date the entry to the scan
// itself, not to when it was typed in, or the model anchors it on the wrong
// day. Noon UTC keeps the date stable when it's sliced back out.
function scanDateToIso(scanDate: string, fallbackIso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(scanDate) ? `${scanDate}T12:00:00.000Z` : fallbackIso;
}

function NumericField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={t => onChange(t.replace(/[^\d.]/g, ''))}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType="decimal-pad"
      style={{
        fontFamily: fonts.serifBold,
        fontSize: 28,
        color: colors.ink,
        letterSpacing: -0.5,
        minWidth: 70,
        padding: 0,
      }}
    />
  );
}

function buildRecoveryTitle({ sleep, soreness, mood }: { sleep: string; soreness: string; mood: string }): string {
  const parts: string[] = [];
  if (sleep) parts.push(`${sleep}h sleep`);
  if (mood) parts.push(mood);
  if (soreness) parts.push('aches noted');
  return parts.join(' · ') || 'Recovery check-in';
}

const singleLineStyle = {
  marginTop: 8,
  padding: 12,
  backgroundColor: colors.bg,
  borderRadius: radii.sm,
  borderWidth: 0.5,
  borderColor: colors.line,
  fontFamily: fonts.serif,
  fontSize: 15,
  color: colors.ink,
} as const;

const multilineStyle = {
  ...singleLineStyle,
  minHeight: 72,
  textAlignVertical: 'top' as const,
};

