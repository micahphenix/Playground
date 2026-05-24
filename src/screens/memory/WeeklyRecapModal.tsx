import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, fonts } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export function WeeklyRecapModal() {
  const { recap } = useRoute<RouteProp<RootStackParamList, 'WeeklyRecap'>>().params;
  const nav = useNavigation();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title={`Week of ${pretty(recap.weekStart)}`} sub="weekly recap" onClose={nav.goBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Text
          style={{
            fontFamily: fonts.serifRegItalic,
            fontStyle: 'italic',
            fontSize: 19,
            color: colors.ink,
            lineHeight: 28,
            letterSpacing: -0.3,
          }}
        >
          {recap.headline}
        </Text>

        <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {recap.stats.map((s, i) => (
            <Card key={i} style={{ padding: 14, flexBasis: '48%', flexGrow: 1 }}>
              <Label>{s.label}</Label>
              <Text style={{ fontFamily: fonts.serifBold, fontSize: 28, color: colors.ink, marginTop: 4, letterSpacing: -0.5 }}>
                {s.value}
              </Text>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors[s.tone], marginTop: 4 }}>
                {s.sub}
              </Text>
            </Card>
          ))}
        </View>

        <BulletGroup title="What worked" items={recap.whatWorked} dot={colors.good} />
        <BulletGroup title="What was hard" items={recap.whatWasHard} dot={colors.warn} />

        <Card style={{ padding: 16, marginTop: 18, backgroundColor: colors.accentSoft }}>
          <Label>Next week focus</Label>
          <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.ink, lineHeight: 24, marginTop: 6 }}>
            {recap.nextFocus}
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

function BulletGroup({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Label style={{ marginBottom: 10, paddingLeft: 4 }}>{title}</Label>
      <Card style={{ padding: 14 }}>
        {items.map((x, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 5 }}>
            <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: dot, marginTop: 7 }} />
            <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: colors.body, lineHeight: 20 }}>
              {x}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function pretty(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}
