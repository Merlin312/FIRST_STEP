import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';

const VOICE_QUALITY_PRIORITY: Record<string, number> = {
  Premium: 4,
  Enhanced: 3,
  Default: 2,
  Compact: 1,
};

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const isLoadedRef = useRef(false);
  const ukVoiceRef = useRef<string | undefined>(undefined);

  // Always keep ref in sync with state (read synchronously in speak callback)
  soundEnabledRef.current = soundEnabled;

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.soundEnabled)
      .then((val) => {
        if (val !== null) {
          const enabled = val !== 'false';
          setSoundEnabled(enabled);
          soundEnabledRef.current = enabled; // sync immediately, before re-render
        }
      })
      .catch(() => {})
      .finally(() => {
        isLoadedRef.current = true;
      });
  }, []);

  // Find best available Ukrainian voice on native platforms (Premium > Enhanced > Default > Compact)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const ukVoices = voices.filter((v) => v.language?.startsWith('uk'));
        const sorted = [...ukVoices].sort(
          (a, b) =>
            (VOICE_QUALITY_PRIORITY[b.quality ?? ''] ?? 0) -
            (VOICE_QUALITY_PRIORITY[a.quality ?? ''] ?? 0),
        );
        if (sorted[0]?.identifier) ukVoiceRef.current = sorted[0].identifier;
      })
      .catch(() => {});
  }, []);

  // Stable callback — reads latest values via refs, no stale closure risk
  const speak = useCallback(
    (text: string, lang: string = 'en-US') => {
      if (!isLoadedRef.current || !soundEnabledRef.current) return;
      Speech.stop();
      if (lang === 'uk-UA') {
        Speech.speak(text, {
          language: 'uk-UA',
          voice: ukVoiceRef.current,
          rate: 0.88,
          pitch: 1.0,
        });
      } else {
        Speech.speak(text, { language: lang });
      }
    },
     
    [],
  );

  const toggleSound = useCallback(async () => {
    const next = !soundEnabledRef.current;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    if (!next) Speech.stop();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.soundEnabled, String(next));
    } catch (e) {
      console.warn('[sound] failed to persist soundEnabled', e);
    }
  }, []);

  return { soundEnabled, speak, toggleSound };
}
