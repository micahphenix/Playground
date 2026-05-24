import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { v4 as uuid } from 'uuid';
import { colors, fonts, radii } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { Chip } from '../../components/Chip';
import { useData } from '../../data/DataContext';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Limitation } from '../../data/types';

export function ProfileUpdateModal() {
  const nav = useNavigation();
  const { rawInput, proposals } = useRoute<RouteProp<RootStackParamList, 'ProfileUpdate'>>().params;
  const { profile, updateProfile } = useData();
  const [busy, setBusy] = useState(false);

  if (!profile) return null;

  async function accept(all: boolean) {
    setBusy(true);
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 14);
    const next: Limitation[] = [...profile!.limitations];
    for (const p of proposals) {
      if (!all && p.kind !== 'limitation') continue;
      if (p.kind !== 'limitation') continue;
      next.push({
        id: uuid(),
        label: p.label,
        note: p.note,
        addedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      });
    }
    await updateProfile({ limitations: next });
    setBusy(false);
    nav.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Update your profile?" sub="one-tap confirmation" onClose={nav.goBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Card style={{ padding: 16 }}>
          <Label>You said</Label>
          <Text
            style={{
              fontFamily: fonts.serifRegItalic,
              fontStyle: 'italic',
              fontSize: 17,
              color: colors.ink,
              marginTop: 8,
              lineHeight: 25,
            }}
          >
            "{rawInput}"
          </Text>
        </Card>

        <Label style={{ marginTop: 16, marginBottom: 8, paddingLeft: 4 }}>
          {proposals.length > 1 ? `${spell(proposals.length)} things I'd add` : "One thing I'd add"}
        </Label>
        <View style={{ gap: 10 }}>
          {proposals.map((p, i) => (
            <Card
              key={i}
              accentEdge={p.kind === 'limitation' ? 'accent' : 'accentAlt'}
              style={{ padding: 14 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Chip tone={p.kind === 'limitation' ? 'accent' : 'good'}>
                  {p.kind === 'limitation' ? '+ Add' : '↻ Set'}
                </Chip>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 10.5,
                    color: colors.muted,
                    marginLeft: 'auto',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {p.kind === 'limitation' ? 'limitations' : "this week's plan"}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.serifBold, fontSize: 16, color: colors.ink, marginTop: 8 }}>
                {p.label}
              </Text>
              {p.note && (
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 19 }}>
                  {p.note}
                </Text>
              )}
              {p.kind === 'limitation' && (
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 19 }}>
                  Auto-expires in 14 days unless updated. The coach will flag it if it shows up again.
                </Text>
              )}
            </Card>
          ))}
        </View>

        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: colors.accentSoft,
            borderRadius: radii.card,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.serifRegItalic,
              fontSize: 13,
              color: colors.accent,
              lineHeight: 20,
              fontStyle: 'italic',
            }}
          >
            Memory only changes when you say so. Edit anything later in Memory → Facts.
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          padding: 16,
          backgroundColor: colors.bg,
          borderTopWidth: 0.5,
          borderTopColor: colors.line,
          gap: 8,
        }}
      >
        <Pressable
          onPress={() => accept(true)}
          disabled={busy}
          style={({ pressed }) => ({
            backgroundColor: colors.ink,
            borderRadius: radii.pill,
            paddingVertical: 15,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
            opacity: busy ? 0.5 : 1,
          })}
        >
          <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 15 }}>
            {busy ? 'Saving…' : 'Yes — save'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => nav.goBack()}
          style={({ pressed }) => ({
            backgroundColor: 'transparent',
            borderRadius: radii.pill,
            paddingVertical: 13,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: colors.lineStrong,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: colors.body, fontFamily: fonts.sansMed, fontSize: 13.5 }}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function spell(n: number) {
  return n === 2 ? 'Two' : n === 3 ? 'Three' : n === 4 ? 'Four' : String(n);
}
