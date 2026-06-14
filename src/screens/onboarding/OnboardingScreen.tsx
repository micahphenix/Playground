import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, fonts, radii, type } from '../../theme';
import { CoachMark } from '../../components/CoachMark';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { Chip } from '../../components/Chip';
import { useData } from '../../data/DataContext';
import { HealthKit } from '../../health/HealthKit';
import { defaultProfile } from '../../data/seed';
import { TRACKING_PLANS } from '../../data/trackingPlans';
import type { CoachTone, GoalId, Profile } from '../../data/types';

const GOAL_COLOR = {
  accent: colors.accent,
  accentAlt: colors.accentAlt,
  muted: colors.muted,
  good: colors.good,
  warn: colors.warn,
} as const;

// 5-step setup that writes real values into the Profile before
// completeOnboarding() seeds the rest.

interface Draft {
  name: string;
  age: string;
  city: string;
  state: string;
  constraints: string[];
  // Ordered — the first is the primary goal (drives the rings).
  selectedGoals: GoalId[];
  rideTargetDate: string | null;
  eventLabel: string;
  healthKitGranted: boolean;
  tone: CoachTone;
}

const SUGGESTED_CONSTRAINTS = [
  'Knee replacement — no loaded squats yet',
  'GERD / acid reflux — no heavy late meals',
  'Lower back sensitivity',
  'Shoulder mobility limits',
  'Recent injury still healing',
  'High blood pressure',
  'Diabetes / blood-sugar management',
  'Insomnia / poor sleep',
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

function splitLocation(loc: string): { city: string; state: string } {
  const parts = loc.split(',').map(s => s.trim());
  return { city: parts[0] ?? '', state: (parts[1] ?? '').toUpperCase() };
}

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, updateProfile } = useData();
  const [step, setStep] = useState(0);
  const defaults = defaultProfile();
  const defaultLoc = splitLocation(defaults.location);
  const [draft, setDraft] = useState<Draft>({
    name: defaults.name,
    age: String(defaults.age),
    city: defaultLoc.city,
    state: defaultLoc.state,
    constraints: defaults.constraints,
    selectedGoals: [defaults.activeGoal, ...defaults.secondaryGoals],
    rideTargetDate: defaults.rideTargetDate,
    eventLabel: defaults.eventLabel ?? '',
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
    const location = [draft.city.trim(), draft.state].filter(Boolean).join(', ');
    const goals = draft.selectedGoals.length ? draft.selectedGoals : [defaults.activeGoal];
    const hasRide = goals.includes('ride');
    const patchObj: Partial<Profile> = {
      name: draft.name.trim() || defaults.name,
      age: Number(draft.age) || defaults.age,
      location: location || defaults.location,
      constraints: draft.constraints,
      activeGoal: goals[0],
      secondaryGoals: goals.slice(1),
      rideTargetDate: hasRide ? draft.rideTargetDate : null,
      eventLabel: hasRide ? draft.eventLabel.trim() || null : null,
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
        label="City"
        value={draft.city}
        onChangeText={t => patch('city', t)}
        placeholder="Euless"
      />
      <StateSelect value={draft.state} onChange={s => patch('state', s)} />
    </View>
  );
}

function StateSelect({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 10 }}>
      <Label>State</Label>
      <Pressable
        onPress={() => setOpen(o => !o)}
        style={{
          marginTop: 6,
          padding: 14,
          backgroundColor: colors.surface,
          borderRadius: radii.sm,
          borderWidth: 0.5,
          borderColor: open ? colors.lineStrong : colors.line,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: value ? colors.ink : colors.muted }}>
          {value || 'Select state'}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <Card style={{ marginTop: 6, maxHeight: 220, overflow: 'hidden' }}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {US_STATES.map(s => {
              const sel = s === value;
              return (
                <Pressable
                  key={s}
                  onPress={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: sel ? colors.accentSoft : pressed ? colors.surfaceAlt : 'transparent',
                  })}
                >
                  <Text style={{ fontFamily: fonts.serif, fontSize: 15, color: sel ? colors.accent : colors.ink }}>
                    {sel ? '✓ ' : ''}
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>
      )}
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
  const [custom, setCustom] = useState('');
  // Constraints the user typed that aren't in the suggested list.
  const customConstraints = draft.constraints.filter(c => !SUGGESTED_CONSTRAINTS.includes(c));

  function addCustom() {
    const v = custom.trim();
    if (!v || draft.constraints.includes(v)) {
      setCustom('');
      return;
    }
    toggle(v);
    setCustom('');
  }

  return (
    <View>
      <StepHeader
        eyebrow="Step 2 of 5"
        title="Any constraints I should know about?"
        sub="Anything we should accommodate in your training regimen. The coach treats these as hard lines."
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

        {/* Custom (Other) constraints the user has added */}
        {customConstraints.map(label => (
          <Pressable
            key={label}
            onPress={() => toggle(label)}
            style={{
              padding: 14,
              borderRadius: radii.sm,
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ flex: 1, fontFamily: fonts.serif, fontSize: 15, color: colors.accent }}>
              ✓ {label}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted }}>Remove</Text>
          </Pressable>
        ))}
      </View>

      {/* Other — free entry */}
      <Label style={{ marginTop: 16 }}>Other</Label>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          placeholder="Something specific to you…"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          style={{
            flex: 1,
            padding: 14,
            backgroundColor: colors.surface,
            borderRadius: radii.sm,
            borderWidth: 0.5,
            borderColor: colors.line,
            fontFamily: fonts.serif,
            fontSize: 15,
            color: colors.ink,
          }}
        />
        <Pressable
          onPress={addCustom}
          disabled={!custom.trim()}
          style={({ pressed }) => ({
            paddingHorizontal: 18,
            borderRadius: radii.sm,
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: custom.trim() ? (pressed ? 0.9 : 1) : 0.4,
          })}
        >
          <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 14 }}>Add</Text>
        </Pressable>
      </View>

      <Text style={{ marginTop: 14, fontFamily: fonts.serifRegItalic, fontSize: 13, color: colors.muted }}>
        You can add more anytime by mentioning them in chat ("tweaked my calf today").
      </Text>
    </View>
  );
}

