import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Schedules a daily local notification for the morning briefing. The
// notification deep-links the user back to Today; the briefing itself is
// generated on-device by the LLM when the user opens the app (or, later, by a
// background task that runs the EOD review overnight).

const MORNING_ID = 'steward.morning-briefing';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

interface Schedule {
  hour: number;
  minute: number;
}

function parseTime(hhmm: string): Schedule {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  return { hour: Number.isFinite(h) ? h : 7, minute: Number.isFinite(m) ? m : 30 };
}

export async function scheduleMorningBriefing(hhmm: string, enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  // Always clear the previous schedule first so the time stays in sync.
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter(n => n.identifier === MORNING_ID || n.content.data?.kind === MORNING_ID)
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (!enabled) return;
  const ok = await ensureNotificationPermissions();
  if (!ok) return;
  const { hour, minute } = parseTime(hhmm);
  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_ID,
    content: {
      title: 'Morning briefing',
      body: 'Sleep, training, and what to weigh today.',
      data: { kind: MORNING_ID },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
