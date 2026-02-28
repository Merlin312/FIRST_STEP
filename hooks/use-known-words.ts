import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { Word, TargetLanguage } from '@/constants/words';

function makeKey(lang: TargetLanguage, word: Word): string {
  return `${lang}:${word.target}`;
}

/**
 * Manages the set of words the user has marked as "already known".
 * Known words are excluded from the quiz word pool.
 *
 * Storage format: JSON array of strings like `["en:be", "en:have", "es:ser"]`.
 */
export function useKnownWords(targetLanguage: TargetLanguage) {
  // Full set of known keys across ALL languages (persisted as-is)
  const [allKnownKeys, setAllKnownKeys] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.knownWords)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as string[];
          setAllKnownKeys(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  /** Set of target-word strings known for the current language (e.g. `"be"`, `"have"`). */
  const knownTargets: Set<string> = new Set(
    allKnownKeys
      .filter((k) => k.startsWith(`${targetLanguage}:`))
      .map((k) => k.slice(targetLanguage.length + 1)),
  );

  const isKnown = useCallback(
    (word: Word) => knownTargets.has(word.target),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allKnownKeys, targetLanguage],
  );

  const toggleKnown = useCallback(
    async (word: Word) => {
      const key = makeKey(targetLanguage, word);
      setAllKnownKeys((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        AsyncStorage.setItem(STORAGE_KEYS.knownWords, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [targetLanguage],
  );

  const knownCount = knownTargets.size;

  return { isKnown, toggleKnown, knownTargets, knownCount, isLoaded };
}
