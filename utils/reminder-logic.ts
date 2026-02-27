/** Type of reminder to display. null means no reminder is needed. */
export type ReminderType = 'daily-goal-incomplete' | 'streak-at-risk' | 'streak-milestone' | null;

/** Streak values that trigger a milestone reminder. */
const STREAK_MILESTONES = [7, 14, 30, 50, 100] as const;

interface ReminderInput {
  reminderEnabled: boolean;
  /** 'YYYY-MM-DD' of the last day reminder was shown. Empty string = never shown. */
  lastReminderDate: string;
  /** ISO timestamp until which the reminder is snoozed. Null/empty = not snoozed. */
  snoozedUntil: string | null;
  /** Words answered today. */
  todayCount: number;
  /** Daily goal set by user. */
  dailyGoal: number;
  /** Current streak in days. */
  streak: number;
  /** 'YYYY-MM-DD' of last day the user answered. Empty string = never. */
  lastActiveDate: string;
}

/** Returns local date as 'YYYY-MM-DD'. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Pure function — no side effects. Determines which reminder type (if any) should
 * be shown to the user right now, based on their stats and reminder settings.
 *
 * Priority: streak-milestone > streak-at-risk > daily-goal-incomplete
 */
export function getReminderType(input: ReminderInput): ReminderType {
  const {
    reminderEnabled,
    lastReminderDate,
    snoozedUntil,
    todayCount,
    dailyGoal,
    streak,
    lastActiveDate,
  } = input;

  if (!reminderEnabled) return null;

  const today = todayISO();

  // Don't show if already shown today
  if (lastReminderDate === today) return null;

  // Don't show if snoozed
  if (snoozedUntil && new Date(snoozedUntil) > new Date()) return null;

  // Streak milestone — show once when streak hits a milestone value
  if (streak > 0 && STREAK_MILESTONES.includes(streak as (typeof STREAK_MILESTONES)[number])) {
    // Only show if the milestone was just reached today (lastActiveDate === today)
    if (lastActiveDate === today) return 'streak-milestone';
  }

  // Streak at risk — user hasn't answered today and had a streak yesterday
  // "At risk" window: after 20 hours of inactivity on a day with an active streak
  if (streak > 0 && lastActiveDate !== today) {
    const now = new Date();
    const lastActive = lastActiveDate ? new Date(lastActiveDate + 'T00:00:00') : null;
    if (lastActive) {
      const hoursSince = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
      if (hoursSince >= 20) return 'streak-at-risk';
    }
  }

  // Daily goal not yet reached today
  if (dailyGoal > 0 && todayCount < dailyGoal) {
    return 'daily-goal-incomplete';
  }

  return null;
}

/** Returns a human-readable message for each reminder type. */
export function getReminderMessage(type: ReminderType, streak: number, dailyGoal: number): string {
  switch (type) {
    case 'streak-milestone':
      return `Вітаємо! ${streak} днів поспіль — ти справжній герой! Продовжуй у тому ж дусі!`;
    case 'streak-at-risk':
      return `Твоя серія ${streak} днів під загрозою! Відповідай на питання, щоб не перервати її.`;
    case 'daily-goal-incomplete':
      return `Ще не виконав ціль на сьогодні! Залишилось трохи — до ${dailyGoal} слів.`;
    default:
      return '';
  }
}
