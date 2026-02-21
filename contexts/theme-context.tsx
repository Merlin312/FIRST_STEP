import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type ColorSchemeName, useColorScheme } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  /** Resolved color scheme — always 'light' or 'dark', never null */
  colorScheme: 'light' | 'dark';
  /** What the user picked: system / light / dark */
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'light',
  themeMode: 'system',
  setThemeMode: () => {},
});

function resolve(mode: ThemeMode, system: ColorSchemeName): 'light' | 'dark' {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.themeMode)
      .then((val) => {
        if (val === 'light' || val === 'dark' || val === 'system') {
          setThemeModeState(val);
        }
      })
      .catch((e) => {
        console.warn('[theme-context] failed to load theme preference', e);
      });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(STORAGE_KEYS.themeMode, mode).catch((e) => {
      console.warn('[theme-context] failed to save theme preference', e);
    });
  }, []);

  const colorScheme = resolve(themeMode, system);

  const value = useMemo(
    () => ({ colorScheme, themeMode, setThemeMode }),
    [colorScheme, themeMode, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
