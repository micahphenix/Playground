import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, type } from '../../theme';
import { CoachMark } from '../../components/CoachMark';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { Chip } from '../../components/Chip';
import { useData } from '../../data/DataContext';
import { HealthKit } from '../../health/HealthKit';
import { defaultProfile } from '../../data/seed';
import type { CoachTone, GoalId, Profile } from '../../data/types';

// 5-step setup that writes real values into the Profile before
// completeOnboarding() seeds the rest.

interface Draft {
  name: string;
  age: string;
  location: string;
  faithFraming: boolean;
  constraints: string[];
  activeGoal: GoalId;
  healthKitGranted: boolean;
  tone: CoachTone;
}

const SUGGESTED_CONSTRAINTS = [
  'Knee replacement — squats off-limits',
  'GERD — no heavy late meals',
  'Insomnia',
  'Lower back sensitivity',
  'Shoulder mobility',
];

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, updateProfile } = useData();
  const [step, setStep] = useState(0);
  const defaults = defaultProfile();
  const [draft, setDraft] = useState<Draft>({
    name: defaults.name,
    age: String(defaults.age),
    location: defaults.location,
    faithFraming: defaults.faithFraming,
    constraints: defaults.constraints,
    activeGoal: defaults.activeGoal,
    healthKitGranted: false,
    tone: defaults.tone,
  });

  function patch<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft(d => ({ ...d, [k]: v }));
  }

  function toggleConstraint(label: string) {
    setDraft(d => ({
      ...d,
      constraints: d.constraints.includes(label)
        ? d.constraints.filter(x => x !== label)
        : [...d.constraints, label],
    }));
  }

  async function finish() {
    // Seed first so the profile exists, then overwrite with the user's
    // captured values.
    await completeOnboarding();
    const patchObj: Partial<Profile> = {
      name: draft.name.trim() || defaults.name,
      age: Number(draft.age) || defaults.age,
      location: draft.location.trim() || defaults.location,
      faithFraming: draft.faithFraming,
      constraints: draft.constraints,
      activeGoal: draft.activeGoal,
      tone: draft.tone,
    };
    await updateProfile(patchObj);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 24,
            paddingHorizontal: 28,
            paddingBottom: 24 + Math.max(insets.bottom, 8),
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CoachMark size={36} />
            <View style={{ flex: 1 }}>
              <Label>Steward · v0.1</Label>
              <Text style={{ fontFamily: fonts.serifRegItalic, fontSize: 13, color: colors.body, marginTop: 1 }}>
                a coach for the body you've been given
              </Text>
            </View>
            <StepDots index={step} total={6} />
          </View>

          <View style={{ marginTop: 28, flex: 1 }}>
            {step === 0 && <Intro />}
            {step === 1 && <BasicsStep draft={draft} patch={patch} />}
            {step === 2 && <ConstraintsStep draft={draft} toggle={toggleConstraint} />}
            {step === 3 && <GoalStep draft={draft} patch={patch} />}
            {step === 4 && (
              <HealthKitStep
                granted={draft.healthKitGranted}
                onGrant={async () => {
                  const ok = await HealthKit.requestPermissions();
                  patch('healthKitGranted', ok);
                  if (!ok) {
                    Alert.alert('Permissions skipped', "You can grant access later from Settings → Integrations.");
                  }
                }}
              />
            )}
            {step === 5 && <ToneStep draft={draft} patch={patch} />}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {step > 0 && (
              <Pressable
                onPress={() => setStep(s => s - 1)}
                style={({ pressed }) => ({
                  paddingVertical: 16,
                  paddingHorizontal: 22,
                  borderRadius: radii.pill,
                  borderWidth: 0.5,
                  borderColor: colors.lineStrong,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{ color: colors.body, fontFamily: fonts.sansMed, fontSize: 14 }}>Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={async () => {
                if (step < 5) setStep(s => s + 1);
                else await finish();
              }}
              disabled={step === 1 && !draft.name.trim()}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.ink,
                borderRadius: radii.pill,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: step === 1 && !draft.name.trim() ? 0.4 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 15 }}>
                {step === 0 ? "Let's begin" : step === 5 ? 'Open Steward' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function StepDots({ index, total }: { index: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i <= index ? colors.accent : colors.surfaceAlt,
          }}
        />
      ))}
    </View>
  );
}

