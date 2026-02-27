import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

export const REMINDER_TIME_PRESETS = [
  { label: 'Ранок', value: '09:00' },
  { label: 'День', value: '14:00' },
  { label: 'Вечір', value: '20:00' },
] as const;

export type ReminderTimePreset = (typeof REMINDER_TIME_PRESETS)[number]['value'];

interface ReminderSettings {
  reminderEnabled: boolean;
  reminderTime: ReminderTimePreset;
  lastReminderDate: string;
  snoozedUntil: string | null;
  isLoaded: boolean;
  setReminderEnabled: (val: boolean) => Promise<void>;
  setReminderTime: (time: ReminderTimePreset) => Promise<void>;
  /** Mark reminder as shown today so it won't repeat until tomorrow. */
  dismissForToday: () => Promise<void>;
  /** Snooze the reminder for the given number of hours. */
  snooze: (hours: number) => Promise<void>;
}

/** Returns local date as 'YYYY-MM-DD'. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useReminderSettings(): ReminderSettings {
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderTime, setReminderTimeState] = useState<ReminderTimePreset>('09:00');
  const [lastReminderDate, setLastReminderDate] = useState('');
  const [snoozedUntil, setSnoozedUntilState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([
      STORAGE_KEYS.reminderEnabled,
      STORAGE_KEYS.reminderTime,
      STORAGE_KEYS.lastReminderDate,
      STORAGE_KEYS.reminderSnoozedUntil,
    ])
      .then((entries) => {
        const get = (key: string) => entries.find(([k]) => k === key)?.[1] ?? null;

        const enabled = get(STORAGE_KEYS.reminderEnabled);
        const time = get(STORAGE_KEYS.reminderTime) as ReminderTimePreset | null;
        const lastDate = get(STORAGE_KEYS.lastReminderDate);
        const snoozed = get(STORAGE_KEYS.reminderSnoozedUntil);

        if (enabled !== null) setReminderEnabledState(enabled === 'true');
        if (time && REMINDER_TIME_PRESETS.some((p) => p.value === time)) {
          setReminderTimeState(time);
        }
        if (lastDate) setLastReminderDate(lastDate);
        if (snoozed) setSnoozedUntilState(snoozed);
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const setReminderEnabled = useCallback(async (val: boolean) => {
    setReminderEnabledState(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.reminderEnabled, String(val));
    } catch (e) {
      console.warn('[reminders] failed to persist reminderEnabled', e);
    }
  }, []);

  const setReminderTime = useCallback(async (time: ReminderTimePreset) => {
    setReminderTimeState(time);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.reminderTime, time);
    } catch (e) {
      console.warn('[reminders] failed to persist reminderTime', e);
    }
  }, []);

  const dismissForToday = useCallback(async () => {
    const today = todayISO();
    setLastReminderDate(today);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.lastReminderDate, today);
    } catch (e) {
      console.warn('[reminders] failed to persist lastReminderDate', e);
    }
  }, []);

  const snooze = useCallback(async (hours: number) => {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setSnoozedUntilState(until);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.reminderSnoozedUntil, until);
    } catch (e) {
      console.warn('[reminders] failed to persist snoozedUntil', e);
    }
  }, []);

  return {
    reminderEnabled,
    reminderTime,
    lastReminderDate,
    snoozedUntil,
    isLoaded,
    setReminderEnabled,
    setReminderTime,
    dismissForToday,
    snooze,
  };
}
