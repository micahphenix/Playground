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
import * as ImagePicker from 'expo-image-picker';
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
import { analyzeMealPhoto, interpret, hasApiKey } from '../../ai/coach';
import { hasTranscriptionKey, transcribe } from '../../ai/transcribe';
import type { Message, PatternFlag } from '../../data/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ChatScreen() {
  const nav = useNavigation<Nav>();
  const { profile, log, patterns } = useData();
  const [messages, setMessages] = useState<Message[]>(() => seedMessages());
  const [text, setText] = useState('');
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
    const userMsg: Message = { id: uuid(), role: 'user', text: userText, createdAt: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setText('');
    if (!hasApiKey()) {
      setMessages(m => [
        ...m,
        {
          id: uuid(),
          role: 'coach',
          text: "I'm offline right now — set EXPO_PUBLIC_ANTHROPIC_API_KEY and restart Expo to hear me back.",
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }
    setThinking(true);
    try {
      const result = await interpret(userText, ctx);
      // Always append the conversational reply first so the chat reads naturally.
      setMessages(m => [
        ...m,
        { id: uuid(), role: 'coach', text: result.reply, createdAt: new Date().toISOString() },
      ]);
      // If the message contained loggable entries, route to the confirm flow.
      if (result.entries.length > 0) {
        nav.navigate('VoiceConfirm', {
          transcript: userText,
          durationSec: 0,
          entries: result.entries,
        });
      }
    } catch (e: unknown) {
      setMessages(m => [
        ...m,
        {
          id: uuid(),
          role: 'coach',
          text: `Something tripped on the way: ${e instanceof Error ? e.message : 'unknown'}.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setThinking(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [text, profile, ctx, nav]);

  async function attachPhoto() {
    if (!profile) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (res.canceled || !res.assets[0]) return;
    const uri = res.assets[0].uri;
    const userMsg: Message = { id: uuid(), role: 'user', photoUri: uri, createdAt: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
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
      const userMsg: Message = {
        id: uuid(),
        role: 'user',
        text: said || '[empty recording]',
        createdAt: new Date().toISOString(),
      };
      setMessages(m => [...m, userMsg]);
      if (!said) {
        setThinking(false);
        return;
      }
      const result = await interpret(said, ctx);
      setMessages(m => [
        ...m,
        { id: uuid(), role: 'coach', text: result.reply, createdAt: new Date().toISOString() },
      ]);
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
