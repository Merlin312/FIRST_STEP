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
} as const;
