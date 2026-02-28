/** Shape of all UI string bundles. Add keys here when adding new UI strings. */
export interface AppStrings {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  accountSection: string;
  signIn: string;
  signUp: string;
  signOut: string;
  continueWithGoogle: string;
  comingSoon: string;
  syncProgress: string;

  // ─── DrawerPanel ────────────────────────────────────────────────────────────
  guestMode: string;
  closeMenu: string;
  privacyPolicy: string;

  // ─── StatsSection ───────────────────────────────────────────────────────────
  stats: string;
  activityChart: string;
  goalReached: string;
  wordsToday: (n: number) => string;
  wordsTodayLabel: string;
  bestStreakLabel: (n: number) => string;
  streakDays: (n: number) => string;
  accuracy: string;
  allTime: string;
  totalAnswered: string;
  totalWrong: string;
  dayLabels: string[];

  // ─── SettingsSection ────────────────────────────────────────────────────────
  settings: string;
  theme: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  interfaceLanguage: string;
  langUk: string;
  langEn: string;
  langEs: string;
  langDe: string;
  quiz: string;
  dailyGoal: string;
  answersCount: string;
  learningLanguage: string;
  quizDirection: string;
  wordCategory: string;
  catAll: string;
  catVerb: string;
  catNoun: string;
  catAdj: string;
  catAdv: string;
  autoAdvance: string;
  streak: string;
  correctOnly: string;
  reminders: string;
  dailyReminder: string;
  reminderTime: string;
  reminderDays: string;
  reminderDayLabels: string[];
  viewAllWords: string;
  viewTutorial: string;
  resetStats: string;
  resetDialogTitle: string;
  resetDialogMessage: string;
  resetDialogConfirm: string;
  resetDialogCancel: string;
  themeA11y: (label: string) => string;
  langA11y: (label: string) => string;
  goalA11y: (n: number) => string;
  optionsA11y: (n: number) => string;
  dirA11y: (label: string) => string;
  catA11y: (label: string) => string;
  reminderTimeA11y: (t: string) => string;
  reminderDayA11y: (label: string, active: boolean) => string;

  // ─── Word list screen (words.tsx) ───────────────────────────────────────────
  wordsScreenTitle: string;
  wordsKnownCount: (known: number, total: number) => string;
  wordsSearchPlaceholder: string;
  wordsMarkKnown: string;
  wordsMarkUnknown: string;
  wordsAllKnownEmpty: string;

  // ─── Home screen (index.tsx) ─────────────────────────────────────────────────
  openMenu: string;
  dailyGoalLabel: string;
  progressA11y: (today: number, goal: number) => string;
  noWords: string;
  pronounceA11y: (word: string) => string;
  soundOff: string;
  soundOn: string;
  showHint: string;
  skipWord: string;
  nextWord: string;
  nextWordBtn: string;

  // ─── ReminderBanner ─────────────────────────────────────────────────────────
  snoozeLater: string;
  snoozeA11y: string;
  dismissA11y: string;
  reminderMilestone: (streak: number) => string;
  reminderAtRisk: (streak: number) => string;
  reminderIncomplete: (goal: number) => string;
}

