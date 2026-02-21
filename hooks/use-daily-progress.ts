import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

function todayKey() {
  return STORAGE_KEYS.dailyCount(new Date().toDateString());
}

async function readFromStorage() {
  const [count, goal] = await Promise.all([
    AsyncStorage.getItem(todayKey()),
    AsyncStorage.getItem(STORAGE_KEYS.dailyGoal),
  ]);
  return {
    todayCount: parseInt(count ?? '0', 10) || 0,
    dailyGoal: parseInt(goal ?? '20', 10) || 20,
  };
}

export function useDailyProgress() {
  const [todayCount, setTodayCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(20);
  const countRef = useRef(0);
  countRef.current = todayCount;

  useEffect(() => {
    readFromStorage()
      .then(({ todayCount: c, dailyGoal: g }) => {
        countRef.current = c;
        setTodayCount(c);
        setDailyGoal(g);
      })
      .catch((e) => {
        console.warn('[use-daily-progress] failed to load progress', e);
      });
  }, []);

  const reload = useCallback(() => {
    readFromStorage()
      .then(({ todayCount: c, dailyGoal: g }) => {
        // Sync ref immediately so incrementTodayCount uses the fresh value
        // before the next render updates countRef via line above
        countRef.current = c;
        setTodayCount(c);
        setDailyGoal(g);
      })
      .catch((e) => {
        console.warn('[use-daily-progress] failed to reload progress', e);
      });
  }, []);

  const incrementTodayCount = useCallback(() => {
    const next = countRef.current + 1;
    setTodayCount(next);
    AsyncStorage.setItem(todayKey(), String(next)).catch((e) => {
      console.warn('[use-daily-progress] failed to save daily count', e);
    });
  }, []);

  return { todayCount, dailyGoal, incrementTodayCount, reload };
}
