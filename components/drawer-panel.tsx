import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { useStatsContext } from '@/contexts/stats-context';

import { AuthSection } from '@/components/drawer/auth-section';
import { LanguageSection } from '@/components/drawer/language-section';
import { StatsSection } from '@/components/drawer/stats-section';
import { ThemeSection } from '@/components/drawer/theme-section';

const DRAWER_WIDTH = 300;

// Плавна пружина без відскоку для панелі
const PANEL_SPRING = {
  damping: 32,
  stiffness: 280,
  mass: 0.85,
  overshootClamping: true,
} as const;

// Параметри плавного затемнення фону
const BACKDROP_TIMING = {
  duration: 260,
  easing: Easing.out(Easing.ease),
} as const;

const BACKDROP_CLOSE_TIMING = {
  duration: 200,
  easing: Easing.in(Easing.ease),
} as const;

// Конфіг кастомних діалогів підтвердження (замінює Alert.alert, який не працює на вебі)
type PendingAction = 'reset' | 'startOver' | null;

const DIALOG_CONFIG = {
  reset: {
    title: 'Скинути статистику',
    message: 'Весь прогрес буде видалено. Продовжити?',
    confirm: 'Скинути',
  },
  startOver: {
    title: 'Почати спочатку',
    message: 'Статистика та налаштування будуть скинуті. Онбординг покажеться знову.',
    confirm: 'Почати спочатку',
  },
} as const;

interface DrawerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  todayCount: number;
  dailyGoal: number;
}

export function DrawerPanel({
  isOpen,
  onClose,
  todayCount,
  dailyGoal,
}: DrawerPanelProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();

  const { totalAnswered, totalWrong, streak, accuracy, resetStats } = useStatsContext();

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(isOpen ? 0 : -DRAWER_WIDTH, PANEL_SPRING);
    backdropOpacity.value = withTiming(
      isOpen ? 0.5 : 0,
      isOpen ? BACKDROP_TIMING : BACKDROP_CLOSE_TIMING,
    );
    // translateX and backdropOpacity are stable shared values (like useRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: isOpen ? 'auto' : 'none',
  }));

  const handleResetStats = () => setPendingAction('reset');
  const handleStartOver = () => setPendingAction('startOver');

  const handleCancel = () => setPendingAction(null);

  const handleConfirm = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'reset') {
      await resetStats();
    } else if (action === 'startOver') {
      await Promise.all([
        resetStats(),
        AsyncStorage.removeItem(STORAGE_KEYS.hasSeenOnboarding).catch(() => {}),
        AsyncStorage.removeItem(STORAGE_KEYS.dailyGoal).catch(() => {}),
        AsyncStorage.removeItem(STORAGE_KEYS.themeMode).catch(() => {}),
      ]);
      onClose();
      router.replace('/onboarding');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { width: screenWidth }, backdropStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Закрити меню"
        />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: palette.background,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            borderRightColor: palette.surfaceBorder,
          },
          panelStyle,
        ]}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
            First Step
          </Text>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Закрити меню"
            accessibilityRole="button">
            <Text style={[styles.closeBtnText, { color: isDark ? Blue[300] : Blue[600] }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <AuthSection isDark={isDark} />
          <Divider palette={palette} />
          <StatsSection
            isDark={isDark}
            todayCount={todayCount}
            dailyGoal={dailyGoal}
            totalAnswered={totalAnswered}
            totalWrong={totalWrong}
            accuracy={accuracy}
            streak={streak}
          />
          <Divider palette={palette} />
          <LanguageSection isDark={isDark} />
          <Divider palette={palette} />
          <ThemeSection isDark={isDark} />
          <Divider palette={palette} />

          {/* Danger Zone */}
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.dangerBtn,
                { borderColor: palette.surfaceBorder },
                pressed && styles.dangerBtnPressed,
              ]}
              onPress={handleResetStats}
              accessibilityLabel="Скинути статистику"
              accessibilityRole="button">
              <Text
                style={[styles.dangerText, { color: palette.danger }]}
                maxFontSizeMultiplier={1.2}>
                🗑  Скинути статистику
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.dangerBtn,
                { borderColor: palette.surfaceBorder },
                pressed && styles.dangerBtnPressed,
              ]}
              onPress={handleStartOver}
              accessibilityLabel="Почати спочатку"
              accessibilityRole="button">
              <Text
                style={[styles.dangerText, { color: palette.danger }]}
                maxFontSizeMultiplier={1.2}>
                🔄  Почати спочатку
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Кастомний діалог підтвердження (замінює Alert.alert, який не працює на вебі) */}
      {pendingAction !== null && (
        <>
          <Pressable
            style={styles.dialogBackdrop}
            onPress={handleCancel}
            accessibilityLabel="Скасувати"
          />
          <View style={[styles.dialogCard, { backgroundColor: palette.background }]}>
            <Text
              style={[styles.dialogTitle, { color: palette.text }]}
              maxFontSizeMultiplier={1.2}>
              {DIALOG_CONFIG[pendingAction].title}
            </Text>
            <Text
              style={[styles.dialogMessage, { color: palette.mutedText }]}
              maxFontSizeMultiplier={1.2}>
              {DIALOG_CONFIG[pendingAction].message}
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.dialogBtn,
                  { borderColor: palette.surfaceBorder },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleCancel}
                accessibilityRole="button">
                <Text
                  style={[styles.dialogBtnText, { color: palette.text }]}
                  maxFontSizeMultiplier={1.2}>
                  Скасувати
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.dialogBtn,
                  styles.dialogBtnDestructive,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleConfirm}
                accessibilityRole="button">
                <Text
                  style={[styles.dialogBtnText, { color: '#fff' }]}
                  maxFontSizeMultiplier={1.2}>
                  {DIALOG_CONFIG[pendingAction].confirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </>
  );
}

function Divider({ palette }: { palette: { surfaceBorder: string } }) {
  return (
    <View style={[styles.divider, { backgroundColor: palette.surfaceBorder }]} />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 11,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  dangerBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dangerBtnPressed: {
    opacity: 0.65,
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // ─── Кастомний діалог ────────────────────────────────────────────────────────
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 20,
  },
  dialogCard: {
    position: 'absolute',
    zIndex: 21,
    left: 20,
    right: 20,
    top: '35%',
    borderRadius: 16,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 24,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  dialogMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dialogBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  dialogBtnDestructive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  dialogBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
