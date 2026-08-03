import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuid } from 'uuid';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radii, type } from '../../theme';
import { TopBar } from '../../components/TopBar';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { CoachMark } from '../../components/CoachMark';
import { ConcentricRings } from '../../components/Ring';
import { Composer } from '../../components/Composer';
import { AccentText } from '../../components/AccentText';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { useData } from '../../data/DataContext';
import { sumDayTotals, sumDayLoad, type DayLoad } from '../../data/totals';
import { trackingPlanFor } from '../../data/trackingPlans';
import { generateBriefing, interpret, readPhoto, hasApiKey } from '../../ai/coach';
import { toHistory } from '../../ai/chatHistory';
import { briefingSeed } from '../../ai/briefingThread';
import { hasTranscriptionKey, transcribe } from '../../ai/transcribe';
import { pickMealPhoto } from '../../services/photoPicker';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { LogEntry, MemoryItem, Message } from '../../data/types';
import { todayLocal } from '../../data/day';
import {
  deriveMaintenance,
  intakeDaysFromLog,
  readLossRate,
  weeklyTrend,
  weighInsFromLog,
} from '../../data/bodyModel';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface InterpretOpts {
  // Coach turn written to the transcript ahead of the user's, so replying to
  // the briefing opens a thread that already carries what the briefing said.
  seedCoachTurn?: string;
  // Record the user's message as the day's decision in memory. Replaces the
  // canned "Picked <label>" row the action pills used to write.
  recordDecision?: boolean;
}

