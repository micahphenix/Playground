import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, radii } from '../../theme';
import { ModalHeader } from '../../components/ModalHeader';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { WatchFace, WatchShape } from '../../components/WatchFace';
import { useData } from '../../data/DataContext';
import { activeTrackingPlan } from '../../data/trackingPlans';

// In-app preview of the Steward watch face. The same content renders for any
// wrist — round (Apple Watch / round Garmin) or square (Garmin Vivoactive,
// some Wear OS). Not a real watch app; this is the source-of-truth visual
// the future widget bundle will mirror.

const GOAL_TAG: Record<string, string> = {
  muscle: 'BUILD',
  ride: 'RIDE BUILD',
  recover: 'RECOVER',
};

export function WatchPreviewModal() {
  const nav = useNavigation();
  const { profile, log, briefing } = useData();
  const [shape, setShape] = useState<WatchShape>('round');
  const [bezel, setBezel] = useState<'dark' | 'sand'>('dark');

  const totals = useMemo(() => {
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
  }, [log]);

  if (!profile) return null;

  const plan = activeTrackingPlan(profile);
  const coachLine = briefingShortLine(briefing?.body) ?? 'Quiet day so far. Walk it open.';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalHeader title="On your wrist" sub="watch face preview" onClose={nav.goBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 18 }}>
        {/* Mount — fabric band suggestion behind the face, in either tone */}
        <View
          style={{
            backgroundColor: bezel === 'dark' ? '#231C16' : colors.surfaceAlt,
            paddingVertical: 36,
            paddingHorizontal: 16,
            borderRadius: 28,
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <BandStripe tone={bezel} />
          <WatchFace
            shape={shape}
            diameter={260}
            proteinValue={totals.protein}
            proteinTarget={plan.rings.protein_g}
            caloriesValue={totals.kcal}
            caloriesTarget={plan.rings.calories}
            date={new Date()}
            coachLine={coachLine}
            goalTag={GOAL_TAG[profile.activeGoal]}
          />
          <BandStripe tone={bezel} flipped />
        </View>

        <Card style={{ padding: 16, gap: 14 }}>
          <View>
            <Label>Shape</Label>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <SegBtn label="Round" active={shape === 'round'} onPress={() => setShape('round')} />
              <SegBtn label="Square" active={shape === 'square'} onPress={() => setShape('square')} />
            </View>
            <Text style={hint}>Round reads on Apple Watch and circular Garmin faces. Square covers Vivoactive and Wear OS rectangulars.</Text>
          </View>
          <View>
            <Label>Band</Label>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <SegBtn label="Dark" active={bezel === 'dark'} onPress={() => setBezel('dark')} />
              <SegBtn label="Sand" active={bezel === 'sand'} onPress={() => setBezel('sand')} />
            </View>
            <Text style={hint}>Cosmetic — doesn't affect what gets rendered to the actual platform widget.</Text>
          </View>
        </Card>

        <Card style={{ padding: 14 }}>
          <Label>What it shows</Label>
          <View style={{ marginTop: 8, gap: 6 }}>
            <Bullet color={colors.accent} text="Outer ring · protein vs. today's target" />
            <Bullet color={colors.accentAlt} text="Inner ring · calories vs. today's target" />
            <Bullet color={colors.muted} text="Center · % protein in mono — no fake precision" />
            <Bullet color={colors.muted} text="Bottom · one italic line from the coach (latest briefing or auto)" />
          </View>
        </Card>

        <Text style={{ fontFamily: fonts.serifRegItalic, fontSize: 12.5, color: colors.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 }}>
          Custom face, platform-neutral. The widget bundle (WidgetKit on iOS, ConnectIQ on Garmin) renders the same content using the host's native primitives.
        </Text>
      </ScrollView>
    </View>
  );
}

function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: active ? colors.ink : colors.surface,
        borderWidth: 0.5,
        borderColor: active ? colors.ink : colors.line,
        alignItems: 'center',
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Text
        style={{
          color: active ? colors.surface : colors.body,
          fontFamily: fonts.sansBold,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Bullet({ color, text }: { color: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.body }}>{text}</Text>
    </View>
  );
}

// Two horizontal lugs that imply a watch band so the face reads as a watch
// preview without invoking any specific platform's chrome.
function BandStripe({ tone, flipped }: { tone: 'dark' | 'sand'; flipped?: boolean }) {
  const color = tone === 'dark' ? '#3A2F25' : '#D9C9A5';
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 26,
        top: flipped ? undefined : 0,
        bottom: flipped ? 0 : undefined,
        flexDirection: 'row',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 180,
          height: 26,
          backgroundColor: color,
          borderTopLeftRadius: flipped ? 0 : 6,
          borderTopRightRadius: flipped ? 0 : 6,
          borderBottomLeftRadius: flipped ? 12 : 0,
          borderBottomRightRadius: flipped ? 12 : 0,
        }}
      />
    </View>
  );
}

const hint = {
  marginTop: 8,
  fontFamily: fonts.serifRegItalic,
  fontStyle: 'italic' as const,
  fontSize: 12,
  color: colors.muted,
  lineHeight: 18,
};

function briefingShortLine(body?: string): string | undefined {
  if (!body) return undefined;
  // Take the first sentence, trim, cap length.
  const first = body.split(/[.!?]/)[0]?.trim();
  if (!first) return undefined;
  return first.length > 80 ? first.slice(0, 77) + '…' : first + '.';
}
