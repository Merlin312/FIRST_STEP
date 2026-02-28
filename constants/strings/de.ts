import type { AppStrings } from './uk';

/** All UI strings in German. */
export const de: AppStrings = {
  // ─── DrawerPanel ────────────────────────────────────────────────────────────
  guestMode: 'Gastmodus',
  closeMenu: 'Menü schließen',
  privacyPolicy: 'Datenschutzrichtlinie',

  // ─── StatsSection ───────────────────────────────────────────────────────────
  stats: 'STATISTIKEN',
  activityChart: 'Aktivität diesen Monat',
  goalReached: 'Ziel!',
  wordsToday: (n: number) => `${n} Wörter heute`,
  wordsTodayLabel: 'Wörter heute',
  bestStreakLabel: (n: number) => `Rekord: ${n} T.`,
  streakDays: (n: number) => (n === 1 ? 'Tag' : 'Tage'),
  accuracy: 'Genauigkeit',
  allTime: 'gesamt',
  totalAnswered: 'Gesamt',
  totalWrong: 'Fehler',
  dayLabels: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],

  // ─── SettingsSection ────────────────────────────────────────────────────────
  settings: 'EINSTELLUNGEN',
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  interfaceLanguage: 'Oberflächensprache',
  langUk: 'Українська',
  langEn: 'English',
  langEs: 'Español',
  langDe: 'Deutsch',
  learningLanguage: 'Lernsprache',
  quiz: 'Quiz',
  dailyGoal: 'Tagesziel',
  answersCount: 'Antwortmöglichkeiten',
  quizDirection: 'Quiz-Richtung',
  wordCategory: 'Wortkategorie',
  catAll: 'Alle',
  catVerb: 'Verben',
  catNoun: 'Subst.',
  catAdj: 'Adj.',
  catAdv: 'Adv.',
  autoAdvance: 'Automatisch weiter',
  streak: 'Serie',
  correctOnly: 'Nur richtige',
  reminders: 'Erinnerungen',
  dailyReminder: 'Tägliche Erinnerung',
  reminderTime: 'Erinnerungszeit',
  reminderDays: 'Wochentage',
  reminderDayLabels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  viewAllWords: 'Alle Wörter ansehen',
  viewTutorial: 'Tutorial ansehen',
  resetStats: 'Statistiken zurücksetzen',
  resetDialogTitle: 'Statistiken zurücksetzen',
  resetDialogMessage: 'Alle Fortschritte werden gelöscht. Fortfahren?',
  resetDialogConfirm: 'Zurücksetzen',
  resetDialogCancel: 'Abbrechen',
  themeA11y: (label: string) => `Theme: ${label}`,
  langA11y: (label: string) => `Sprache: ${label}`,
  goalA11y: (n: number) => `Ziel: ${n} Wörter pro Tag`,
  optionsA11y: (n: number) => `${n} Antwortmöglichkeiten`,
  dirA11y: (label: string) => `Richtung: ${label}`,
  catA11y: (label: string) => `Kategorie: ${label}`,
  reminderTimeA11y: (t: string) => `Erinnerungszeit: ${t}`,
  reminderDayA11y: (label: string, active: boolean) =>
    `${label}: ${active ? 'aktiviert' : 'deaktiviert'}`,

  // ─── Word list screen (words.tsx) ───────────────────────────────────────────
  wordsScreenTitle: 'Wörter',
  wordsKnownCount: (known: number, total: number) => `Kenne: ${known} / ${total}`,
  wordsSearchPlaceholder: 'Suchen...',
  wordsMarkKnown: 'Als bekannt markieren',
  wordsMarkUnknown: 'Markierung entfernen',
  wordsAllKnownEmpty:
    'Alle Wörter sind als bekannt markiert.\nEntferne eine Markierung, um weiterzulernen.',

  // ─── Home screen (index.tsx) ─────────────────────────────────────────────────
  openMenu: 'Menü öffnen',
  dailyGoalLabel: 'Tagesziel',
  progressA11y: (today: number, goal: number) => `Tagesfortschritt: ${today} von ${goal} Wörtern`,
  noWords: 'Keine Wörter gefunden',
  pronounceA11y: (word: string) => `Wort aussprechen: ${word}`,
  soundOff: 'Ton ausschalten',
  soundOn: 'Ton einschalten',
  showHint: 'Hinweis anzeigen',
  skipWord: 'Wort überspringen',
  nextWord: 'Nächstes Wort',
  nextWordBtn: 'Weiter →',

  // ─── ReminderBanner ─────────────────────────────────────────────────────────
  snoozeLater: 'Später',
  snoozeA11y: 'Erinnerung 2 Stunden verschieben',
  dismissA11y: 'Erinnerung schließen',
  reminderMilestone: (streak: number) =>
    `Glückwunsch! ${streak} Tage in Folge — du bist ein echter Held! Weiter so!`,
  reminderAtRisk: (streak: number) =>
    `Deine ${streak}-Tage-Serie ist in Gefahr! Beantworte Fragen, um sie zu erhalten.`,
  reminderIncomplete: (goal: number) =>
    `Tagesziel noch nicht erreicht! Noch ein bisschen — bis zu ${goal} Wörtern.`,
};
