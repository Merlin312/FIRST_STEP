import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns local date as 'YYYY-MM-DD'. Does NOT use toDateString() to avoid locale issues. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns the calendar day before the given ISO date string. */
function dayBefore(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface StatsState {
  // All-time counters
  totalAnswered: number;
  totalCorrect: number;
  // Streak
  streak: number;
  lastActiveDate: string; // 'YYYY-MM-DD', or '' on first launch
  // Daily progress (resets automatically when todayDate !== today)
  todayCount: number;
  todayDate: string;      // 'YYYY-MM-DD', or '' on first launch
  // Settings
  dailyGoal: number;
  // Internal flag — prevents persisting before initial load
  _loaded: boolean;
}

const INITIAL: StatsState = {
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  lastActiveDate: '',
  todayCount: 0,
  todayDate: '',
  dailyGoal: 20,
  _loaded: false,
};

type Action =
  | { type: 'LOAD'; payload: StatsState }
  | { type: 'RELOAD_GOAL'; dailyGoal: number }
  | { type: 'ANSWER'; isCorrect: boolean }
  | { type: 'RESET' };

function reducer(state: StatsState, action: Action): StatsState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

    case 'RELOAD_GOAL':
      return { ...state, dailyGoal: action.dailyGoal };

    case 'ANSWER': {
      const today = todayISO();

      // All-time
      const totalAnswered = state.totalAnswered + 1;
      const totalCorrect = action.isCorrect ? state.totalCorrect + 1 : state.totalCorrect;

      // Daily — count resets automatically if todayDate drifted to a previous day
      const todayCount = (state.todayDate === today ? state.todayCount : 0) + 1;
      const todayDate = today;

      // Streak — only recalculated on the FIRST answer of a new day
      let { streak, lastActiveDate } = state;
      if (state.lastActiveDate !== today) {
        streak = state.lastActiveDate === dayBefore(today) ? state.streak + 1 : 1;
        lastActiveDate = today;
      }

      return { ...state, totalAnswered, totalCorrect, streak, lastActiveDate, todayCount, todayDate };
    }

    case 'RESET':
      // Keep dailyGoal and _loaded; reset everything else
      return { ...INITIAL, dailyGoal: state.dailyGoal, _loaded: true };
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

/** Shape of the JSON we write to AsyncStorage. Internal flags are excluded. */
type PersistedStats = Omit<StatsState, '_loaded' | 'dailyGoal'>;

async function readFromStorage(): Promise<StatsState> {
  const [raw, goalStr] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.stats),
    AsyncStorage.getItem(STORAGE_KEYS.dailyGoal),
  ]);

  const dailyGoal = parseInt(goalStr ?? '20', 10) || 20;

  if (!raw) {
    return { ...INITIAL, dailyGoal, _loaded: true };
  }

  try {
    const p = JSON.parse(raw) as Partial<PersistedStats>;
    const today = todayISO();

    // Daily count is valid only if stored date matches today
    const todayCount = p.todayDate === today ? (p.todayCount ?? 0) : 0;
    const todayDate = p.todayDate === today ? p.todayDate : '';

    // Validate streak: if the user hasn't been active since before yesterday, streak is dead
    let streak = p.streak ?? 0;
    const lastActiveDate = p.lastActiveDate ?? '';
    if (lastActiveDate !== '' && lastActiveDate !== today && lastActiveDate !== dayBefore(today)) {
      streak = 0;
    }

    return {
      totalAnswered: p.totalAnswered ?? 0,
      totalCorrect: p.totalCorrect ?? 0,
      streak,
      lastActiveDate,
      todayCount,
      todayDate,
      dailyGoal,
      _loaded: true,
    };
  } catch {
    return { ...INITIAL, dailyGoal, _loaded: true };
  }
}

function persistStats(state: StatsState): void {
  const { _loaded: _, dailyGoal: __, ...data } = state;
  AsyncStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(data)).catch((e) =>
    console.warn('[stats] persist error', e),
  );
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface StatsContextValue {
  /** Total words answered all-time */
  totalAnswered: number;
  /** Total correct answers all-time */
  totalCorrect: number;
  /** Total wrong answers all-time (derived: totalAnswered - totalCorrect) */
  totalWrong: number;
  /** Accuracy percentage 0–100 (derived) */
  accuracy: number;
  /** Consecutive active days */
  streak: number;
  /** Words answered today */
  todayCount: number;
  /** Daily target set during onboarding */
  dailyGoal: number;
  /** Record one answer. Updates both daily count and all-time stats. */
  addAnswer: (isCorrect: boolean) => void;
  /** Wipe all stats from memory and storage. */
  resetStats: () => Promise<void>;
  /** Re-read dailyGoal from storage (call on screen focus after onboarding). */
  reloadDailyGoal: () => Promise<void>;
}

const StatsContext = createContext<StatsContextValue>({
  totalAnswered: 0,
  totalCorrect: 0,
  totalWrong: 0,
  accuracy: 0,
  streak: 0,
  todayCount: 0,
  dailyGoal: 20,
  addAnswer: () => {},
  resetStats: async () => {},
  reloadDailyGoal: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Load from storage once on mount
  useEffect(() => {
    readFromStorage()
      .then((data) => dispatch({ type: 'LOAD', payload: data }))
      .catch((e) => console.warn('[stats] load error', e));
  }, []);

  // Persist on every state change that follows the initial load.
  // After RESET, this writes zeros to storage; resetStats() concurrently removes
  // the key. Both outcomes produce zeros on the next load — the race is harmless.
  useEffect(() => {
    if (!state._loaded) return;
    persistStats(state);
  }, [state]);

  const addAnswer = useCallback((isCorrect: boolean) => {
    dispatch({ type: 'ANSWER', isCorrect });
  }, []);

  const resetStats = useCallback(async () => {
    dispatch({ type: 'RESET' });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.stats);
    } catch (e) {
      console.warn('[stats] reset error', e);
    }
  }, []);

  const reloadDailyGoal = useCallback(async () => {
    try {
      const goalStr = await AsyncStorage.getItem(STORAGE_KEYS.dailyGoal);
      const dailyGoal = parseInt(goalStr ?? '20', 10) || 20;
      dispatch({ type: 'RELOAD_GOAL', dailyGoal });
    } catch (e) {
      console.warn('[stats] reloadDailyGoal error', e);
    }
  }, []);

  const value = useMemo<StatsContextValue>(
    () => ({
      totalAnswered: state.totalAnswered,
      totalCorrect: state.totalCorrect,
      totalWrong: state.totalAnswered - state.totalCorrect,
      accuracy:
        state.totalAnswered > 0
          ? Math.round((state.totalCorrect / state.totalAnswered) * 100)
          : 0,
      streak: state.streak,
      todayCount: state.todayCount,
      dailyGoal: state.dailyGoal,
      addAnswer,
      resetStats,
      reloadDailyGoal,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.totalAnswered, state.totalCorrect, state.streak, state.todayCount, state.dailyGoal],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStatsContext(): StatsContextValue {
  return useContext(StatsContext);
}
