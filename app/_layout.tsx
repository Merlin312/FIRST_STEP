import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppThemeProvider, useAppTheme } from '@/contexts/theme-context';
import { StatsProvider } from '@/contexts/stats-context';

// Show notifications as banners when app is in foreground (iOS only — Android always shows them)
// expo-notifications has no web support — use require() so Metro excludes it from the web bundle
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowList: true,
    }),
  });
}

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
        <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <ErrorBoundary>
        <AppThemeProvider>
          <StatsProvider>
            <RootLayoutInner />
          </StatsProvider>
        </AppThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
