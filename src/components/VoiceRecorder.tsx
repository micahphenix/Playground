import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts, radii } from '../theme';
import { Card } from './Card';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onComplete: (uri: string, durationSec: number) => void;
}

// Records a short voice memo. Renders a card overlay with mic + duration; tap
// stop to finish. Tap cancel to discard.
export function VoiceRecorder({ visible, onCancel, onComplete }: Props) {
  const recRef = useRef<Audio.Recording | null>(null);
  const startedAt = useRef<number>(0);
  const [duration, setDuration] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'finishing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    (async () => {
      try {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          setError('Mic permission denied.');
          setPhase('error');
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recRef.current = recording;
        startedAt.current = Date.now();
        setPhase('recording');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        interval = setInterval(() => {
          setDuration(Math.floor((Date.now() - startedAt.current) / 1000));
        }, 250);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not start the mic.');
        setPhase('error');
      }
    })();
    return () => {
      if (interval) clearInterval(interval);
      // If the overlay is dismissed while recording, stop the recorder so we
      // don't leak audio resources.
      const r = recRef.current;
      if (r) {
        r.stopAndUnloadAsync().catch(() => {});
        recRef.current = null;
      }
    };
  }, [visible]);

  async function stopAndSend() {
    const r = recRef.current;
    if (!r) return;
    setPhase('finishing');
    try {
      await r.stopAndUnloadAsync();
      const uri = r.getURI();
      recRef.current = null;
      if (!uri) throw new Error('Recording produced no file.');
      onComplete(uri, duration);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Stop failed.');
      setPhase('error');
    }
  }

  function cancel() {
    const r = recRef.current;
    if (r) r.stopAndUnloadAsync().catch(() => {});
    recRef.current = null;
    setPhase('idle');
    setDuration(0);
    onCancel();
  }

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 90,
        zIndex: 10,
      }}
    >
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.surface} strokeWidth={2}>
              <Rect x={9} y={3} width={6} height={11} rx={3} />
              <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.muted, letterSpacing: 1 }}>
              {phase === 'recording' ? 'RECORDING' : phase === 'finishing' ? 'FINISHING…' : phase.toUpperCase()}
            </Text>
            <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: colors.ink, marginTop: 2 }}>
              0:{String(duration).padStart(2, '0')}
            </Text>
          </View>
          <Waveform animating={phase === 'recording'} />
        </View>
        {error && (
          <Text style={{ marginTop: 10, fontFamily: fonts.sans, fontSize: 12.5, color: colors.warn }}>{error}</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable
            onPress={cancel}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: radii.pill,
              borderWidth: 0.5,
              borderColor: colors.lineStrong,
              alignItems: 'center',
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: colors.body, fontFamily: fonts.sansMed, fontSize: 13.5 }}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={stopAndSend}
            disabled={phase !== 'recording'}
            style={({ pressed }) => ({
              flex: 2,
              paddingVertical: 12,
              borderRadius: radii.pill,
              backgroundColor: colors.ink,
              alignItems: 'center',
              opacity: phase === 'recording' ? 1 : 0.4,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 14 }}>
              {phase === 'finishing' ? 'Finishing…' : 'Stop & send'}
            </Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

function Waveform({ animating }: { animating: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!animating) return;
    const i = setInterval(() => setTick(t => t + 1), 120);
    return () => clearInterval(i);
  }, [animating]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 2,
            height: 4 + Math.abs(Math.sin((tick + i) * 0.6)) * (animating ? 22 : 6),
            backgroundColor: colors.accent,
            opacity: 0.55 + Math.abs(Math.cos((tick + i) * 0.4)) * 0.4,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}
