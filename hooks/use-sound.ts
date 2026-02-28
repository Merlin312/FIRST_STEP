import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const ukVoiceRef = useRef<string | undefined>(undefined);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.soundEnabled)
      .then((val) => {
        if (val !== null) setSoundEnabled(val !== 'false');
      })
      .catch(() => {});
  }, []);

  // Find best available Ukrainian voice on native platforms
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const ukVoices = voices.filter((v) => v.language?.startsWith('uk'));
        const enhanced = ukVoices.find((v) => v.quality === 'Enhanced');
        const best = enhanced ?? ukVoices[0];
        if (best?.identifier) ukVoiceRef.current = best.identifier;
      })
      .catch(() => {});
  }, []);

  const speak = useCallback(
    (text: string, lang: string = 'en-US') => {
      if (!soundEnabled) return;
      Speech.stop();
      if (lang === 'uk-UA') {
        Speech.speak(text, { language: 'uk-UA', voice: ukVoiceRef.current, rate: 0.92 });
      } else {
        Speech.speak(text, { language: lang });
      }
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
