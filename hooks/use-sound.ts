import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { UK_AUDIO } from '@/constants/audio-uk';
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
  const avSoundRef = useRef<Audio.Sound | null>(null);

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

  // Find best available Ukrainian voice (used as fallback when no bundled MP3 exists)
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

  // Unload expo-av sound on unmount
  useEffect(() => {
    return () => {
      avSoundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Stable callback — reads latest values via refs, no stale closure risk
  const speak = useCallback(
    (text: string, lang: string = 'en-US') => {
      if (!isLoadedRef.current || !soundEnabledRef.current) return;

      // Stop any ongoing speech
      Speech.stop();
      if (avSoundRef.current) {
        const prev = avSoundRef.current;
        avSoundRef.current = null;
        prev
          .stopAsync()
          .then(() => prev.unloadAsync())
          .catch(() => {});
      }

      if (lang === 'uk-UA') {
        const source = UK_AUDIO[text];
        if (source !== undefined) {
          // Play bundled MP3 — native Ukrainian pronunciation, works on all devices
          Audio.Sound.createAsync(source, { shouldPlay: true })
            .then(({ sound }) => {
              avSoundRef.current = sound;
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  sound.unloadAsync().catch(() => {});
                  if (avSoundRef.current === sound) avSoundRef.current = null;
                }
              });
            })
            .catch(() => {
              // Fallback to expo-speech if expo-av playback fails
              Speech.speak(text, {
                language: 'uk-UA',
                voice: ukVoiceRef.current,
                rate: 0.88,
                pitch: 1.0,
              });
            });
        } else {
          // No bundled MP3 for this text — use expo-speech with best available Ukrainian voice
          Speech.speak(text, {
            language: 'uk-UA',
            voice: ukVoiceRef.current,
            rate: 0.88,
            pitch: 1.0,
          });
        }
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
    if (!next) {
      Speech.stop();
      if (avSoundRef.current) {
        const s = avSoundRef.current;
        avSoundRef.current = null;
        s.stopAsync()
          .then(() => s.unloadAsync())
          .catch(() => {});
      }
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.soundEnabled, String(next));
    } catch (e) {
      console.warn('[sound] failed to persist soundEnabled', e);
    }
  }, []);

  return { soundEnabled, speak, toggleSound };
}
