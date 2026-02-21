import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer, useRef } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

function todayString() {
  return new Date().toDateString();
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toDateString();
}

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

async function loadStats(): Promise<StatsState> {
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

/**
 * @deprecated Not used anywhere in the app.
 * Stats are managed globally via StatsContext — see contexts/stats-context.tsx.
 */
export function useStats() {
  const [state, dispatch] = useReducer(statsReducer, INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Mutex — prevents race condition on rapid answer taps
  const isProcessingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await loadStats();
      dispatch({ type: 'LOAD', data });
    } catch (e) {
      console.warn('[use-stats] failed to load stats', e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addResult = useCallback(async (isCorrect: boolean) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

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
        AsyncStorage.setItem(STORAGE_KEYS.statsCorrect, String(newCorrect)),
        AsyncStorage.setItem(STORAGE_KEYS.statsWrong, String(newWrong)),
      ];
      if (newLastDate !== current.lastDate) {
        writes.push(AsyncStorage.setItem(STORAGE_KEYS.statsLastDate, newLastDate));
        writes.push(AsyncStorage.setItem(STORAGE_KEYS.statsStreak, String(newStreak)));
      }
      await Promise.all(writes);
    } catch (e) {
      console.warn('[use-stats] failed to save result', e);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  const resetStats = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.statsTotal),
        AsyncStorage.removeItem(STORAGE_KEYS.statsCorrect),
        AsyncStorage.removeItem(STORAGE_KEYS.statsWrong),
        AsyncStorage.removeItem(STORAGE_KEYS.statsStreak),
        AsyncStorage.removeItem(STORAGE_KEYS.statsLastDate),
      ]);
      dispatch({ type: 'RESET' });
    } catch (e) {
      console.warn('[use-stats] failed to reset stats', e);
    }
  }, []);

  return {
    totalAnswered: state.totalAnswered,
    totalCorrect: state.totalCorrect,
    totalWrong: state.totalWrong,
    streak: state.streak,
    accuracy: state.accuracy,
    addResult,
    resetStats,
    reload: load,
  };
}