function Intro() {
  return (
    <View>
      <Text
        style={{
          fontFamily: fonts.serif,
          fontSize: 38,
          color: colors.ink,
          letterSpacing: -0.8,
          lineHeight: 42,
          marginBottom: 14,
        }}
      >
        The body is a{' '}
        <Text style={{ color: colors.accent, fontFamily: fonts.serifItalic, fontStyle: 'italic' }}>stewardship</Text>
        , not a project.
      </Text>
      <Text style={[type.bodyMd, { color: colors.body, lineHeight: 22 }]}>
        Steward holds the thread across food, training, recovery, and the limits you're actually working within.
        The goal isn't optimization. It's faithfulness.
      </Text>
      <Card style={{ padding: 18, marginTop: 24 }}>
        <Label>What you'll set up · about 5 minutes</Label>
        <View style={{ marginTop: 10, gap: 8 }}>
          {[
            ['Basics & profile', colors.accent],
            ['Constraints — arthritis, insomnia, etc.', colors.accentAlt],
            ['Active goal mode', colors.accent],
            ['HealthKit permissions', colors.accentAlt],
            ['Coach tone', colors.accent],
          ].map(([label, color], i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: color as string }} />
              <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: colors.body }}>{label as string}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

function StepHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Label>{eyebrow}</Label>
      <Text
        style={{
          fontFamily: fonts.serifBold,
          fontSize: 28,
          color: colors.ink,
          letterSpacing: -0.5,
          marginTop: 4,
          lineHeight: 32,
        }}
      >
        {title}
      </Text>
      {sub && <Text style={[type.body, { marginTop: 6 }]}>{sub}</Text>}
    </View>
  );
}

function BasicsStep({ draft, patch }: { draft: Draft; patch: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <View>
      <StepHeader eyebrow="Step 1 of 5" title="Who's the coach for?" sub="The basics shape how the coach talks to you." />
      <Field label="Name" value={draft.name} onChangeText={t => patch('name', t)} placeholder="First name" />
      <Field
        label="Age"
        value={draft.age}
        onChangeText={t => patch('age', t.replace(/[^\d]/g, ''))}
        placeholder="33"
        keyboardType="number-pad"
      />
      <Field
        label="Where you train"
        value={draft.location}
        onChangeText={t => patch('location', t)}
        placeholder="City, state"
      />
      <Card style={{ padding: 14, marginTop: 12 }}>
        <Pressable
          onPress={() => patch('faithFraming', !draft.faithFraming)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              backgroundColor: draft.faithFraming ? colors.accent : 'transparent',
              borderWidth: draft.faithFraming ? 0 : 1,
              borderColor: colors.lineStrong,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {draft.faithFraming && (
              <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 13 }}>✓</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 15, color: colors.ink }}>Stewardship framing</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 }}>
              The coach speaks of the body as a stewardship, not a project to optimize.
            </Text>
          </View>
        </Pressable>
      </Card>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        style={{
          marginTop: 6,
          padding: 14,
          backgroundColor: colors.surface,
          borderRadius: radii.sm,
          borderWidth: 0.5,
          borderColor: colors.line,
          fontFamily: fonts.serif,
          fontSize: 16,
          color: colors.ink,
        }}
      />
    </View>
  );
}

