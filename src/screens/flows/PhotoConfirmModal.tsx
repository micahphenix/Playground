import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { v4 as uuid } from 'uuid';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { ConfirmFooter } from '../../components/ConfirmFooter';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { Chip } from '../../components/Chip';
import { PhotoStripe } from '../../components/PhotoStripe';
import { useData } from '../../data/DataContext';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type EditableField = 'kcal' | 'protein_g' | 'carb_g' | 'fat_g';

export function PhotoConfirmModal() {
  const nav = useNavigation();
  const { photoUri, analysis } = useRoute<RouteProp<RootStackParamList, 'PhotoConfirm'>>().params;
  const { addLog } = useData();
  const [title, setTitle] = useState(analysis.title);
  const [total, setTotal] = useState(analysis.total);
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [saving, setSaving] = useState(false);

  const confidencePct = Math.round((analysis.confidence ?? 0) * 100);
  const confTone = confidencePct >= 80 ? 'good' : confidencePct >= 60 ? 'warn' : 'warn';

  async function save() {
    setSaving(true);
    await addLog({
      id: uuid(),
      kind: 'meal',
      title,
      detail: analysis.description,
      macros: total,
      items: analysis.items,
      source: 'photo',
      photoUri,
      confidence: analysis.confidence,
      createdAt: new Date().toISOString(),
    });
    setSaving(false);
    nav.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Confirm meal" sub={`from photo · ${now()}`} onClose={nav.goBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
        <Card style={{ padding: 6, overflow: 'hidden' }}>
          <PhotoStripe uri={photoUri} height={180} />
        </Card>

        <Card style={{ padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Label>I'm reading it as</Label>
            <View style={{ flex: 1 }} />
            <Chip tone={confTone}>{confidencePct}% sure</Chip>
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={{
              fontFamily: fonts.serif,
              fontSize: 17,
              color: colors.ink,
              marginTop: 8,
              padding: 0,
            }}
          />
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              color: colors.muted,
              marginTop: 6,
              lineHeight: 19,
              fontStyle: 'italic',
            }}
          >
            {analysis.description}
          </Text>
        </Card>

        <Card style={{ marginTop: 12, overflow: 'hidden' }}>
          {(['kcal', 'protein_g', 'carb_g', 'fat_g'] as const).map((k, i, arr) => (
            <MacroRow
              key={k}
              field={k}
              value={total[k]}
              max={k === 'kcal' ? 2600 : 200}
              last={i === arr.length - 1}
              editing={editing === k}
              onEditStart={() => setEditing(k)}
              onChange={n => setTotal(t => ({ ...t, [k]: n }))}
              onCommit={() => setEditing(null)}
            />
          ))}
        </Card>

        <Text
          style={{
            fontFamily: fonts.serifRegItalic,
            fontStyle: 'italic',
            fontSize: 13.5,
            color: colors.muted,
            marginTop: 14,
            paddingLeft: 4,
          }}
        >
          Estimates. Tap any value to adjust before saving.
        </Text>

        {analysis.items.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Label style={{ marginBottom: 8, paddingLeft: 4 }}>Items</Label>
            <Card style={{ overflow: 'hidden' }}>
              {analysis.items.map((it, i, arr) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    padding: 12,
                    alignItems: 'center',
                    gap: 8,
                    borderBottomWidth: i < arr.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.line,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serif, fontSize: 14, color: colors.ink }}>{it.name}</Text>
                    {it.qty && <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 }}>{it.qty}</Text>}
                  </View>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.body }}>
                    {it.kcal} · {it.protein_g}g P
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
      <ConfirmFooter
        primary="Save to log"
        secondary="Reject / Adjust — tell me where I'm off"
        onPrimary={save}
        onSecondary={() => nav.goBack()}
        primaryLoading={saving}
      />
    </View>
  );
}

function MacroRow({
  field,
  value,
  last,
  editing,
  onEditStart,
  onChange,
  onCommit,
}: {
  field: EditableField;
  value: number;
  max: number;
  last: boolean;
  editing: boolean;
  onEditStart: () => void;
  onChange: (n: number) => void;
  onCommit: () => void;
}) {
  const labelMap: Record<EditableField, { name: string; unit: string; highlight: boolean }> = {
    kcal: { name: 'Calories', unit: 'kcal', highlight: false },
    protein_g: { name: 'Protein', unit: 'g', highlight: true },
    carb_g: { name: 'Carbs', unit: 'g', highlight: false },
    fat_g: { name: 'Fat', unit: 'g', highlight: false },
  };
  const meta = labelMap[field];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 15.5, color: colors.ink, fontWeight: meta.highlight ? '600' : '500' }}>
          {meta.name}
        </Text>
      </View>
      <Pressable
        onPress={onEditStart}
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: 4,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 6,
          backgroundColor: meta.highlight ? colors.accentSoft : 'transparent',
        }}
      >
        {editing ? (
          <TextInput
            autoFocus
            keyboardType="number-pad"
            value={String(value)}
            onChangeText={t => onChange(Number(t.replace(/[^\d]/g, '')) || 0)}
            onBlur={onCommit}
            style={{
              fontFamily: fonts.serifBold,
              fontSize: 20,
              color: meta.highlight ? colors.accent : colors.ink,
              minWidth: 50,
              textAlign: 'right',
              padding: 0,
            }}
          />
        ) : (
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: meta.highlight ? colors.accent : colors.ink }}>
            {value}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>{meta.unit}</Text>
      </Pressable>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radii.pill,
          backgroundColor: colors.bg,
          borderWidth: 0.5,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
          <Path d="M15 4l5 5L9 20H4v-5z" />
        </Svg>
      </View>
    </View>
  );
}

function now() {
  return new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