function GoalStep({ draft, patch }: { draft: Draft; patch: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  const goals: { id: GoalId; name: string; detail: string; color: string }[] = Object.values(
    TRACKING_PLANS,
  ).map(p => ({ id: p.goalId, name: p.name, detail: p.detail, color: GOAL_COLOR[p.colorKey] }));
  const [picking, setPicking] = useState(false);

  function toggleGoal(id: GoalId) {
    const sel = draft.selectedGoals;
    patch('selectedGoals', sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  }

  function onPickDate(_: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setPicking(false);
    if (!date) return;
    patch('rideTargetDate', date.toISOString().slice(0, 10));
  }

  return (
    <View>
      <StepHeader
        eyebrow="Step 3 of 5"
        title="What brought you here?"
        sub="What goals or health adjustments are you after? Pick one or more — the first is your primary and drives your rings."
      />
      <View style={{ gap: 10 }}>
        {goals.map(g => {
          const selected = draft.selectedGoals.includes(g.id);
          const isPrimary = draft.selectedGoals[0] === g.id;
          return (
            <Pressable key={g.id} onPress={() => toggleGoal(g.id)}>
              <Card style={{ padding: 14, borderColor: selected ? g.color : colors.line, borderWidth: selected ? 1.5 : 0.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: selected ? g.color : 'transparent',
                      borderWidth: selected ? 0 : 1,
                      borderColor: colors.lineStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected && <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 12 }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifBold, fontSize: 17, color: colors.ink }}>{g.name}</Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 }}>{g.detail}</Text>
                  </View>
                  {isPrimary ? (
                    <Chip tone="accent">Primary</Chip>
                  ) : selected ? (
                    <Chip>Tracking</Chip>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
      {draft.selectedGoals.includes('ride') && (
        <Card style={{ padding: 14, marginTop: 10, backgroundColor: colors.accentAltSoft }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.accentAlt, letterSpacing: 0.8 }}>
            NAME IT & PIN THE DATE
          </Text>
          <TextInput
            value={draft.eventLabel}
            onChangeText={t => patch('eventLabel', t)}
            placeholder="Event — e.g. Chicago Marathon, 50-mile ride"
            placeholderTextColor={colors.muted}
            style={{
              marginTop: 8,
              padding: 12,
              backgroundColor: colors.surface,
              borderRadius: radii.sm,
              borderWidth: 0.5,
              borderColor: colors.line,
              fontFamily: fonts.serif,
              fontSize: 15,
              color: colors.ink,
            }}
          />
          <Text style={{ fontFamily: fonts.serif, fontSize: 15.5, color: colors.ink, marginTop: 10, lineHeight: 22 }}>
            {draft.rideTargetDate
              ? `${draft.eventLabel.trim() || 'Event'} on ${formatDate(draft.rideTargetDate)} · ${daysUntil(draft.rideTargetDate)} days out.`
              : 'A date locks in the ramp, peak week, and taper. You can change it anytime.'}
          </Text>
          <Pressable
            onPress={() => setPicking(true)}
            style={({ pressed }) => ({
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              alignSelf: 'flex-start',
              backgroundColor: colors.accentAlt,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 13 }}>
              {draft.rideTargetDate ? 'Change date' : 'Pick a date'}
            </Text>
          </Pressable>
          {picking && (
            <View style={{ marginTop: 12 }}>
              <DateTimePicker
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                value={draft.rideTargetDate ? new Date(draft.rideTargetDate) : eightWeeksOut()}
                minimumDate={new Date()}
                onChange={onPickDate}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setPicking(false)}
                  style={({ pressed }) => ({
                    alignSelf: 'flex-end',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: colors.ink,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <Text style={{ color: colors.surface, fontFamily: fonts.sansBold, fontSize: 12 }}>Done</Text>
                </Pressable>
              )}
            </View>
          )}
        </Card>
      )}
    </View>
  );
}

function eightWeeksOut() {
  const d = new Date();
  d.setDate(d.getDate() + 56);
  return d;
}
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 86_400_000));
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