function ConstraintsStep({ draft, toggle }: { draft: Draft; toggle: (s: string) => void }) {
  return (
    <View>
      <StepHeader
        eyebrow="Step 2 of 5"
        title="What is your body asking you to respect?"
        sub="Pick anything that's a real constraint. The coach treats these as hard lines."
      />
      <View style={{ gap: 8 }}>
        {SUGGESTED_CONSTRAINTS.map(label => {
          const on = draft.constraints.includes(label);
          return (
            <Pressable
              key={label}
              onPress={() => toggle(label)}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: radii.sm,
                backgroundColor: on ? colors.accentSoft : colors.surface,
                borderWidth: on ? 1 : 0.5,
                borderColor: on ? colors.accent : colors.line,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <Text style={{ fontFamily: fonts.serif, fontSize: 15, color: on ? colors.accent : colors.ink }}>
                {on ? '✓ ' : ''}
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ marginTop: 14, fontFamily: fonts.serifRegItalic, fontSize: 13, color: colors.muted }}>
        You can add more anytime by mentioning them in chat ("tweaked my calf today").
      </Text>
    </View>
  );
}

function GoalStep({ draft, patch }: { draft: Draft; patch: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  const goals: { id: GoalId; name: string; detail: string; color: string }[] = [
    { id: 'muscle', name: 'Build muscle', detail: 'High protein · slow lift progression', color: colors.accent },
    { id: 'ride', name: '50-mile ride', detail: 'Cycling base · taper · maintenance lifts', color: colors.accentAlt },
    { id: 'recover', name: 'Recover well', detail: 'Lighter load · sleep priority', color: colors.muted },
  ];
  return (
    <View>
      <StepHeader eyebrow="Step 3 of 5" title="What season are you in?" sub="The active goal shifts targets, briefings, and coaching tone." />
      <View style={{ gap: 10 }}>
        {goals.map(g => {
          const active = draft.activeGoal === g.id;
          return (
            <Pressable key={g.id} onPress={() => patch('activeGoal', g.id)}>
              <Card style={{ padding: 14, borderColor: active ? g.color : colors.line, borderWidth: active ? 1.5 : 0.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: g.color }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifBold, fontSize: 17, color: colors.ink }}>{g.name}</Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 }}>{g.detail}</Text>
                  </View>
                  {active && <Chip tone="accent">Active</Chip>}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HealthKitStep({ granted, onGrant }: { granted: boolean; onGrant: () => void | Promise<void> }) {
  return (
    <View>
      <StepHeader
        eyebrow="Step 4 of 5"
        title="Let HealthKit fill in the rest."
        sub="Sleep, steps, and workouts go straight into the briefing. You can change this anytime."
      />
      <Card style={{ padding: 18 }}>
        <Text style={[type.body, { lineHeight: 21 }]}>
          Steward reads from HealthKit — never writes. Without it, you can still log everything manually.
        </Text>
        <Pressable
          onPress={onGrant}
          style={({ pressed }) => ({
            marginTop: 14,
            backgroundColor: granted ? colors.goodSoft : colors.accent,
            borderRadius: radii.pill,
            paddingVertical: 14,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: granted ? colors.good : colors.surface, fontFamily: fonts.sansBold, fontSize: 14 }}>
            {granted ? '✓ HealthKit ready' : 'Open HealthKit permissions'}
          </Text>
        </Pressable>
        <Text style={{ marginTop: 10, fontFamily: fonts.serifRegItalic, fontSize: 12.5, color: colors.muted }}>
          Real HealthKit reads require a custom dev build. The Mock adapter is in until then.
        </Text>
      </Card>
    </View>
  );
}

function ToneStep({ draft, patch }: { draft: Draft; patch: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  const tones: { id: CoachTone; name: string; sample: string }[] = [
    {
      id: 'warm-stewardship',
      name: 'Warm stewardship',
      sample: '"Sleep was rough — that\'s worth a slower start. The body is teaching you to listen."',
    },
    { id: 'plainspoken', name: 'Plainspoken', sample: '"Bad sleep. Lift lighter or walk. Nothing fancy today."' },
    { id: 'direct', name: 'Direct', sample: '"Three nights under six hours. Walk today. Lift tomorrow."' },
  ];
  return (
    <View>
      <StepHeader eyebrow="Step 5 of 5" title="How should the coach speak?" sub="Pick the voice that won't grate. You can change this anytime." />
      <View style={{ gap: 10 }}>
        {tones.map(t => {
          const active = draft.tone === t.id;
          return (
            <Pressable key={t.id} onPress={() => patch('tone', t.id)}>
              <Card style={{ padding: 14, borderColor: active ? colors.accent : colors.line, borderWidth: active ? 1.5 : 0.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ flex: 1, fontFamily: fonts.serifBold, fontSize: 17, color: colors.ink }}>{t.name}</Text>
                  {active && <Chip tone="accent">Pick</Chip>}
                </View>
                <Text
                  style={{
                    marginTop: 8,
                    fontFamily: fonts.serifRegItalic,
                    fontStyle: 'italic',
                    fontSize: 13.5,
                    color: colors.body,
                    lineHeight: 20,
                  }}
                >
                  {t.sample}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
