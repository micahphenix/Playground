import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuid } from 'uuid';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { ConfirmFooter } from '../../components/ConfirmFooter';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { Chip } from '../../components/Chip';
import { useData } from '../../data/DataContext';
import type { ParsedEntry } from '../../ai/coach';
import type { LogEntry, MemoryItem } from '../../data/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export function VoiceConfirmModal() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = useRoute<RouteProp<RootStackParamList, 'VoiceConfirm'>>().params;
  const { addLog, addMemory } = useData();
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const now = new Date().toISOString();
    for (const e of params.entries) {
      const entry: LogEntry = {
        id: uuid(),
        kind: e.kind,
        title: e.title,
        detail: e.detail,
        macros: e.macros,
        workout: e.workout,
        recovery: e.recovery,
        source: params.durationSec > 0 ? 'voice' : 'text',
        rawInput: params.transcript,
        createdAt: now,
      };
      await addLog(entry);
      if (e.proposedLimitation) {
        const mem: MemoryItem = {
          id: uuid(),
          kind: 'fact',
          headline: `Limitation: ${e.proposedLimitation.label}`,
          detail: e.proposedLimitation.note,
          createdAt: now,
        };
        await addMemory(mem);
      }
    }
    setSaving(false);
    const proposals = params.entries
      .filter(e => e.proposedLimitation)
      .map(e => ({
        kind: 'limitation' as const,
        label: e.proposedLimitation!.label,
        note: e.proposedLimitation!.note,
      }));
    if (proposals.length) {
      nav.replace('ProfileUpdate', { rawInput: params.transcript, proposals });
    } else {
      nav.goBack();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader
        title="Confirm"
        sub={params.durationSec > 0 ? `from voice · 0:${String(params.durationSec).padStart(2, '0')} long` : 'from text'}
        onClose={nav.goBack}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Card style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Label>You said</Label>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 1.5, height: 18 }}>
              {Array.from({ length: 32 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 2,
                    height: 4 + Math.abs(Math.sin(i * 0.7)) * 14,
                    backgroundColor: colors.accent,
                    opacity: 0.6,
                    borderRadius: 1,
                  }}
                />
              ))}
            </View>
            {params.durationSec > 0 && (
              <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.muted }}>
                0:{String(params.durationSec).padStart(2, '0')}
              </Text>
            )}
          </View>
          <Text
            style={{
              fontFamily: fonts.serifRegItalic,
              fontStyle: 'italic',
              fontSize: 17,
              color: colors.ink,
              lineHeight: 25,
              marginTop: 12,
            }}
          >
            "{params.transcript}"
          </Text>
        </Card>

        <Label style={{ marginTop: 16, marginBottom: 8, paddingLeft: 4 }}>
          {params.entries.length === 1 ? "I'd save this" : `I'd save ${spell(params.entries.length)} things`}
        </Label>
        <View style={{ gap: 10 }}>
          {params.entries.length === 0 && (
            <Card style={{ padding: 16 }}>
              <Text style={{ fontFamily: fonts.serifRegItalic, color: colors.muted }}>
                Nothing concrete to log here — I'll keep it as context.
              </Text>
            </Card>
          )}
          {params.entries.map((e, i) => (
            <EntryCard key={i} e={e} />
          ))}
        </View>
      </ScrollView>
      <ConfirmFooter
        primary={params.entries.length === 0 ? 'Got it' : params.entries.length === 1 ? 'Save it' : 'Save all'}
        secondary="Edit before saving"
        onPrimary={save}
        onSecondary={() => nav.goBack()}
        primaryLoading={saving}
      />
    </View>
  );
}

function EntryCard({ e }: { e: ParsedEntry }) {
  const iconBg = e.kind === 'recovery' ? colors.accentAltSoft : e.kind === 'workout' ? colors.accentAltSoft : colors.accentSoft;
  const iconStroke = e.kind === 'recovery' ? colors.accentAlt : e.kind === 'workout' ? colors.accentAlt : colors.accent;
  const tone = e.kind === 'recovery' ? 'good' : e.kind === 'workout' ? 'accentAlt' : 'accent';
  return (
    <Card style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth={2}>
            <Path d="M5 8h14M5 12h14M5 16h10" />
          </Svg>
        </View>
        <Chip tone={tone}>{labelFor(e.kind)}</Chip>
        {e.workout && (
          <Text style={{ fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, marginLeft: 'auto' }}>
            {e.workout.durationMin}m
          </Text>
        )}
      </View>
      <Text style={{ fontFamily: fonts.serifBold, fontSize: 16, color: colors.ink, marginTop: 8 }}>{e.title}</Text>
      {e.macros && <MacroTable macros={e.macros} />}
      {e.detail && (
        <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 8, fontStyle: 'italic' }}>
          {e.detail}
        </Text>
      )}
      {e.proposedLimitation && (
        <View
          style={{ marginTop: 10, padding: 10, backgroundColor: colors.bg, borderRadius: 8, borderWidth: 0.5, borderColor: colors.line }}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: colors.warn, letterSpacing: 0.8 }}>
            COACH WILL ASK NEXT
          </Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 13.5, color: colors.body, marginTop: 4 }}>
            Add "{e.proposedLimitation.label}" to your limitations?
          </Text>
        </View>
      )}
    </Card>
  );
}

function MacroTable({ macros }: { macros: NonNullable<LogEntry['macros']> }) {
  const rows: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Calories', value: `${macros.kcal} kcal` },
    { label: 'Protein', value: `${macros.protein_g} g`, highlight: true },
    { label: 'Carbs', value: `${macros.carb_g} g` },
    { label: 'Fat', value: `${macros.fat_g} g` },
  ];
  return (
    <View
      style={{
        marginTop: 10,
        borderWidth: 0.5,
        borderColor: colors.line,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderBottomWidth: i < rows.length - 1 ? 0.5 : 0,
            borderBottomColor: colors.line,
            backgroundColor: r.highlight ? colors.accentSoft : colors.surface,
          }}
        >
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.body }}>{r.label}</Text>
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 13.5,
              color: r.highlight ? colors.accent : colors.ink,
            }}
          >
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function labelFor(k: ParsedEntry['kind']): string {
  switch (k) {
    case 'meal':
      return 'Meal';
    case 'workout':
      return 'Workout';
    case 'recovery':
      return 'Recovery';
    default:
      return 'Note';
  }
}

function spell(n: number) {
  return n === 2 ? 'two' : n === 3 ? 'three' : n === 4 ? 'four' : String(n);
}
