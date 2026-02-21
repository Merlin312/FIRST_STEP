import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayString() {
  return new Date().toDateString();
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toDateString();
}

// ─── State & Reducer ─────────────────────────────────────────────────────────

interface StatsState {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  streak: number;
  accuracy: number;
  lastDate: string;
}

type StatsAction =
  | { type: 'LOAD'; data: StatsState }
  | { type: 'ADD_RESULT'; isCorrect: boolean }
  | { type: 'RESET' };

const INITIAL: StatsState = {
  totalAnswered: 0,
  totalCorrect: 0,
  totalWrong: 0,
  streak: 0,
  accuracy: 0,
  lastDate: '',
};

function statsReducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
    case 'LOAD':
      return action.data;
    case 'ADD_RESULT': {
      const today = todayString();
      const newTotal = state.totalAnswered + 1;
      const newCorrect = action.isCorrect ? state.totalCorrect + 1 : state.totalCorrect;
      const newWrong = !action.isCorrect ? state.totalWrong + 1 : state.totalWrong;
      const accuracy = Math.round((newCorrect / newTotal) * 100);
      let streak = state.streak;
      let lastDate = state.lastDate;
      if (state.lastDate !== today) {
        streak = isYesterday(state.lastDate) ? state.streak + 1 : 1;
        lastDate = today;
      }
      return { totalAnswered: newTotal, totalCorrect: newCorrect, totalWrong: newWrong, accuracy, streak, lastDate };
    }
    case 'RESET':
      return INITIAL;
  }
}

async function readStatsFromStorage(): Promise<StatsState> {
  const [total, correct, wrong, streak, lastDate] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.statsTotal),
    AsyncStorage.getItem(STORAGE_KEYS.statsCorrect),
    AsyncStorage.getItem(STORAGE_KEYS.statsWrong),
    AsyncStorage.getItem(STORAGE_KEYS.statsStreak),
    AsyncStorage.getItem(STORAGE_KEYS.statsLastDate),
  ]);
  const totalAnswered = parseInt(total ?? '0', 10) || 0;
  const totalCorrect = parseInt(correct ?? '0', 10) || 0;
  const totalWrong = parseInt(wrong ?? '0', 10) || 0;
  return {
    totalAnswered,
    totalCorrect,
    totalWrong,
    streak: parseInt(streak ?? '0', 10) || 0,
    lastDate: lastDate ?? '',
    accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface StatsContextValue {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  streak: number;
  accuracy: number;
  addResult: (isCorrect: boolean) => Promise<void>;
  resetStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextValue>({
  totalAnswered: 0,
  totalCorrect: 0,
  totalWrong: 0,
  streak: 0,
  accuracy: 0,
  addResult: async () => {},
  resetStats: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(statsReducer, INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    readStatsFromStorage()
      .then((data) => dispatch({ type: 'LOAD', data }))
      .catch((e) => console.warn('[stats-context] failed to load stats', e));
  }, []);

  const addResult = useCallback(async (isCorrect: boolean) => {
    const current = stateRef.current;
    const today = todayString();

    const newTotal = current.totalAnswered + 1;
    const newCorrect = isCorrect ? current.totalCorrect + 1 : current.totalCorrect;
    const newWrong = !isCorrect ? current.totalWrong + 1 : current.totalWrong;
    let newStreak = current.streak;
    let newLastDate = current.lastDate;
    if (current.lastDate !== today) {
      newStreak = isYesterday(current.lastDate) ? current.streak + 1 : 1;
      newLastDate = today;
    }

    dispatch({ type: 'ADD_RESULT', isCorrect });

    try {
      const writes: Promise<void>[] = [
        AsyncStorage.setItem(STORAGE_KEYS.statsTotal, String(newTotal)),
        // Always write both counters to keep storage consistent on restart
        AsyncStorage.setItem(STORAGE_KEYS.statsCorrect, String(newCorrect)),
        AsyncStorage.setItem(STORAGE_KEYS.statsWrong, String(newWrong)),
      ];
      if (newLastDate !== current.lastDate) {
        writes.push(AsyncStorage.setItem(STORAGE_KEYS.statsLastDate, newLastDate));
        writes.push(AsyncStorage.setItem(STORAGE_KEYS.statsStreak, String(newStreak)));
      }
      await Promise.all(writes);
    } catch (e) {
      console.warn('[stats-context] failed to save result', e);
    }
  }, []);

  const resetStats = useCallback(async () => {
    // Dispatch first (optimistic update) — UI always resets immediately
    dispatch({ type: 'RESET' });
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.statsTotal),
        AsyncStorage.removeItem(STORAGE_KEYS.statsCorrect),
        AsyncStorage.removeItem(STORAGE_KEYS.statsWrong),
        AsyncStorage.removeItem(STORAGE_KEYS.statsStreak),
        AsyncStorage.removeItem(STORAGE_KEYS.statsLastDate),
      ]);
    } catch (e) {
      console.warn('[stats-context] failed to clear stats from storage', e);
    }
  }, []);

  const value = useMemo(
    () => ({
      totalAnswered: state.totalAnswered,
      totalCorrect: state.totalCorrect,
      totalWrong: state.totalWrong,
      streak: state.streak,
      accuracy: state.accuracy,
      addResult,
      resetStats,
    }),
    [state.totalAnswered, state.totalCorrect, state.totalWrong, state.streak, state.accuracy, addResult, resetStats],
  );

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStatsContext(): StatsContextValue {
  return useContext(StatsContext);
}