/** All UI strings in Ukrainian. */
export const uk: AppStrings = {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  accountSection: 'АКАУНТ',
  signIn: 'Увійти',
  signUp: 'Реєстрація',
  signOut: 'Вийти',
  continueWithGoogle: 'Продовжити з Google',
  comingSoon: 'Скоро буде',
  syncProgress: 'Синхронізація прогресу',

  // ─── DrawerPanel ────────────────────────────────────────────────────────────
  guestMode: 'Гостьовий режим',
  closeMenu: 'Закрити меню',
  privacyPolicy: 'Політика конфіденційності',

  // ─── StatsSection ───────────────────────────────────────────────────────────
  stats: 'СТАТИСТИКА',
  activityChart: 'Активність за місяць',
  goalReached: 'Ціль!',
  wordsToday: (n) => `${n} слів сьогодні`,
  wordsTodayLabel: 'слів сьогодні',
  bestStreakLabel: (n) => `Рекорд: ${n} дн.`,
  streakDays: (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return 'день';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'дні';
    return 'днів';
  },
  accuracy: 'Точність',
  allTime: 'за весь час',
  totalAnswered: 'Всього',
  totalWrong: 'Помилок',
  dayLabels: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],

  // ─── SettingsSection ────────────────────────────────────────────────────────
  settings: 'НАЛАШТУВАННЯ',
  theme: 'Тема',
  themeSystem: 'Системна',
  themeLight: 'Світла',
  themeDark: 'Темна',
  interfaceLanguage: 'Мова інтерфейсу',
  langUk: 'Українська',
  langEn: 'English',
  langEs: 'Іспанська',
  langDe: 'Німецька',
  quiz: 'Квіз',
  dailyGoal: 'Щоденна ціль',
  answersCount: 'Варіантів відповіді',
  learningLanguage: 'Мова навчання',
  quizDirection: 'Напрям квізу',
  wordCategory: 'Категорія слів',
  catAll: 'Всі',
  catVerb: 'Дієслова',
  catNoun: 'Іменники',
  catAdj: 'Прикмет.',
  catAdv: 'Прислів.',
  autoAdvance: 'Автоперехід',
  streak: 'Серія',
  correctOnly: 'Тільки правильні',
  reminders: 'Нагадування',
  dailyReminder: 'Щоденне нагадування',
  reminderTime: 'Час нагадування',
  reminderDays: 'Дні тижня',
  reminderDayLabels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  viewAllWords: 'Переглянути всі слова',
  viewTutorial: 'Переглянути туторіал',
  resetStats: 'Скинути статистику',
  resetDialogTitle: 'Скинути статистику',
  resetDialogMessage: 'Весь прогрес буде видалено. Продовжити?',
  resetDialogConfirm: 'Скинути',
  resetDialogCancel: 'Скасувати',
  themeA11y: (label) => `Тема: ${label}`,
  langA11y: (label) => `Мова: ${label}`,
  goalA11y: (n) => `Ціль ${n} слів на день`,
  optionsA11y: (n) => `${n} варіантів відповіді`,
  dirA11y: (label) => `Напрям: ${label}`,
  catA11y: (label) => `Категорія: ${label}`,
  reminderTimeA11y: (t) => `Час нагадування: ${t}`,
  reminderDayA11y: (label, active) => `${label}: ${active ? 'увімкнено' : 'вимкнено'}`,

  // ─── Word list screen (words.tsx) ───────────────────────────────────────────
  wordsScreenTitle: 'Слова',
  wordsKnownCount: (known, total) => `Знаю: ${known} / ${total}`,
  wordsSearchPlaceholder: 'Пошук...',
  wordsMarkKnown: 'Позначити як відоме',
  wordsMarkUnknown: 'Зняти позначку',
  wordsAllKnownEmpty: 'Всі слова позначені як відомі.\nЗніміть позначку, щоб продовжити навчання.',

  // ─── Home screen (index.tsx) ─────────────────────────────────────────────────
  openMenu: 'Відкрити меню',
  dailyGoalLabel: 'Мета дня',
  progressA11y: (today, goal) => `Денний прогрес: ${today} з ${goal} слів`,
  noWords: 'Слів не знайдено',
  pronounceA11y: (word) => `Вимовити слово ${word}`,
  soundOff: 'Вимкнути звук',
  soundOn: 'Увімкнути звук',
  showHint: 'Показати підказку',
  skipWord: 'Пропустити слово',
  nextWord: 'Наступне слово',
  nextWordBtn: 'Далі →',

  // ─── ReminderBanner ─────────────────────────────────────────────────────────
  snoozeLater: 'Пізніше',
  snoozeA11y: 'Відкласти нагадування на 2 години',
  dismissA11y: 'Закрити нагадування',
  reminderMilestone: (streak) =>
    `Вітаємо! ${streak} днів поспіль — ти справжній герой! Продовжуй у тому ж дусі!`,
  reminderAtRisk: (streak) =>
    `Твоя серія ${streak} днів під загрозою! Відповідай на питання, щоб не перервати її.`,
  reminderIncomplete: (goal) =>
    `Ще не виконав ціль на сьогодні! Залишилось трохи — до ${goal} слів.`,
};
