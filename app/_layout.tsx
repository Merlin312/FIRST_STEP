import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppThemeProvider, useAppTheme } from '@/contexts/theme-context';
import { StatsProvider } from '@/contexts/stats-context';

// Keep splash screen visible until the app is ready to show content
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const { colorScheme, isThemeLoaded } = useAppTheme();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.hasSeenOnboarding)
      .then((val) => {
        if (!val) router.replace('/onboarding');
        setIsReady(true);
      })
      .catch(() => setIsReady(true));
    // router is stable — intentionally omitted from deps to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Wait for both navigation readiness AND theme to load before hiding splash.
    // This prevents a flicker where the wrong theme briefly appears.
    if (isReady && isThemeLoaded) {
      // expo-splash-screen applies a short fade-out automatically
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady, isThemeLoaded]);

  if (!isReady) {
    const bg = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
    return (
      <View style={[styles.loading, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={Blue[600]} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <StatsProvider>
          <RootLayoutInner />
        </StatsProvider>
      </AppThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
