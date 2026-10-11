import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { completeHabit } from '@/lib/complete';
import { fmtTime, minutesOf } from '@/lib/time';
import type { Habit } from '@/lib/types';
import { useStore } from '@/state/store';

const CATEGORY = 'habit-reminder';
const CHANNEL = 'reminders';
const ACTION_SNOOZE = 'snooze';
const ACTION_DONE = 'done';
const HABIT_PREFIX = 'habit-';
const SNOOZE_MIN = 10;

// Expo Go on Android (SDK 53+) throws as soon as expo-notifications is imported, so the module is
// only loaded where it works. Reminders there need a development build; the rest of the app runs as-is.
const isAndroidExpoGo =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const supported = (Platform.OS === 'ios' || Platform.OS === 'android') && !isAndroidExpoGo;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications: typeof NotificationsModule = supported ? require('expo-notifications') : (null as never);

type ReminderData = { habitId?: string };

function habitIdOf(n: NotificationsModule.Notification) {
  return (n.request.content.data as ReminderData | undefined)?.habitId;
}

/** Registers the handler, Android channel and the Snooze / Mark done category. Returns a cleanup fn. */
export function setupNotifications() {
  if (!supported) return () => {};

  // While Dusk is foregrounded, reminders show as the in-app banner instead of the OS banner.
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      const id = habitIdOf(n);
      const s = useStore.getState();
      const pending = !!id && s.habits.some((h) => h.id === id);
      return {
        shouldShowBanner: false,
        shouldShowList: pending,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#9184d9',
    }).catch(() => {});
  }

  Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: ACTION_SNOOZE, buttonTitle: `Snooze ${SNOOZE_MIN} min`, options: { opensAppToForeground: false } },
    { identifier: ACTION_DONE, buttonTitle: 'Mark done', options: { opensAppToForeground: true } },
  ]).catch(() => {});

  const received = Notifications.addNotificationReceivedListener((n) => {
    const id = habitIdOf(n);
    const s = useStore.getState();
    const h = id ? s.habits.find((x) => x.id === id) : undefined;
    if (!h || s.leaving[h.id]) return;
    s.showBanner({ id: h.id, name: h.name, time: h.rem ? h.time : null });
  });

  const responded = Notifications.addNotificationResponseReceivedListener((r) => {
    const id = habitIdOf(r.notification);
    if (!id) return;
    if (r.actionIdentifier === ACTION_DONE) completeHabit(id);
    else if (r.actionIdentifier === ACTION_SNOOZE) {
      const h = useStore.getState().habits.find((x) => x.id === id);
      if (h) scheduleSnooze(h);
    }
  });

  return () => {
    received.remove();
    responded.remove();
  };
}

async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function content(h: Habit): NotificationsModule.NotificationContentInput {
  return {
    title: h.name,
    body: 'Dusk · Reminder',
    data: { habitId: h.id },
    categoryIdentifier: CATEGORY,
  };
}

/** Replaces every daily habit reminder with one per habit that has `rem` on. */
export async function syncReminders(habits: Habit[]) {
  if (!supported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(HABIT_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    const withReminder = habits.filter((h) => h.rem);
    if (!withReminder.length || !(await ensurePermission())) return;
    await Promise.all(
      withReminder.map((h) =>
        Notifications.scheduleNotificationAsync({
          identifier: HABIT_PREFIX + h.id,
          content: content(h),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: Math.floor(h.time / 60),
            minute: h.time % 60,
            channelId: CHANNEL,
          },
        }),
      ),
    );
  } catch (e) {
    console.warn('[dusk] could not schedule reminders', e);
  }
}

/** Schedules a one-off repeat of the reminder in 10 minutes and returns the label for the toast. */
export function scheduleSnooze(h: Habit) {
  const s = useStore.getState();
  const label = fmtTime(minutesOf(new Date()) + SNOOZE_MIN, s.settings.timeFormat);
  if (supported) {
    Notifications.scheduleNotificationAsync({
      identifier: `snooze-${h.id}`,
      content: content(h),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SNOOZE_MIN * 60,
        channelId: CHANNEL,
      },
    }).catch(() => {});
  }
  return label;
}

/** Stable key of everything that affects scheduled reminders. */
export function reminderSignature(habits: Habit[]) {
  return habits
    .filter((h) => h.rem)
    .map((h) => `${h.id}:${h.time}:${h.name}`)
    .sort()
    .join('|');
}
