import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

/** Array of weekday numbers (0=Sun, 1=Mon … 6=Sat). Empty = all days. */
export type ReminderDays = number[];

/** HH:MM time string for reminder scheduling. */
export type ReminderTimePreset = string;

interface ReminderSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: ReminderDays;
  lastReminderDate: string;
  snoozedUntil: string | null;
  isLoaded: boolean;
  setReminderEnabled: (val: boolean) => Promise<void>;
  setReminderTime: (time: string) => Promise<void>;
  setReminderDays: (days: ReminderDays) => Promise<void>;
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
  const [reminderTime, setReminderTimeState] = useState<string>('09:00');
  const [reminderDays, setReminderDaysState] = useState<ReminderDays>([]);
  const [lastReminderDate, setLastReminderDate] = useState('');
  const [snoozedUntil, setSnoozedUntilState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([
      STORAGE_KEYS.reminderEnabled,
      STORAGE_KEYS.reminderTime,
      STORAGE_KEYS.reminderDays,
      STORAGE_KEYS.lastReminderDate,
      STORAGE_KEYS.reminderSnoozedUntil,
    ])
      .then((entries) => {
        const get = (key: string) => entries.find(([k]) => k === key)?.[1] ?? null;

        const enabled = get(STORAGE_KEYS.reminderEnabled);
        const time = get(STORAGE_KEYS.reminderTime);
        const daysRaw = get(STORAGE_KEYS.reminderDays);
        const lastDate = get(STORAGE_KEYS.lastReminderDate);
        const snoozed = get(STORAGE_KEYS.reminderSnoozedUntil);

        if (enabled !== null) setReminderEnabledState(enabled === 'true');
        if (time && /^\d{1,2}:\d{2}$/.test(time)) setReminderTimeState(time);
        if (daysRaw) {
          try {
            const parsed = JSON.parse(daysRaw) as number[];
            if (Array.isArray(parsed)) setReminderDaysState(parsed);
          } catch {
            /* ignore */
          }
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

  const setReminderTime = useCallback(async (time: string) => {
    setReminderTimeState(time);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.reminderTime, time);
    } catch (e) {
      console.warn('[reminders] failed to persist reminderTime', e);
    }
  }, []);

  const setReminderDays = useCallback(async (days: ReminderDays) => {
    setReminderDaysState(days);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.reminderDays, JSON.stringify(days));
    } catch (e) {
      console.warn('[reminders] failed to persist reminderDays', e);
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
    reminderDays,
    lastReminderDate,
    snoozedUntil,
    isLoaded,
    setReminderEnabled,
    setReminderTime,
    setReminderDays,
    dismissForToday,
    snooze,
  };
}
