import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { ReminderTimePreset } from './use-reminder-settings';

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
function parseTime(time: ReminderTimePreset): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

/**
 * Hook for managing expo-notifications local push scheduling.
 * Call `scheduleDaily` when reminders are enabled or time changes.
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

  /** Cancel any previously scheduled daily notification. */
  const cancelScheduled = useCallback(async (): Promise<void> => {
    try {
      const id = await AsyncStorage.getItem(STORAGE_KEYS.scheduledNotificationId);
      if (id) {
        await getN().cancelScheduledNotificationAsync(id);
        await AsyncStorage.removeItem(STORAGE_KEYS.scheduledNotificationId);
      }
    } catch (e) {
      console.warn('[push-reminders] cancelScheduled error', e);
    }
  }, []);

  /**
   * Schedule a repeating daily notification at the given time.
   * Cancels any existing schedule first.
   */
  const scheduleDaily = useCallback(
    async (time: ReminderTimePreset): Promise<void> => {
      if (Platform.OS === 'web') return;
      try {
        await cancelScheduled();
        const N = getN();
        const { hour, minute } = parseTime(time);
        const id = await N.scheduleNotificationAsync({
          content: {
            title: 'First Step 📚',
            body: getRandomMessage(),
            sound: true,
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
        await AsyncStorage.setItem(STORAGE_KEYS.scheduledNotificationId, id);
      } catch (e) {
        console.warn('[push-reminders] scheduleDaily error', e);
      }
    },
    [cancelScheduled],
  );

  return { requestPermissions, scheduleDaily, cancelScheduled };
}
