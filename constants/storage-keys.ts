export const STORAGE_KEYS = {
  hasSeenOnboarding: 'hasSeenOnboarding',
  dailyGoal: 'dailyGoal',
  themeMode: 'themeMode',
  /** All-time + daily stats stored as a single JSON blob (v2). */
  stats: 'v2_stats',
  /** Active word category filter ('verb' | 'noun' | 'adjective' | 'adverb'). Absent = all words. */
  wordCategory: 'wordCategory',
  /** Whether the quiz auto-advances after an answer ('true' | 'false'). Default: true. */
  autoAdvance: 'autoAdvance',
  /** ISO date ('YYYY-MM-DD') of the last day the celebration modal was shown. */
  celebrationShownDate: 'celebrationShownDate',
  /** Whether word pronunciation is enabled ('true' | 'false'). Default: true. */
  soundEnabled: 'soundEnabled',
  /** Whether daily reminders are enabled ('true' | 'false'). Default: false. */
  reminderEnabled: 'reminderEnabled',
  /** Time of day for daily reminder in 'HH:MM' format, e.g. '09:00'. */
  reminderTime: 'reminderTime',
  /** ISO date ('YYYY-MM-DD') of the last day a reminder banner was shown. Prevents repeat shows. */
  lastReminderDate: 'lastReminderDate',
  /** ISO timestamp until which the reminder is snoozed. Null/absent = not snoozed. */
  reminderSnoozedUntil: 'reminderSnoozedUntil',
  /** expo-notifications identifier for the scheduled daily push notification. */
  scheduledNotificationId: 'scheduledNotificationId',
  /** Per-day answer counts: JSON blob of Record<'YYYY-MM-DD', number>. */
  dailyHistory: 'v2_dailyHistory',
} as const;
