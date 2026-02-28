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
  /** Number of answer options shown per question (4 | 6 | 8). Default: 6. */
  optionsCount: 'optionsCount',
  /** Quiz direction: 'en-ua' (default) or 'ua-en' (reverse). */
  quizDirection: 'quizDirection',
  /** Days of week for reminders (JSON array of 0–6). Empty = all days. */
  reminderDays: 'reminderDays',
  /** Array of scheduled notification IDs (JSON). Replaces scheduledNotificationId. */
  scheduledNotificationIds: 'scheduledNotificationIds',
  /** UI language ('uk' | 'en' | 'es' | 'de'). Detected from system on first launch. */
  appLanguage: 'appLanguage',
  /** Language being learned ('en' | 'es' | 'de'). Default: 'en'. */
  targetLanguage: 'targetLanguage',
  /** Words the user has marked as already known (JSON array of "lang:target" strings). */
  knownWords: 'knownWords',
  /** ID of the signed-in user. Absent = guest. */
  userId: 'userId',
  /** Cached user profile JSON (AuthUser). Updated on sign-in. */
  userProfile: 'userProfile',
} as const;