export function TodayScreen() {
  const nav = useNavigation<Nav>();
  const { profile, log, briefing, dismissBriefing, restoreBriefing, setBriefing, patterns, deleteLog, addMemory, memory, chatMessages, addChatMessage } = useData();
  const [composerText, setComposerText] = useState('');
  const [working, setWorking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [recording, setRecording] = useState(false);
  const plan = trackingPlanFor(profile?.activeGoal ?? 'muscle');

  async function regenerate() {
    if (!profile) return;
    if (!hasApiKey()) {
      Alert.alert('Coach offline', 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY to regenerate the briefing.');
      return;
    }
    setRegenerating(true);
    try {
      const draft = await generateBriefing({
        profile,
        recentLog: log,
        memory,
        openPatterns: patterns.filter(p => p.status === 'open'),
      });
      const now = new Date();
      await setBriefing({
        id: briefing?.id ?? 'auto',
        forDate: todayLocal(),
        timestamp: now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase(),
        headline: draft.headline,
        body: draft.body,
        dismissed: false,
      });
      // A regenerated briefing is a new opening turn — allow it to seed again.
      seededBriefing.current = null;
    } catch (e: unknown) {
      Alert.alert("Couldn't write the briefing", e instanceof Error ? e.message : 'Try again.');
    } finally {
      setRegenerating(false);
    }
  }

  const todays = useMemo(() => sumToday(log), [log]);
  const todaysLoad = useMemo(() => sumDayLoad(log), [log]);
  const dateLabel = useMemo(() => formatDateTitle(new Date()), []);
  const autoRegenRan = useRef(false);
  // Which briefing has already been seeded into the chat transcript, so a
  // second message on the same day doesn't repeat it.
  const seededBriefing = useRef<string | null>(null);

  // Foreground EOD substitute: if the briefing is from a previous day, write
  // a new one on first open today. A real background task (expo-background-task)
  // would do this overnight, but Expo Go can't host one — this keeps the
  // briefing fresh in the meantime.
  useEffect(() => {
    if (autoRegenRan.current) return;
    if (!profile || !hasApiKey()) return;
    if (!briefing) return;
    const today = todayLocal();
    if (briefing.forDate === today) return;
    autoRegenRan.current = true;
    regenerate();
    // regenerate's dependencies change on every render of TodayScreen, but the
    // ref gate above ensures we only fire once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, briefing]);

  // Today's composer and Chat feed the same conversation, so they run the same
  // call. `interpret()` returns a reply AND any loggable entries; `parseFreeform`
  // only ever returned entries, which is why asking a question here used to
  // dead-end in a confirm modal with "I'd save 0 things" instead of an answer.
  async function runInterpret(said: string, durationSec: number, opts: InterpretOpts = {}) {
    if (!profile) return;
    if (!hasApiKey()) {
      Alert.alert('Coach offline', 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY in .env and restart Expo to enable the coach.');
      return;
    }
    // History is the transcript BEFORE this turn — the new text goes in live.
    const history = toHistory(chatMessages);
    setWorking(true);
    try {
      // Seed the coach's own words as the opening turn so the thread reads as a
      // continuation of the card the user was just looking at, not a cold start.
      if (opts.seedCoachTurn) {
        const seedMsg: Message = {
          id: uuid(),
          role: 'coach',
          text: opts.seedCoachTurn,
          createdAt: new Date().toISOString(),
        };
        await addChatMessage(seedMsg).catch(() => {});
        history.push({ role: 'assistant', content: opts.seedCoachTurn });
      }
      const userMsg: Message = { id: uuid(), role: 'user', text: said, createdAt: new Date().toISOString() };
      await addChatMessage(userMsg).catch(() => {});
      const result = await interpret(
        said,
        {
          profile,
          recentLog: log,
          memory,
          openPatterns: patterns.filter(p => p.status === 'open'),
        },
        history,
      );
      const coachMsg: Message = {
        id: uuid(),
        role: 'coach',
        text: result.reply,
        createdAt: new Date().toISOString(),
      };
      await addChatMessage(coachMsg).catch(() => {});
      if (opts.recordDecision) {
        await addMemory({
          id: uuid(),
          kind: 'decision',
          headline: "Responded to today's briefing",
          detail: said,
          createdAt: new Date().toISOString(),
        });
      }
      setComposerText('');
      if (result.entries.length > 0) {
        // Something concrete to log — confirm before it lands in the day.
        nav.navigate('VoiceConfirm', { transcript: said, durationSec, entries: result.entries });
      } else {
        // Pure conversation — open the thread so the answer is actually read.
        nav.navigate('Chat');
      }
    } catch (e: unknown) {
      Alert.alert("Coach couldn't read that", e instanceof Error ? e.message : 'Try again.');
    } finally {
      setWorking(false);
    }
  }

  // While an undismissed briefing is on screen, the user's next message IS the
  // reply to it. Seed the coach's own words as the opening turn — once per
  // briefing — so the thread carries that context instead of starting cold,
  // and record what they actually said as the day's decision.
  function briefingOpts(): InterpretOpts {
    if (!briefing || briefing.dismissed) return {};
    const key = `${briefing.forDate}:${briefing.timestamp}`;
    if (seededBriefing.current === key) return {};
    seededBriefing.current = key;
    return { seedCoachTurn: briefingSeed(briefing.headline, briefing.body), recordDecision: true };
  }

  async function sendText() {
    if (!composerText.trim()) return;
    await runInterpret(composerText.trim(), 0, briefingOpts());
  }

  async function takePhoto() {
    if (!profile) return;
    const uri = await pickMealPhoto();
    if (uri) await runPhotoAnalysis(uri);
  }
  function startVoice() {
    if (!hasTranscriptionKey()) {
      Alert.alert(
        'Voice not configured',
        'Set EXPO_PUBLIC_OPENAI_API_KEY in .env to enable voice transcription (Whisper). You can still type entries.',
      );
      return;
    }
    setRecording(true);
  }
  async function onVoiceDone(uri: string, durationSec: number) {
    setRecording(false);
    if (!profile) return;
    let said = '';
    setWorking(true);
    try {
      const res = await transcribe(uri, durationSec);
      said = res.text;
    } catch (e: unknown) {
      Alert.alert("Couldn't transcribe", e instanceof Error ? e.message : 'Try again.');
      return;
    } finally {
      setWorking(false);
    }
    if (!said) {
      Alert.alert("Didn't catch that", 'The recording came through empty — try again, a little closer to the mic.');
      return;
    }
    // Voice is just another way to talk — same interpret path as typing.
    await runInterpret(said, durationSec, briefingOpts());
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
      const reading = await readPhoto(base64, {
        profile,
        recentLog: log,
        memory,
        openPatterns: patterns.filter(p => p.status === 'open'),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (reading.kind === 'meal') {
        nav.navigate('PhotoConfirm', { photoUri: uri, analysis: reading.analysis });
        return;
      }
      // Not food. The coach's read of it belongs in the conversation either way —
      // a workout screenshot is worth a response, not just a log row.
      await addChatMessage({
        id: uuid(),
        role: 'user',
        photoUri: uri,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
      await addChatMessage({
        id: uuid(),
        role: 'coach',
        text: reading.reply,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
      if (reading.kind === 'entries') {
        nav.navigate('VoiceConfirm', { transcript: reading.reply, durationSec: 0, entries: reading.entries });
      } else {
        nav.navigate('Chat');
      }
    } catch (e: unknown) {
      Alert.alert("Coach couldn't read the photo", e instanceof Error ? e.message : 'Try again.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={dateLabel.day} sub={`${dateLabel.month} · ${plan.name.toLowerCase()}`} />
      {/* Without this the keyboard slides over the composer and the user
          types blind — first defect of the July 6 validation window. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {briefing && !briefing.dismissed ? (
          <BriefingCard
            headline={briefing.headline}
            body={briefing.body}
            timestamp={briefing.timestamp}
            onDismiss={dismissBriefing}
            onRegenerate={regenerate}
            regenerating={regenerating}
          />
        ) : (
          <>
            <DailySummary log={log} />
            <View style={{ paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', gap: 8 }}>
              {briefing && (
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
              )}
              <Pressable
                onPress={regenerate}
                disabled={regenerating}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  backgroundColor: colors.accentSoft,
                  borderRadius: radii.pill,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  opacity: regenerating ? 0.5 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.accent, letterSpacing: 0.6 }}>
                  {regenerating ? 'WRITING…' : '↻ NEW BRIEFING'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        <RingsRow protein={todays.protein} calories={todays.kcal} targetP={plan.rings.protein_g} targetC={plan.rings.calories} load={todaysLoad} />

        <BodyModelCard log={log} memory={memory} staticEstimateKcal={plan.rings.calories} />

        <BodyModelCard log={log} memory={memory} staticEstimateKcal={plan.rings.calories} />

        <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
          <Label style={{ marginBottom: 8, paddingLeft: 4 }}>Recent</Label>
          <Card raised style={{ overflow: 'hidden' }}>
            {log.slice(0, 6).map((row, i, arr) => (
              <LogRow
                key={row.id}
                entry={row}
                last={i === arr.length - 1}
                onLongPress={() =>
                  Alert.alert('Remove from log?', `"${row.title}"`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => deleteLog(row.id) },
                  ])
                }
              />
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
        onMic={startVoice}
        disabled={working}
        placeholder={working ? 'Reading…' : 'Let me know how I can help…'}
      />
      </KeyboardAvoidingView>
      <VoiceRecorder visible={recording} onCancel={() => setRecording(false)} onComplete={onVoiceDone} />
    </View>
  );
}

function sumToday(log: LogEntry[]) {
  const { kcal, protein_g } = sumDayTotals(log);
  return { kcal, protein: protein_g };
}

function formatDateTitle(d: Date) {
  const day = d.toLocaleDateString(undefined, { weekday: 'long' });
  const month = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }).toUpperCase();
  return { day: `${day}.`, month };
}

function DailySummary({ log }: { log: LogEntry[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todays = log.filter(e => e.createdAt.slice(0, 10) === today);
  const meals = todays.filter(e => e.kind === 'meal').length;
  const workouts = todays.filter(e => e.kind === 'workout').length;
  const recovery = todays.filter(e => e.kind === 'recovery');
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
      <Card style={{ padding: 14 }}>
        <Label>Today so far</Label>
        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: 16,
            color: colors.ink,
            marginTop: 8,
            lineHeight: 22,
          }}
        >
          {summarize(meals, workouts, recovery.length)}
        </Text>
      </Card>
    </View>
  );
}
function summarize(meals: number, workouts: number, recovery: number): string {
  if (meals === 0 && workouts === 0 && recovery === 0) return "Nothing logged yet today — the day is still wide open.";
  const parts: string[] = [];
  if (meals) parts.push(`${meals} meal${meals === 1 ? '' : 's'} logged`);
  if (workouts) parts.push(`${workouts} workout${workouts === 1 ? '' : 's'}`);
  if (recovery) parts.push(`${recovery} recovery note${recovery === 1 ? '' : 's'}`);
  return parts.join(' · ') + '.';
}

// Read-only by design. Suggested-action pills used to live at the bottom of
// this card; tapping one wrote a canned "Picked <label>" decision and closed
// the briefing, which made the one moment with real context feel like a form.
// The briefing is now something you reply to in your own words — the composer
// below carries it into the conversation.
function BriefingCard({
  headline,
  body,
  timestamp,
  onDismiss,
  onRegenerate,
  regenerating,
}: {
  headline: string;
  body: string;
  timestamp: string;
  onDismiss: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
      <Card style={{ padding: 16, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CoachMark size={24} />
          <Label>Morning · {timestamp}</Label>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onRegenerate}
            disabled={regenerating}
            hitSlop={10}
            style={{ marginRight: 6, opacity: regenerating ? 0.4 : 1 }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round">
              <Path d="M21 12a9 9 0 1 1-3.7-7.3M21 4v5h-5" />
            </Svg>
          </Pressable>
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
      </Card>
    </View>
  );
}

// The body model, made visible. Until this existed the coach knew the user's
// measured maintenance but the user themselves had no way to see it, which is
// a strange thing for a number derived entirely from their own data.
//
// Deliberately quiet: no chart, no projection. A weekly-average weight, the
// derived maintenance, and an honest label about whether it is measured yet.
function BodyModelCard({
  log,
  memory,
  staticEstimateKcal,
}: {
  log: LogEntry[];
  memory: MemoryItem[];
  staticEstimateKcal: number;
}) {
  const model = useMemo(() => {
    const asOf = todayLocal();
    const weighIns = weighInsFromLog(log);
    return {
      maintenance: deriveMaintenance(weighIns, intakeDaysFromLog(log), asOf, staticEstimateKcal),
      trend: weeklyTrend(weighIns, asOf),
    };
  }, [log, staticEstimateKcal]);

  // Nothing logged and nothing measured — don't take up space telling the user
  // they haven't done anything.
  if (model.maintenance.kind === 'estimate' && model.maintenance.reason === 'cold-start' && !model.trend) {
    return (
      <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
        <Label style={{ marginBottom: 8, paddingLeft: 4 }}>Body model</Label>
        <Card style={{ padding: 16 }}>
          <Text style={{ fontFamily: fonts.serifRegItalic, fontSize: 14, color: colors.muted, lineHeight: 20 }}>
            Weigh in each morning and I'll work out what your body actually burns — measured from your own
            data, not a calculator's guess.
          </Text>
        </Card>
      </View>
    );
  }

  const m = model.maintenance;
  const measured = m.kind === 'measured';
  const verdict = model.trend ? readLossRate(model.trend.weeklyDeltaLb) : null;
  const verdictLabel: Record<NonNullable<typeof verdict>, string> = {
    gaining: 'gaining',
    maintaining: 'holding steady',
    'on-target': 'on target',
    fast: 'a little fast',
    'too-fast': 'too fast — eat more',
  };
  const verdictTone = verdict === 'too-fast' || verdict === 'fast' ? colors.warn : colors.accent;

  return (
    <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
      <Label style={{ marginBottom: 8, paddingLeft: 4 }}>Body model</Label>
      <Card style={{ padding: 16, gap: 12 }}>
        <View>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.muted, letterSpacing: 1 }}>
            {measured ? 'MAINTENANCE · MEASURED' : 'MAINTENANCE · ESTIMATE'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 28, color: colors.ink }}>
              {m.kcal.toLocaleString()}
            </Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted }}>kcal/day</Text>
          </View>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.body, marginTop: 4, lineHeight: 18 }}>
            {measured
              ? `From ${m.intakeDayCount} logged days and ${m.weighInCount} weigh-ins${m.confidence === 'rough' ? ' — still thin, treat as directional' : ''}.`
              : m.reason === 'cold-start'
                ? "Starting estimate — I haven't measured yours yet."
                : `Still an estimate — about ${m.daysUntilMeasurable} more day${m.daysUntilMeasurable === 1 ? '' : 's'} of logging to measure it.`}
          </Text>
        </View>
        {model.trend && (
          <View style={{ borderTopWidth: 0.5, borderTopColor: colors.line, paddingTop: 12 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.muted, letterSpacing: 1 }}>
              WEIGHT · 7-DAY AVERAGE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.ink }}>
                {model.trend.recentMeanLb.toFixed(1)}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted }}>lb</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 12.5, color: verdictTone }}>
                {model.trend.weeklyDeltaLb > 0 ? '+' : ''}
                {model.trend.weeklyDeltaLb.toFixed(1)} lb/wk
              </Text>
            </View>
            {verdict && (
              <Text style={{ fontFamily: fonts.serifRegItalic, fontSize: 13, color: colors.muted, marginTop: 4 }}>
                {verdictLabel[verdict]} · single mornings are water noise, this is the average
              </Text>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

function RingsRow({
  protein,
  calories,
  targetP,
  targetC,
  load,
}: {
  protein: number;
  calories: number;
  targetP: number;
  targetC: number;
  load: DayLoad;
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
            {/* Was hardcoded to 0 — the tile never moved no matter what was
                logged. It now reflects the day's actual sessions. */}
            <Stat label="Training" value={load.workouts} target={1} color={colors.muted} />
          </View>
        </View>
        {(load.minutes > 0 || load.activeKcal > 0) && (
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12.5,
              color: colors.muted,
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 0.5,
              borderTopColor: colors.line,
            }}
          >
            {load.minutes > 0 ? `${load.minutes} min moving` : ''}
            {load.minutes > 0 && load.activeKcal > 0 ? ' · ' : ''}
            {load.activeKcal > 0 ? `${load.activeKcal.toLocaleString()} active kcal` : ''}
            {load.activeKcal > 0 ? ' — already in your weight trend, not added back to intake' : ''}
          </Text>
        )}
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

function LogRow({ entry, last, onLongPress }: { entry: LogEntry; last: boolean; onLongPress: () => void }) {
  const tint =
    entry.kind === 'recovery'
      ? colors.good
      : entry.kind === 'workout'
        ? colors.accentAlt
        : colors.accent;
  const macros = entry.macros;
  const date = new Date(entry.createdAt);
  const when = formatWhen(date);
  return (
    <Pressable
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
      })}
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
    </Pressable>
  );
}

function formatWhen(d: Date): string {
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (sameDay(d, now)) return time;
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (sameDay(d, yest)) return `Yesterday ${time}`;
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${time}`;
}
function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
