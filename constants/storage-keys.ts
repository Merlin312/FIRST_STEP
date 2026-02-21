export const STORAGE_KEYS = {
  hasSeenOnboarding: 'hasSeenOnboarding',
  dailyGoal: 'dailyGoal',
  themeMode: 'themeMode',
  /** All-time + daily stats stored as a single JSON blob (v2). */
  stats: 'v2_stats',
} as const;
