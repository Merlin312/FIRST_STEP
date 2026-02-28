import type { AppStrings } from './uk';

/** All UI strings in English. */
export const en: AppStrings = {
  // ─── DrawerPanel ────────────────────────────────────────────────────────────
  guestMode: 'Guest mode',
  closeMenu: 'Close menu',
  privacyPolicy: 'Privacy policy',

  // ─── StatsSection ───────────────────────────────────────────────────────────
  stats: 'STATISTICS',
  activityChart: 'Activity this month',
  goalReached: 'Goal!',
  wordsToday: (n: number) => `${n} words today`,
  wordsTodayLabel: 'words today',
  bestStreakLabel: (n: number) => `Record: ${n} d.`,
  streakDays: (n: number) => (n === 1 ? 'day' : 'days'),
  accuracy: 'Accuracy',
  allTime: 'all time',
  totalAnswered: 'Total',
  totalWrong: 'Errors',
  dayLabels: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],

  // ─── SettingsSection ────────────────────────────────────────────────────────
  settings: 'SETTINGS',
  // Theme card
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  // Language card
  interfaceLanguage: 'Interface language',
  langUk: 'Українська',
  langEn: 'English',
  langEs: 'Spanish',
  langDe: 'German',
  // Quiz card
  quiz: 'Quiz',
  dailyGoal: 'Daily goal',
  answersCount: 'Answer options',
  learningLanguage: 'Learning language',
  quizDirection: 'Quiz direction',
  wordCategory: 'Word category',
  catAll: 'All',
  catVerb: 'Verbs',
  catNoun: 'Nouns',
  catAdj: 'Adj.',
  catAdv: 'Adv.',
  autoAdvance: 'Auto-advance',
  // Streak card
  streak: 'Streak',
  correctOnly: 'Correct only',
  // Reminders card
  reminders: 'Reminders',
  dailyReminder: 'Daily reminder',
  reminderTime: 'Reminder time',
  reminderDays: 'Days of week',
  reminderDayLabels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  // Tutorial / Reset
  viewAllWords: 'View all words',
  viewTutorial: 'View tutorial',
  resetStats: 'Reset statistics',
  // Reset dialog
  resetDialogTitle: 'Reset statistics',
  resetDialogMessage: 'All progress will be deleted. Continue?',
  resetDialogConfirm: 'Reset',
  resetDialogCancel: 'Cancel',
  // Accessibility
  themeA11y: (label: string) => `Theme: ${label}`,
  langA11y: (label: string) => `Language: ${label}`,
  goalA11y: (n: number) => `Goal: ${n} words per day`,
  optionsA11y: (n: number) => `${n} answer options`,
  dirA11y: (label: string) => `Direction: ${label}`,
  catA11y: (label: string) => `Category: ${label}`,
  reminderTimeA11y: (t: string) => `Reminder time: ${t}`,
  reminderDayA11y: (label: string, active: boolean) =>
    `${label}: ${active ? 'enabled' : 'disabled'}`,

  // ─── Word list screen (words.tsx) ───────────────────────────────────────────
  wordsScreenTitle: 'Words',
  wordsKnownCount: (known: number, total: number) => `Known: ${known} / ${total}`,
  wordsSearchPlaceholder: 'Search...',
  wordsMarkKnown: 'Mark as known',
  wordsMarkUnknown: 'Remove mark',
  wordsAllKnownEmpty: 'All words are marked as known.\nRemove a mark to continue learning.',

  // ─── Home screen (index.tsx) ─────────────────────────────────────────────────
  openMenu: 'Open menu',
  dailyGoalLabel: 'Daily goal',
  progressA11y: (today: number, goal: number) => `Daily progress: ${today} of ${goal} words`,
  noWords: 'No words found',
  pronounceA11y: (word: string) => `Pronounce word ${word}`,
  soundOff: 'Turn off sound',
  soundOn: 'Turn on sound',
  showHint: 'Show hint',
  skipWord: 'Skip word',
  nextWord: 'Next word',
  nextWordBtn: 'Next →',

  // ─── ReminderBanner ─────────────────────────────────────────────────────────
  snoozeLater: 'Later',
  snoozeA11y: 'Snooze reminder for 2 hours',
  dismissA11y: 'Dismiss reminder',
  reminderMilestone: (streak: number) =>
    `Congrats! ${streak} days in a row — you're a true hero! Keep it up!`,
  reminderAtRisk: (streak: number) =>
    `Your ${streak}-day streak is at risk! Answer questions to keep it alive.`,
  reminderIncomplete: (goal: number) =>
    `Daily goal not reached yet! A little more — up to ${goal} words.`,
};
