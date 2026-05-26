import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuid } from 'uuid';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { TopBar } from '../../components/TopBar';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { PillButton } from '../../components/PillButton';
import { useData } from '../../data/DataContext';
import { detectPatterns, hasApiKey } from '../../ai/coach';
import type { PatternFlag, WeeklyRecap } from '../../data/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MemoryScreen() {
  const nav = useNavigation<Nav>();
  const { memory, patterns, recaps, profile, log, upsertPattern } = useData();
  const [scanning, setScanning] = useState(false);

  async function runScan() {
    if (!profile) return;
    if (!hasApiKey()) {
      Alert.alert('Coach offline', 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY to enable pattern scans.');
      return;
    }
    setScanning(true);
    try {
      const candidates = await detectPatterns({
        profile,
        recentLog: log,
        openPatterns: patterns.filter(p => p.status === 'open'),
      });
      if (!candidates.length) {
        Alert.alert("Nothing rising", "Nothing's crossed the flagging threshold yet. The coach will keep watching.");
        return;
      }
      for (const c of candidates) {
        await upsertPattern({
          id: uuid(),
          topic: c.topic,
          summary: c.summary,
          mentions: c.mentions,
          status: 'open',
          tone: c.tone,
          createdAt: new Date().toISOString(),
        });
      }
      Alert.alert("New patterns", `Found ${candidates.length}. Tap one to see what the coach noticed.`);
    } catch (e: unknown) {
      Alert.alert('Scan failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Memory." sub="what the coach holds about you" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 20 }}>
        <Section title="Patterns being watched">
          <View style={{ gap: 8 }}>
            {patterns.map(p => (
              <PatternCard key={p.id} p={p} onPress={() => nav.navigate('PatternDetail', { pattern: p })} />
            ))}
            {patterns.length === 0 && <EmptyNote text="No patterns being watched yet." />}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
              <PillButton
                label={scanning ? 'Scanning…' : 'Scan for patterns'}
                kind="alt"
                onPress={runScan}
                disabled={scanning}
              />
            </View>
          </View>
        </Section>

        <Section title="Facts">
          <Card style={{ overflow: 'hidden' }}>
            {memory.map((row, i, arr) => (
              <View
                key={row.id}
                style={{
                  flexDirection: 'row',
                  padding: 14,
                  alignItems: 'center',
                  borderBottomWidth: i < arr.length - 1 ? 0.5 : 0,
                  borderBottomColor: colors.line,
                }}
              >
                <Text style={{ flex: 1, fontFamily: fonts.serif, fontSize: 14, color: colors.ink }}>
                  {row.headline}
                </Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.body, textAlign: 'right' }}>
                  {row.detail}
                </Text>
              </View>
            ))}
            {memory.length === 0 && <EmptyNote text="Nothing remembered yet." />}
          </Card>
        </Section>

        <Section title="Weekly recaps">
          <Card style={{ overflow: 'hidden' }}>
            {recaps.map((r, i, arr) => (
              <RecapRow
                key={r.id}
                r={r}
                last={i === arr.length - 1}
                onPress={() => nav.navigate('WeeklyRecap', { recap: r })}
              />
            ))}
            {recaps.length === 0 && <EmptyNote text="No recaps yet — check in next week." />}
          </Card>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Label style={{ marginBottom: 10, paddingLeft: 4 }}>{title}</Label>
      {children}
    </View>
  );
}

function PatternCard({ p, onPress }: { p: PatternFlag; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card accentEdge={p.tone} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ flex: 1, fontFamily: fonts.serifBold, fontSize: 15.5, color: colors.ink }}>{p.topic}</Text>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 10,
              color: colors[p.tone],
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {p.status}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 3 }}>
          {p.summary}
        </Text>
      </Card>
    </Pressable>
  );
}

function RecapRow({ r, last, onPress }: { r: WeeklyRecap; last: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderBottomWidth: last ? 0 : 0.5,
          borderBottomColor: colors.line,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 14.5, color: colors.ink }}>Week of {prettyDate(r.weekStart)}</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={2}>
            {strip(r.headline)}
          </Text>
        </View>
        <Svg width={9} height={13} viewBox="0 0 10 14">
          <Path d="M1 1l6 6-6 6" stroke={colors.muted} fill="none" strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </View>
    </Pressable>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Text style={{ fontFamily: fonts.serifRegItalic, color: colors.muted, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function prettyDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}
function strip(s: string) {
  return s.replace(/^"+|"+$/g, '');
}
