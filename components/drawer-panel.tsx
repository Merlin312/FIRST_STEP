import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BACKDROP_CLOSE_TIMING,
  BACKDROP_OPEN_TIMING,
  DRAWER_WIDTH,
  PANEL_SPRING,
  SWIPE_THRESHOLD,
} from '@/constants/ui';
import { Blue, Colors } from '@/constants/theme';
import type { WordCategory } from '@/constants/words';
import { useAppTheme } from '@/contexts/theme-context';
import { useStatsContext } from '@/contexts/stats-context';

import { SettingsSection } from '@/components/drawer/settings-section';
import { StatsSection } from '@/components/drawer/stats-section';
import { UpcomingSection } from '@/components/drawer/upcoming-section';

interface DrawerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResetQuiz?: () => void;
  todayCount: number;
  dailyGoal: number;
  category: WordCategory | undefined;
  onCategoryChange: (cat: WordCategory | undefined) => void;
  autoAdvance: boolean;
  onAutoAdvanceChange: (val: boolean) => void;
}

export function DrawerPanel({
  isOpen,
  onClose,
  onResetQuiz,
  todayCount,
  dailyGoal,
  category,
  onCategoryChange,
  autoAdvance,
  onAutoAdvanceChange,
}: DrawerPanelProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { totalAnswered, totalWrong, streak, accuracy } = useStatsContext();

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(isOpen ? 0 : -DRAWER_WIDTH, PANEL_SPRING);
    backdropOpacity.value = withTiming(
      isOpen ? 0.5 : 0,
      isOpen ? BACKDROP_OPEN_TIMING : BACKDROP_CLOSE_TIMING,
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

  // Swipe left to close the panel
  const swipeCloseGesture = Gesture.Pan().onEnd((e) => {
    if (e.translationX < -SWIPE_THRESHOLD) {
      runOnJS(onClose)();
    }
  });

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

      {/* Panel — swipe left to close */}
      <GestureDetector gesture={swipeCloseGesture}>
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
            <Text
              style={[styles.panelTitle, { color: palette.text }]}
              maxFontSizeMultiplier={1.2}>
              First Step
            </Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Закрити меню"
              accessibilityRole="button">
              <Text style={[styles.closeBtnText, { color: isDark ? Blue[300] : Blue[600] }]}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
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
            <SettingsSection
              isDark={isDark}
              category={category}
              onCategoryChange={onCategoryChange}
              autoAdvance={autoAdvance}
              onAutoAdvanceChange={onAutoAdvanceChange}
              onClose={onClose}
              onResetQuiz={onResetQuiz}
            />
            <Divider palette={palette} />
            <UpcomingSection isDark={isDark} />
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

function Divider({ palette }: { palette: { surfaceBorder: string } }) {
  return <View style={[styles.divider, { backgroundColor: palette.surfaceBorder }]} />;
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
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
});
