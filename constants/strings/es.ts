import type { AppStrings } from './uk';

/** All UI strings in Spanish. */
export const es: AppStrings = {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  accountSection: 'CUENTA',
  signIn: 'Iniciar sesión',
  signUp: 'Registrarse',
  signOut: 'Cerrar sesión',
  continueWithGoogle: 'Continuar con Google',
  comingSoon: 'Próximamente',
  syncProgress: 'Sincronización',

  // ─── DrawerPanel ────────────────────────────────────────────────────────────
  guestMode: 'Modo invitado',
  closeMenu: 'Cerrar menú',
  privacyPolicy: 'Política de privacidad',

  // ─── StatsSection ───────────────────────────────────────────────────────────
  stats: 'ESTADÍSTICAS',
  activityChart: 'Actividad del mes',
  goalReached: '¡Meta!',
  wordsToday: (n: number) => `${n} palabras hoy`,
  wordsTodayLabel: 'palabras hoy',
  bestStreakLabel: (n: number) => `Récord: ${n} d.`,
  streakDays: (n: number) => (n === 1 ? 'día' : 'días'),
  accuracy: 'Precisión',
  allTime: 'de siempre',
  totalAnswered: 'Total',
  totalWrong: 'Errores',
  dayLabels: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],

  // ─── SettingsSection ────────────────────────────────────────────────────────
  settings: 'AJUSTES',
  theme: 'Tema',
  themeSystem: 'Sistema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  interfaceLanguage: 'Idioma de interfaz',
  langUk: 'Українська',
  langEn: 'English',
  langEs: 'Español',
  langDe: 'Deutsch',
  learningLanguage: 'Idioma de aprendizaje',
  quiz: 'Quiz',
  dailyGoal: 'Meta diaria',
  answersCount: 'Opciones de respuesta',
  quizDirection: 'Dirección del quiz',
  wordCategory: 'Categoría de palabras',
  catAll: 'Todo',
  catVerb: 'Verbos',
  catNoun: 'Sust.',
  catAdj: 'Adj.',
  catAdv: 'Adv.',
  autoAdvance: 'Avance automático',
  streak: 'Racha',
  correctOnly: 'Solo correctas',
  reminders: 'Recordatorios',
  dailyReminder: 'Recordatorio diario',
  reminderTime: 'Hora del recordatorio',
  reminderDays: 'Días de la semana',
  reminderDayLabels: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
  viewAllWords: 'Ver todas las palabras',
  viewTutorial: 'Ver tutorial',
  resetStats: 'Resetear estadísticas',
  resetDialogTitle: 'Resetear estadísticas',
  resetDialogMessage: 'Todo el progreso se eliminará. ¿Continuar?',
  resetDialogConfirm: 'Resetear',
  resetDialogCancel: 'Cancelar',
  themeA11y: (label: string) => `Tema: ${label}`,
  langA11y: (label: string) => `Idioma: ${label}`,
  goalA11y: (n: number) => `Meta: ${n} palabras por día`,
  optionsA11y: (n: number) => `${n} opciones de respuesta`,
  dirA11y: (label: string) => `Dirección: ${label}`,
  catA11y: (label: string) => `Categoría: ${label}`,
  reminderTimeA11y: (t: string) => `Hora del recordatorio: ${t}`,
  reminderDayA11y: (label: string, active: boolean) =>
    `${label}: ${active ? 'activado' : 'desactivado'}`,

  // ─── Word list screen (words.tsx) ───────────────────────────────────────────
  wordsScreenTitle: 'Palabras',
  wordsKnownCount: (known: number, total: number) => `Conozco: ${known} / ${total}`,
  wordsSearchPlaceholder: 'Buscar...',
  wordsMarkKnown: 'Marcar como conocida',
  wordsMarkUnknown: 'Quitar marca',
  wordsAllKnownEmpty:
    'Todas las palabras están marcadas como conocidas.\nQuita una marca para continuar aprendiendo.',

  // ─── Home screen (index.tsx) ─────────────────────────────────────────────────
  openMenu: 'Abrir menú',
  dailyGoalLabel: 'Meta del día',
  progressA11y: (today: number, goal: number) => `Progreso diario: ${today} de ${goal} palabras`,
  noWords: 'No se encontraron palabras',
  pronounceA11y: (word: string) => `Pronunciar la palabra ${word}`,
  soundOff: 'Desactivar sonido',
  soundOn: 'Activar sonido',
  showHint: 'Mostrar pista',
  skipWord: 'Saltar palabra',
  nextWord: 'Siguiente palabra',
  nextWordBtn: 'Siguiente →',

  // ─── ReminderBanner ─────────────────────────────────────────────────────────
  snoozeLater: 'Después',
  snoozeA11y: 'Posponer recordatorio 2 horas',
  dismissA11y: 'Cerrar recordatorio',
  reminderMilestone: (streak: number) =>
    `¡Felicidades! ${streak} días seguidos — ¡eres un verdadero héroe! ¡Sigue así!`,
  reminderAtRisk: (streak: number) =>
    `¡Tu racha de ${streak} días está en peligro! Responde preguntas para mantenerla.`,
  reminderIncomplete: (goal: number) =>
    `¡Aún no alcanzaste la meta de hoy! Un poco más — hasta ${goal} palabras.`,
};
