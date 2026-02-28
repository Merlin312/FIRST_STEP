import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { uk, type AppStrings } from '@/constants/strings/uk';
import { en } from '@/constants/strings/en';
import { es } from '@/constants/strings/es';
import { de } from '@/constants/strings/de';

export type AppLanguage = 'uk' | 'en' | 'es' | 'de';

const STRINGS_MAP: Record<AppLanguage, AppStrings> = { uk, en, es, de };

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => Promise<void>;
  strings: AppStrings;
  isLanguageLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'uk',
  setLang: async () => {},
  strings: uk,
  isLanguageLoaded: false,
});

/** Detects system language on first launch. Returns the matching AppLanguage, or 'en' as fallback. */
function detectSystemLanguage(): AppLanguage {
  try {
    const locales = getLocales();
    const code = locales[0]?.languageCode ?? '';
    if (code.startsWith('uk')) return 'uk';
    if (code.startsWith('es')) return 'es';
    if (code.startsWith('de')) return 'de';
  } catch {
    // expo-localization unavailable (unlikely) — fall back to English
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>('uk');
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.appLanguage)
      .then((stored) => {
        if (stored === 'uk' || stored === 'en' || stored === 'es' || stored === 'de') {
          setLangState(stored);
        } else {
          // First launch — detect from system
          const detected = detectSystemLanguage();
          setLangState(detected);
          AsyncStorage.setItem(STORAGE_KEYS.appLanguage, detected).catch(() => {});
        }
      })
      .catch(() => {
        setLangState(detectSystemLanguage());
      })
      .finally(() => setIsLanguageLoaded(true));
  }, []);

  const setLang = useCallback(async (next: AppLanguage) => {
    setLangState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.appLanguage, next);
    } catch (e) {
      console.warn('[language] failed to persist appLanguage', e);
    }
  }, []);

  const strings = useMemo(() => STRINGS_MAP[lang], [lang]);

  const value = useMemo(
    () => ({ lang, setLang, strings, isLanguageLoaded }),
    [lang, setLang, strings, isLanguageLoaded],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
