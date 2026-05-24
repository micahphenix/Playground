import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, fonts, radii } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { CoachMark } from '../../components/CoachMark';
import { PillButton } from '../../components/PillButton';
import { useData } from '../../data/DataContext';
import { AccentText } from '../../components/AccentText';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export function PatternDetailModal() {
  const nav = useNavigation();
  const { pattern } = useRoute<RouteProp<RootStackParamList, 'PatternDetail'>>().params;
  const { upsertPattern } = useData();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="Pattern flagged" sub={pattern.topic} onClose={nav.goBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Card accentEdge={pattern.tone} style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CoachMark size={22} />
            <Label>I'm noticing something</Label>
          </View>
          <AccentText
            accentColor={colors[pattern.tone]}
            style={{
              fontFamily: fonts.serif,
              fontSize: 17,
              color: colors.ink,
              lineHeight: 25,
            }}
          >
            {`That ${pattern.topic.split('·')[0].trim().toLowerCase()} has come up — {{em:${pattern.summary}}}.`}
          </AccentText>

          {pattern.mentions.length > 0 && (
            <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.bg, borderRadius: radii.sm }}>
              <Label style={{ marginBottom: 8 }}>Mentions</Label>
              <View style={{ gap: 6 }}>
                {pattern.mentions.map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.muted, width: 56 }}>
                      {m.at}
                    </Text>
                    <Text style={{ fontFamily: fonts.serifRegItalic, fontStyle: 'italic', color: colors.body, fontSize: 12, flex: 1 }}>
                      "{m.context}"
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            <PillButton
              label="Add to profile"
              kind="primary"
              onPress={async () => {
                await upsertPattern({ ...pattern, status: 'watch' });
                nav.goBack();
              }}
            />
            <PillButton
              label="Tell me more"
              kind="alt"
              onPress={() => nav.goBack()}
            />
            <PillButton
              label="Not a pattern"
              kind="ghost"
              onPress={async () => {
                await upsertPattern({ ...pattern, status: 'resolved' });
                nav.goBack();
              }}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
