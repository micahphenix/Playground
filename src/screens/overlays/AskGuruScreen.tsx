// ─────────────────────────────────────────────────────────────────────────────
// Ask Guru — chat overlay.
// No persistence between sessions; the lawn profile is Guru's memory.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS, RADII, SPACING, TYPE } from '../../design/tokens';
import { AppHeader, Eyebrow, Heading, ThinkingDots } from '../../design/components';
import { SendIcon } from '../../design/icons';
import { Sigil } from '../../design/Sigil';
import { OverlayParamList } from '../../navigation/types';
import { SUGGESTED_QUESTIONS } from '../../data/seed';
import { loadLawnProfile } from '../../storage/lawnStorage';
import { lawnContextFromProfile, LawnContextShape } from '../../data/lawnContext';
import { askGuru } from '../../services/askGuru';

type Props = NativeStackScreenProps<OverlayParamList, 'AskGuru'>;

interface Message {
  id: number;
  role: 'user' | 'guru';
  content: string;
}

export default function AskGuruScreen({ navigation, route }: Props) {
  const { lawnId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [lawn, setLawn] = useState<LawnContextShape | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadLawnProfile(lawnId).then((p) => {
      if (p) setLawn(lawnContextFromProfile(p));
    });
  }, [lawnId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, thinking]);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || thinking || !lawn) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: q };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);
    try {
      const reply = await askGuru(q, lawn);
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'guru', content: reply }]);
    } finally {
      setThinking(false);
    }
  }, [thinking, lawn]);

  const empty = messages.length === 0 && !thinking;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        eyebrow="ASK GURU"
        onBack={() => navigation.goBack()}
        right={<Sigil size={32} />}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: SPACING.appX, paddingBottom: 16 }}
      >
        {empty ? (
          <EmptyState lawn={lawn} onPick={send} />
        ) : (
          <View style={{ gap: 14, paddingTop: 8 }}>
            {messages.map((m) => <ChatBubble key={m.id} m={m} />)}
            {thinking && (
              <View style={styles.thinkingRow}>
                <Sigil size={26} />
                <View style={styles.thinkingBubble}>
                  <ThinkingDots />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Guru anything about your lawn…"
          placeholderTextColor={COLORS.inkFaint}
          style={styles.inputField}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim() || thinking}
          style={[
            styles.sendBtn,
            (!input.trim() || thinking) && { backgroundColor: `${COLORS.deepGreen}40` },
          ]}
        >
          <SendIcon />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function EmptyState({ lawn, onPick }: { lawn: LawnContextShape | null; onPick: (q: string) => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Sigil size={64} />
      <Heading level={2} italic style={styles.emptyHeading}>
        I know your lawn.{'\n'}What would you like to ask?
      </Heading>
      {lawn && (
        <Text style={styles.emptySummary}>
          {lawn.grassType.toLowerCase()} · {lawn.zone.toLowerCase()} · {lawn.sqft.toLocaleString()} sq ft
        </Text>
      )}
      <View style={{ gap: 8, width: '100%', marginTop: 8 }}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <Pressable key={q} onPress={() => onPick(q)} style={styles.suggestion}>
            <Text style={styles.suggestionText}>{q}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ChatBubble({ m }: { m: Message }) {
  if (m.role === 'user') {
    return (
      <View style={styles.userBubbleWrap}>
        <Text style={styles.userBubble}>{m.content}</Text>
      </View>
    );
  }
  return (
    <View style={styles.guruBubbleWrap}>
      <Sigil size={26} />
      <View style={{ marginLeft: 8, maxWidth: '85%' }}>
        <Text style={styles.guruLabel}>GURU</Text>
        <View style={styles.guruBubbleBox}>
          <Text style={styles.guruBubbleText}>{m.content}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 30,
    gap: 22,
  },
  emptyHeading: {
    textAlign: 'center',
    maxWidth: 280,
  },
  emptySummary: {
    fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 20, textAlign: 'center', maxWidth: 260,
  },
  suggestion: {
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.card,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  },
  suggestionText: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.deepGreen,
    letterSpacing: -0.15,
  },

  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    alignSelf: 'flex-start',
  },
  thinkingBubble: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  },

  userBubbleWrap: { alignSelf: 'flex-end', maxWidth: '82%' },
  userBubble: {
    backgroundColor: COLORS.leafGreen,
    color: '#fff',
    paddingHorizontal: 15, paddingVertical: 11,
    borderRadius: 20,
    borderBottomRightRadius: 5,
    fontSize: 14.5,
    lineHeight: 20,
    overflow: 'hidden',
  },

  guruBubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', alignSelf: 'flex-start', maxWidth: '95%' },
  guruLabel: {
    fontFamily: 'Georgia',
    fontSize: 10,
    color: COLORS.deepGreen,
    opacity: 0.55,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4, marginLeft: 4,
  },
  guruBubbleBox: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 15, paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    borderWidth: 0.5,
    borderColor: COLORS.line,
  },
  guruBubbleText: {
    color: COLORS.ink,
    fontSize: 14.5,
    lineHeight: 21,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.cream,
  },
  inputField: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: RADII.pill,
    borderWidth: 0.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.cardBg,
    fontSize: 14.5,
    color: COLORS.ink,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 999,
    backgroundColor: COLORS.deepGreen,
    alignItems: 'center', justifyContent: 'center',
  },
});
