import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { TopBar } from '../../components/TopBar';
import { Card } from '../../components/Card';
import { Label } from '../../components/Label';
import { useData } from '../../data/DataContext';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface RowDef {
  title: string;
  detail: string;
  kind: 'toggle' | 'chev';
  on?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

interface Group {
  title: string;
  rows: RowDef[];
}

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { profile, updateProfile, exportAll } = useData();
  const [busy, setBusy] = useState(false);

  if (!profile) return null;

  async function doExport() {
    setBusy(true);
    try {
      const data = await exportAll();
      const json = JSON.stringify(data, null, 2);
      const path =
        (FileSystem.cacheDirectory ?? FileSystem.documentDirectory) + `steward-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export memory' });
      } else {
        await Share.share({ message: json });
      }
    } catch (e: unknown) {
      Alert.alert("Export didn't go", e instanceof Error ? e.message : 'unknown');
    } finally {
      setBusy(false);
    }
  }

  const groups: Group[] = [
    {
      title: 'Integrations',
      rows: [
        {
          title: 'HealthKit',
          detail: 'Sleep, steps, workouts',
          kind: 'toggle',
          on: true,
        },
        { title: 'Garmin', detail: 'Coming in v0.2', kind: 'toggle', on: false, disabled: true },
        {
          title: 'Watch widget',
          detail: "Today's rings on the wrist · preview",
          kind: 'chev',
          onPress: () => nav.navigate('WatchPreview'),
        },
      ],
    },
    {
      title: 'Coach',
      rows: [
        { title: 'Active goal', detail: goalLabel(profile.activeGoal), kind: 'chev', onPress: () => nav.navigate('GoalSwitcher') },
        { title: 'Tone', detail: 'Warm · honest · stewardship', kind: 'chev' },
        {
          title: 'Morning briefing',
          detail: profile.notifications.enabled
            ? `Daily · ${profile.notifications.morningBriefingTime}`
            : 'Off',
          kind: 'toggle',
          on: profile.notifications.enabled,
          onPress: () =>
            updateProfile({
              notifications: {
                ...profile.notifications,
                enabled: !profile.notifications.enabled,
              },
            }),
        },
        { title: 'Pattern threshold', detail: '3 mentions before flagging', kind: 'chev' },
      ],
    },
    {
      title: 'Quick entry',
      rows: [
        {
          title: 'Recovery check-in',
          detail: 'Sleep, soreness, mood — manual',
          kind: 'chev',
          onPress: () => nav.navigate('QuickEntry', { kind: 'recovery' }),
        },
        {
          title: 'InBody scan',
          detail: 'Weight, body fat, skeletal muscle mass',
          kind: 'chev',
          onPress: () => nav.navigate('QuickEntry', { kind: 'inbody' }),
        },
      ],
    },
    {
      title: 'Constraints',
      rows: profile.constraints.map(c => ({
        title: c.split('—')[0]?.trim() ?? c,
        detail: c.split('—').slice(1).join('—').trim() || 'Hard constraint',
        kind: 'chev',
        onPress: () =>
          Alert.alert('Remove constraint?', `The coach will stop treating "${c}" as a hard line.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () =>
                updateProfile({
                  constraints: profile.constraints.filter(x => x !== c),
                }),
            },
          ]),
      })),
    },
    {
      title: 'Data',
      rows: [
        { title: 'Export memory', detail: busy ? 'Exporting…' : 'JSON · downloadable', kind: 'chev', onPress: doExport },
        { title: 'Sync to Notion', detail: 'Not connected', kind: 'chev' },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Profile." sub={`${profile.name} · ${profile.age} · ${profile.location}`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 18 }}>
        {groups.map(g => (
          <Group key={g.title} g={g} />
        ))}
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.muted,
            textAlign: 'center',
            letterSpacing: 1.2,
            marginTop: 8,
          }}
        >
          STEWARD · v0.1 · LOCAL ONLY
        </Text>
      </ScrollView>
    </View>
  );
}

function Group({ g }: { g: Group }) {
  return (
    <View>
      <Label style={{ marginBottom: 8, paddingLeft: 4 }}>{g.title}</Label>
      <Card style={{ overflow: 'hidden' }}>
        {g.rows.map((row, i) => (
          <Row key={i} row={row} last={i === g.rows.length - 1} />
        ))}
      </Card>
    </View>
  );
}

function Row({ row, last }: { row: RowDef; last: boolean }) {
  return (
    <Pressable
      onPress={row.disabled ? undefined : row.onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: colors.line,
        opacity: row.disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 14.5, color: colors.ink }}>{row.title}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 }}>{row.detail}</Text>
      </View>
      {row.kind === 'toggle' ? (
        <View
          style={{
            width: 38,
            height: 22,
            borderRadius: 999,
            backgroundColor: row.on ? colors.accent : colors.surfaceAlt,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: '#fff',
              position: 'absolute',
              top: 2,
              left: row.on ? 18 : 2,
              shadowOpacity: 0.18,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              shadowColor: '#000',
              elevation: 1,
            }}
          />
        </View>
      ) : (
        <Svg width={8} height={12} viewBox="0 0 8 12">
          <Path d="M1 1l5 5-5 5" stroke={colors.muted} fill="none" strokeWidth={1.5} />
        </Svg>
      )}
    </Pressable>
  );
}

function goalLabel(g: string) {
  switch (g) {
    case 'muscle':
      return 'Build muscle';
    case 'ride':
      return '50-mile ride';
    case 'recover':
      return 'Recover well';
    default:
      return g;
  }
}
