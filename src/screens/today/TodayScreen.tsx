import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, type } from '../../theme';
import { TopBar } from '../../components/TopBar';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { PillButton } from '../../components/PillButton';
import { CoachMark } from '../../components/CoachMark';
import { ConcentricRings } from '../../components/Ring';
import { Composer } from '../../components/Composer';
import { AccentText } from '../../components/AccentText';
import { useData } from '../../data/DataContext';
import { analyzeMealPhoto, parseFreeform, hasApiKey } from '../../ai/coach';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { LogEntry } from '../../data/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GOAL_LABEL: Record<string, string> = {
  muscle: 'build muscle · week 4',
  ride: '50-mi build · week 4',
  recover: 'recover · steady',
};

export function TodayScreen() {
  const nav = useNavigation<Nav>();
  const { profile, log, briefing, dismissBriefing, restoreBriefing, patterns } = useData();
  const [composerText, setComposerText] = useState('');
  const [working, setWorking] = useState(false);

  const todays = useMemo(() => sumToday(log), [log]);
  const dateLabel = useMemo(() => formatDateTitle(new Date()), []);

  async function sendText() {
    if (!composerText.trim() || !profile) return;
    if (!hasApiKey()) {
      Alert.alert('Coach offline', 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY in .env and restart Expo to enable parsing.');
      return;
    }
    setWorking(true);
    try {
      const parse = await parseFreeform(composerText, {
        profile,
        recentLog: log,
        openPatterns: patterns.filter(p => p.status === 'open'),
      });
      const proposals = parse.entries
        .filter(e => e.proposedLimitation)
        .map(e => ({
          kind: 'limitation' as const,
          label: e.proposedLimitation!.label,
          note: e.proposedLimitation!.note,
        }));
      // Voice + text share the confirm modal — pass the parsed entries through.
      nav.navigate('VoiceConfirm', { transcript: composerText, durationSec: 0, entries: parse.entries });
      if (proposals.length) {
        // Stack the profile-update modal after the confirm modal closes.
        // The confirm screen handles its own next-nav.
      }
      setComposerText('');
    } catch (e: unknown) {
      Alert.alert("Coach couldn't read that", e instanceof Error ? e.message : 'Try again.');
    } finally {
      setWorking(false);
    }
  }

  async function takePhoto() {
    if (!profile) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera off', 'Enable camera access in Settings to log meals from photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: false,
    });
    if (res.canceled || !res.assets[0]) return;
    await runPhotoAnalysis(res.assets[0].uri);
  }
  async function pickPhoto() {
    if (!profile) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (res.canceled || !res.assets[0]) return;
    await runPhotoAnalysis(res.assets[0].uri);
  }
  async function runPhotoAnalysis(uri: string) {
    if (!profile) return;
    if (!hasApiKey()) {
      Alert.alert('Coach offline', 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY in .env to enable photo analysis.');
      return;
    }
    setWorking(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const analysis = await analyzeMealPhoto(base64, {
        profile,
        recentLog: log,
        openPatterns: patterns.filter(p => p.status === 'open'),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      nav.navigate('PhotoConfirm', { photoUri: uri, analysis });
    } catch (e: unknown) {
      Alert.alert("Coach couldn't read the photo", e instanceof Error ? e.message : 'Try again.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={dateLabel.day} sub={`${dateLabel.month} · ${GOAL_LABEL[profile?.activeGoal ?? 'muscle']}`} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {briefing && !briefing.dismissed ? (
          <BriefingCard
            headline={briefing.headline}
            body={briefing.body}
            timestamp={briefing.timestamp}
            actions={briefing.actions}
            onDismiss={dismissBriefing}
          />
        ) : briefing ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Pressable
              onPress={restoreBriefing}
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                backgroundColor: colors.surfaceAlt,
                borderRadius: radii.pill,
                paddingHorizontal: 12,
                paddingVertical: 7,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.body, letterSpacing: 0.6 }}>
                ↑ BRIEFING
              </Text>
            </Pressable>
          </View>
        ) : null}

        <RingsRow protein={todays.protein} calories={todays.kcal} targetP={profile?.protein_g_target ?? 185} targetC={profile?.calories_target ?? 2600} />

        <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
          <Label style={{ marginBottom: 8, paddingLeft: 4 }}>Recent</Label>
          <Card raised style={{ overflow: 'hidden' }}>
            {log.slice(0, 6).map((row, i, arr) => (
              <LogRow key={row.id} entry={row} last={i === arr.length - 1} />
            ))}
            {log.length === 0 && (
              <View style={{ padding: 18, alignItems: 'center' }}>
                <Text style={{ ...type.body, color: colors.muted, fontStyle: 'italic' }}>
                  Nothing logged yet today.
                </Text>
              </View>
            )}
          </Card>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <Pressable
            onPress={() => nav.navigate('Chat')}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              opacity: pressed ? 0.7 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            })}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: colors.accent, letterSpacing: 0.4 }}>
              OPEN FULL CONVERSATION
            </Text>
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2}>
              <Path d="M9 6l6 6-6 6" />
            </Svg>
          </Pressable>
        </View>
      </ScrollView>
      <Composer
        value={composerText}
        onChangeText={setComposerText}
        onSend={sendText}
        onCamera={takePhoto}
        onMic={pickPhoto}
        disabled={working}
        placeholder={working ? 'Reading…' : 'Let me know how I can help…'}
      />
    </View>
  );
}

