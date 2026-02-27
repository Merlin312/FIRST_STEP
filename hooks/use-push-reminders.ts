import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { ReminderDays } from './use-reminder-settings';

// Lazy require so the module initialiser (push-token auto-registration) does
// not run at import time — avoids Expo Go "push not supported" errors.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getN = () => require('expo-notifications') as typeof import('expo-notifications');

const NOTIFICATION_MESSAGES = [
  'Час практикуватись! Один раунд — і мова стає ближчою.',
  'Твої слова чекають! Декілька хвилин щодня роблять диво.',
  'Не забудь про англійську сьогодні — маленький крок, великий результат.',
  'Продовжуй серію! Відкрий додаток і відповідай на питання.',
  'Щоденна практика — ключ до успіху. Вперед!',
];

/** Returns a random motivational notification body. */
function getRandomMessage(): string {
  return NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
}

/** Parses 'HH:MM' into { hour, minute }. */
function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

/**
 * Hook for managing expo-notifications local push scheduling.
 * Call `scheduleDaily` when reminders are enabled or time/days change.
 * Call `cancelScheduled` when reminders are disabled.
 */
export function usePushReminders() {
  /** Request notification permissions. Returns true if granted. */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const N = getN();
      const { status: existing } = await N.getPermissionsAsync();
      if (existing === 'granted') return true;
      const { status } = await N.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }, []);

  /**
   * Cancel all previously scheduled notifications.
   * Handles both legacy single-ID key and new multi-ID key.
   */
  const cancelScheduled = useCallback(async (): Promise<void> => {
    try {
      const N = getN();
      // Legacy: single notification ID
      const legacyId = await AsyncStorage.getItem(STORAGE_KEYS.scheduledNotificationId);
      if (legacyId) {
        await N.cancelScheduledNotificationAsync(legacyId).catch(() => {});
        await AsyncStorage.removeItem(STORAGE_KEYS.scheduledNotificationId);
      }
      // New: array of notification IDs
      const idsRaw = await AsyncStorage.getItem(STORAGE_KEYS.scheduledNotificationIds);
      if (idsRaw) {
        const ids: string[] = JSON.parse(idsRaw);
        for (const id of ids) {
          await N.cancelScheduledNotificationAsync(id).catch(() => {});
        }
        await AsyncStorage.removeItem(STORAGE_KEYS.scheduledNotificationIds);
      }
    } catch (e) {
      console.warn('[push-reminders] cancelScheduled error', e);
    }
  }, []);

  /**
   * Schedule repeating notifications at the given time.
   * When days is empty or all 7 days — uses a single DAILY trigger.
   * When specific days selected — schedules one WEEKLY trigger per day.
   * Cancels any existing schedule first.
   *
   * Note: expo-notifications weekday is 1-based where 1=Sunday (unlike JS Date.getDay()).
   */
  const scheduleDaily = useCallback(
    async (time: string, days: ReminderDays = []): Promise<void> => {
      if (Platform.OS === 'web') return;
      try {
        await cancelScheduled();
        const N = getN();
        const { hour, minute } = parseTime(time);
        const ids: string[] = [];

        const useDaily = days.length === 0 || days.length === 7;

        if (useDaily) {
          const id = await N.scheduleNotificationAsync({
            content: { title: 'First Step 📚', body: getRandomMessage(), sound: true },
            trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
          });
          ids.push(id);
        } else {
          for (const day of days) {
            const id = await N.scheduleNotificationAsync({
              content: { title: 'First Step 📚', body: getRandomMessage(), sound: true },
              trigger: {
                type: N.SchedulableTriggerInputTypes.WEEKLY,
                weekday: day + 1, // expo-notifications: 1=Sun, 2=Mon … 7=Sat
                hour,
                minute,
              },
            });
            ids.push(id);
          }
        }

        await AsyncStorage.setItem(STORAGE_KEYS.scheduledNotificationIds, JSON.stringify(ids));
      } catch (e) {
        console.warn('[push-reminders] scheduleDaily error', e);
      }
    },
    [cancelScheduled],
  );

  return { requestPermissions, scheduleDaily, cancelScheduled };
}
