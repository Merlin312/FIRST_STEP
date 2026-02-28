import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: 'google' | 'apple' | 'email';
}

interface AuthContextValue {
  user: AuthUser | null;
  /** true when user is not signed in */
  isGuest: boolean;
  /** false while rehydrating from storage on mount */
  isAuthLoaded: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isGuest: true,
  isAuthLoaded: false,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  // Rehydrate cached user on mount (will be a no-op until real auth writes these keys)
  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEYS.userId, STORAGE_KEYS.userProfile])
      .then(([[, userId], [, profileJson]]) => {
        if (userId && profileJson) {
          try {
            const parsed = JSON.parse(profileJson) as AuthUser;
            setUser(parsed);
          } catch {
            // Corrupted cache — stay as guest
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsAuthLoaded(true));
  }, []);

  const signInWithGoogle = async () => {
    Alert.alert('Google Sign-In', 'Скоро буде');
  };

  const signInWithApple = async () => {
    Alert.alert('Apple Sign-In', 'Скоро буде');
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.userId, STORAGE_KEYS.userProfile]);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isGuest: user === null,
      isAuthLoaded,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }),
     
    [user, isAuthLoaded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
