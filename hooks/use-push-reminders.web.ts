import type { ReminderTimePreset } from './use-reminder-settings';

/**
 * Web stub for usePushReminders.
 * expo-notifications has no web support — Metro picks this file (.web.ts)
 * over use-push-reminders.ts when bundling for web.
 */
export function usePushReminders() {
  return {
    requestPermissions: async (): Promise<boolean> => false,
    scheduleDaily: async (_time: ReminderTimePreset): Promise<void> => {},
    cancelScheduled: async (): Promise<void> => {},
  };
}