function sumToday(log: LogEntry[]) {
  const today = new Date().toISOString().slice(0, 10);
  let kcal = 0,
    protein = 0;
  for (const e of log) {
    if (e.createdAt.slice(0, 10) !== today) continue;
    if (e.macros) {
      kcal += e.macros.kcal;
      protein += e.macros.protein_g;
    }
  }
  return { kcal, protein };
}

function formatDateTitle(d: Date) {
  const day = d.toLocaleDateString(undefined, { weekday: 'long' });
  const month = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }).toUpperCase();
  return { day: `${day}.`, month };
}

function BriefingCard({
  headline,
  body,
  timestamp,
  actions,
  onDismiss,
}: {
  headline: string;
  body: string;
  timestamp: string;
  actions: { label: string; kind: 'primary' | 'alt' | 'ghost' }[];
  onDismiss: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
      <Card style={{ padding: 16, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CoachMark size={24} />
          <Label>Morning · {timestamp}</Label>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onDismiss} hitSlop={10}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2}>
              <Path d="M6 6l12 12M18 6L6 18" />
            </Svg>
          </Pressable>
        </View>
        <AccentText
          style={{
            fontFamily: fonts.serif,
            fontSize: 18,
            color: colors.ink,
            lineHeight: 25,
            letterSpacing: -0.2,
          }}
        >
          {headline}
        </AccentText>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13.5,
            color: colors.body,
            lineHeight: 20,
            marginTop: 8,
          }}
        >
          {body}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {actions.map((a, i) => (
            <PillButton key={i} label={a.label} kind={a.kind} />
          ))}
        </View>
      </Card>
    </View>
  );
}

function RingsRow({
  protein,
  calories,
  targetP,
  targetC,
}: {
  protein: number;
  calories: number;
  targetP: number;
  targetC: number;
}) {
  const proteinPct = Math.round((protein / targetP) * 100);
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
      <Card style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Label>Today</Label>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 18, color: colors.ink, marginTop: 2 }}>
              {protein === 0 ? 'Quiet so far' : 'In motion'}
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, letterSpacing: 0.3 }}>
            {new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ConcentricRings
            outer={{ value: protein, target: targetP, color: colors.accent }}
            inner={{ value: calories, target: targetC, color: colors.accentAlt }}
            size={132}
            label={`${proteinPct}`}
            sublabel="% PROTEIN"
          />
          <View style={{ flex: 1, gap: 10 }}>
            <Stat label="Protein" value={protein} target={targetP} color={colors.accent} />
            <Stat label="Calories" value={calories} target={targetC} color={colors.accentAlt} />
            <Stat label="Training" value={0} target={1} color={colors.muted} />
          </View>
        </View>
      </Card>
    </View>
  );
}

function Stat({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: color }} />
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, flex: 1 }}>{label}</Text>
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 15, color: colors.ink }}>
          {Math.round(value)}
          <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.muted }}>/{target}</Text>
        </Text>
      </View>
      <View
        style={{
          marginTop: 4,
          height: 3,
          backgroundColor: colors.surfaceAlt,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, opacity: 0.85 }} />
      </View>
    </View>
  );
}

function LogRow({ entry, last }: { entry: LogEntry; last: boolean }) {
  const tint =
    entry.kind === 'recovery'
      ? colors.good
      : entry.kind === 'workout'
        ? colors.accentAlt
        : colors.accent;
  const macros = entry.macros;
  const date = new Date(entry.createdAt);
  const when = sameDay(date, new Date())
    ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : `Yesterday ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: tint }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 14.5, color: colors.ink }}>{entry.title}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 }}>{when}</Text>
      </View>
      {macros && (
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.body }}>
          {macros.kcal} · {macros.protein_g}g P
        </Text>
      )}
    </View>
  );
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
