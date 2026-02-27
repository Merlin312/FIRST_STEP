import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.soundEnabled)
      .then((val) => {
        if (val !== null) setSoundEnabled(val !== 'false');
      })
      .catch(() => {});
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!soundEnabled) return;
      Speech.stop();
      Speech.speak(text, { language: 'en-US' });
    },
    [soundEnabled],
  );

  const toggleSound = useCallback(async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (!next) Speech.stop();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.soundEnabled, String(next));
    } catch (e) {
      console.warn('[sound] failed to persist soundEnabled', e);
    }
  }, [soundEnabled]);

  return { soundEnabled, speak, toggleSound };
}
