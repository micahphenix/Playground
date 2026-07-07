import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuid } from 'uuid';
import * as FileSystem from 'expo-file-system';
import { colors, fonts } from '../../theme';
import { TopBar } from '../../components/TopBar';
import { Composer } from '../../components/Composer';
import { Bubble } from '../../components/Bubble';
import { CoachMark } from '../../components/CoachMark';
import { Card } from '../../components/Card';
import { PhotoStripe } from '../../components/PhotoStripe';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { useData } from '../../data/DataContext';
import { analyzeMealPhoto, interpret, hasApiKey, type ChatMessageIn } from '../../ai/coach';
import { hasTranscriptionKey, transcribe } from '../../ai/transcribe';
import { pickMealPhoto } from '../../services/photoPicker';
import type { Message, PatternFlag } from '../../data/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ChatScreen() {
  const nav = useNavigation<Nav>();
  const { profile, log, patterns, chatMessages, addChatMessage } = useData();
  // Resume the persisted transcript; the greeting only seeds a fresh install.
  const [messages, setMessages] = useState<Message[]>(() =>
    chatMessages.length ? chatMessages : seedMessages(),
  );
  const [text, setText] = useState('');

  // Append to screen state and persist through the repository. Fire-and-forget
  // on the write — chat must not block on storage.
  const pushMessage = useCallback(
    (m: Message) => {
      setMessages(prev => [...prev, m]);
      addChatMessage(m).catch(() => {});
    },
    [addChatMessage],
  );
  const hasUserActivity = messages.some(m => m.role === 'user');
  const [thinking, setThinking] = useState(false);
  const [recording, setRecording] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const ctx = useMemo(
    () => ({
      profile: profile!,
      recentLog: log,
      openPatterns: patterns.filter(p => p.status === 'open'),
    }),
    [profile, log, patterns],
  );

  const send = useCallback(async () => {
    if (!text.trim() || !profile) return;
    const userText = text;
    // History is the transcript BEFORE this message — the new text goes in as
    // the live user turn.
    const history = toHistory(messages);
    const userMsg: Message = { id: uuid(), role: 'user', text: userText, createdAt: new Date().toISOString() };
    pushMessage(userMsg);
    setText('');
    if (!hasApiKey()) {
      pushMessage({
        id: uuid(),
        role: 'coach',
        text: "I'm offline right now — set EXPO_PUBLIC_ANTHROPIC_API_KEY and restart Expo to hear me back.",
        createdAt: new Date().toISOString(),
      });
      return;
    }
    setThinking(true);
    try {
      const result = await interpret(userText, ctx, history);
      // Always append the conversational reply first so the chat reads naturally.
      pushMessage({ id: uuid(), role: 'coach', text: result.reply, createdAt: new Date().toISOString() });
      // If the message contained loggable entries, route to the confirm flow.
      if (result.entries.length > 0) {
        nav.navigate('VoiceConfirm', {
          transcript: userText,
          durationSec: 0,
          entries: result.entries,
        });
      }
    } catch (e: unknown) {
      pushMessage({
        id: uuid(),
        role: 'coach',
        text: `Something tripped on the way: ${e instanceof Error ? e.message : 'unknown'}.`,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setThinking(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [text, profile, ctx, nav, messages, pushMessage]);

  async function attachPhoto() {
    if (!profile) return;
    const uri = await pickMealPhoto();
    if (!uri) return;
    const userMsg: Message = { id: uuid(), role: 'user', photoUri: uri, createdAt: new Date().toISOString() };
    pushMessage(userMsg);
    if (!hasApiKey()) {
      Alert.alert('Coach offline', 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY in .env to enable photo analysis.');
      return;
    }
    setThinking(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const analysis = await analyzeMealPhoto(base64, ctx);
      setThinking(false);
      nav.navigate('PhotoConfirm', { photoUri: uri, analysis });
    } catch (e: unknown) {
      setThinking(false);
      Alert.alert("Couldn't read it", e instanceof Error ? e.message : 'Try again.');
    }
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
    setThinking(true);
    try {
      const { text: said } = await transcribe(uri, durationSec);
      // Treat the transcript as if the user typed it — same interpret path.
      const history = toHistory(messages);
      const userMsg: Message = {
        id: uuid(),
        role: 'user',
        text: said || '[empty recording]',
        createdAt: new Date().toISOString(),
      };
      pushMessage(userMsg);
      if (!said) {
        setThinking(false);
        return;
      }
      const result = await interpret(said, ctx, history);
      pushMessage({ id: uuid(), role: 'coach', text: result.reply, createdAt: new Date().toISOString() });
      if (result.entries.length > 0) {
        nav.navigate('VoiceConfirm', {
          transcript: said,
          durationSec,
          entries: result.entries,
        });
      }
    } catch (e: unknown) {
      Alert.alert("Couldn't transcribe", e instanceof Error ? e.message : 'Try again.');
    } finally {
      setThinking(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Today." sub="conversation" onBack={() => nav.goBack()} right={<CoachMark size={28} />} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(m => (
            <MessageView
              key={m.id}
              m={m}
              patterns={patterns}
              onOpenPattern={p => nav.navigate('PatternDetail', { pattern: p })}
            />
          ))}
          {!hasUserActivity && !thinking && (
            <SuggestedQuestions
              onPick={q => {
                setText(q);
              }}
            />
          )}
          {thinking && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CoachMark size={22} />
              <Card style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Dot delay={0} />
                  <Dot delay={120} />
                  <Dot delay={240} />
                  <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginLeft: 4 }}>
                    Thinking…
                  </Text>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>
        <VoiceRecorder visible={recording} onCancel={() => setRecording(false)} onComplete={onVoiceDone} />
        <Composer
          value={text}
          onChangeText={setText}
          onSend={send}
          onCamera={attachPhoto}
          onMic={startVoice}
          disabled={thinking || recording}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageView({
  m,
  patterns,
  onOpenPattern,
}: {
  m: Message;
  patterns: PatternFlag[];
  onOpenPattern: (p: PatternFlag) => void;
}) {
  if (m.patternFlagId) {
    const p = patterns.find(x => x.id === m.patternFlagId);
    if (!p) return null;
    return (
      <Pressable onPress={() => onOpenPattern(p)}>
        <Card accentEdge="accent" style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CoachMark size={22} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.muted, letterSpacing: 1.2 }}>
              I'M NOTICING SOMETHING
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.ink, lineHeight: 22 }}>{p.topic}</Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 4 }}>{p.summary}</Text>
        </Card>
      </Pressable>
    );
  }
  if (m.photoUri) {
    return (
      <View style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
        <Card style={{ padding: 6, maxWidth: '82%' }}>
          <PhotoStripe uri={m.photoUri} height={140} />
        </Card>
      </View>
    );
  }
  return <Bubble from={m.role === 'user' ? 'user' : 'coach'}>{m.text}</Bubble>;
}

