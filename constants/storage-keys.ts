export const STORAGE_KEYS = {
  hasSeenOnboarding: 'hasSeenOnboarding',
  dailyGoal: 'dailyGoal',
  dailyCount: (date: string) => `dailyCount_${date}`,
  themeMode: 'themeMode',
  statsTotal: 'statsTotal',
  statsCorrect: 'statsCorrect',
  statsWrong: 'statsWrong',
  statsStreak: 'statsStreak',
  statsLastDate: 'statsLastDate',
} as const;