function SuggestedQuestions({ onPick }: { onPick: (q: string) => void }) {
  const qs = [
    'Do I have room for a beer tonight?',
    'Should I lift today or rest?',
    'Where do I stand on protein this week?',
  ];
  return (
    <View style={{ gap: 8, marginTop: 4 }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.muted, letterSpacing: 1.2, paddingLeft: 4 }}>
        TRY ASKING
      </Text>
      {qs.map((q, i) => (
        <Pressable
          key={i}
          onPress={() => onPick(q)}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ flex: 1, fontFamily: fonts.serifRegItalic, fontStyle: 'italic', fontSize: 15, color: colors.ink, lineHeight: 21 }}>
              "{q}"
            </Text>
            <Text style={{ color: colors.accent, fontFamily: fonts.sansBold, fontSize: 14 }}>→</Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const i = setInterval(() => setOn(v => !v), 600);
    const t = setTimeout(() => setOn(true), delay);
    return () => {
      clearInterval(i);
      clearTimeout(t);
    };
  }, [delay]);
  return (
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, opacity: on ? 1 : 0.35 }} />
  );
}

// Project screen messages into API turns. Pattern cards and photo-only
// bubbles carry no text the model can use; system messages aren't part of the
// user/assistant alternation.
function toHistory(msgs: Message[]): ChatMessageIn[] {
  return msgs
    .filter(m => m.text && !m.patternFlagId && (m.role === 'user' || m.role === 'coach'))
    .map(m => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.text! }));
}

function seedMessages(): Message[] {
  return [
    {
      id: uuid(),
      role: 'coach',
      text: "Morning. I'm here. Photo, voice, or just type what's on your mind — I'll keep up.",
      createdAt: new Date().toISOString(),
    },
  ];
}
