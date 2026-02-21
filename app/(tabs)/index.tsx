import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerButton } from '@/components/answer-button';
import { CelebrationModal } from '@/components/celebration-modal';
import { DrawerPanel } from '@/components/drawer-panel';
import { ThemedText } from '@/components/themed-text';
import {
  PROGRESS_BAR_TIMING_MS,
  QUIZ_ADVANCE_DELAY_MS,
  SWIPE_OPEN_EDGE,
  SWIPE_THRESHOLD,
} from '@/constants/ui';
import { Blue, Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { useStatsContext } from '@/contexts/stats-context';
import { useDevice } from '@/hooks/use-device';
import { useDrawer } from '@/hooks/use-drawer';
import { useQuiz } from '@/hooks/use-quiz';
import type { ButtonState } from '@/components/answer-button';

export default function HomeScreen() {
  const {
    currentWord,
    options,
    selected,
    isCorrect,
    readyToAdvance,
    hint,
    queueIndex,
    poolSize,
    selectAnswer,
    nextWord,
    skipWord,
    revealHint,
    resetQuiz,
  } = useQuiz();

  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;

  const { todayCount, dailyGoal, addAnswer, reloadDailyGoal } = useStatsContext();
  const { horizontalPadding } = useDevice();
  const drawer = useDrawer();

  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationShownRef = useRef(false);

  // Re-read dailyGoal from storage on focus (picks up goal set during onboarding)
  useFocusEffect(
    useCallback(() => {
      reloadDailyGoal();
      celebrationShownRef.current = false;
    }, [reloadDailyGoal]),
  );

  // Auto-advance to next word after QUIZ_ADVANCE_DELAY_MS
  useEffect(() => {
    if (!readyToAdvance) return;
    const timer = setTimeout(nextWord, QUIZ_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [readyToAdvance, nextWord]);

  // Show celebration modal when daily goal is first reached today
  useEffect(() => {
    if (celebrationShownRef.current) return;
    if (dailyGoal > 0 && todayCount >= dailyGoal) {
      const timer = setTimeout(() => {
        setShowCelebration(true);
        celebrationShownRef.current = true;
      }, QUIZ_ADVANCE_DELAY_MS + 100);
      return () => clearTimeout(timer);
    }
  }, [todayCount, dailyGoal]);

  // Animated progress bar
  const progressRatio = Math.min(todayCount / Math.max(dailyGoal, 1), 1);
  const progressAnim = useSharedValue(progressRatio);
  useEffect(() => {
    progressAnim.value = withTiming(progressRatio, { duration: PROGRESS_BAR_TIMING_MS });
    // progressAnim is a stable shared value — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressRatio]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as `${number}%`,
  }));

  const handleAnswer = (option: string) => {
    if (selected !== null) return;
    const correct = option === currentWord.ua;
    selectAnswer(option);
    addAnswer(correct);
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const getButtonState = (option: string): ButtonState => {
    if (selected === null) return 'idle';
    if (option === currentWord.ua) return 'correct';
    if (option === selected) return 'wrong';
    return 'disabled';
  };

  // Swipe from left edge to open drawer
  const openDrawerGesture = Gesture.Pan().onEnd((e) => {
    const startX = e.absoluteX - e.translationX;
    if (e.translationX > SWIPE_THRESHOLD && startX < SWIPE_OPEN_EDGE) {
      runOnJS(drawer.open)();
    }
  });

  return (
    <GestureDetector gesture={openDrawerGesture}>
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
        {/* Drawer panel — absolute overlay */}
        <DrawerPanel
          isOpen={drawer.isOpen}
          onClose={drawer.close}
          onResetQuiz={resetQuiz}
          todayCount={todayCount}
          dailyGoal={dailyGoal}
        />

        {/* Main content — padded responsively */}
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          {/* Feedback row + menu button */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.6 }]}
              onPress={drawer.open}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Відкрити меню"
              accessibilityRole="button">
              <Text
                style={[styles.menuIcon, { color: isDark ? Blue[300] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                ☰
              </Text>
            </Pressable>

            <View style={styles.feedbackSlot} accessibilityLiveRegion="polite">
              {isCorrect === true && (
                <Text
                  style={[styles.feedbackOk, { color: palette.success }]}
                  maxFontSizeMultiplier={1.2}
                  accessibilityLabel="Правильно">
                  ✓ Правильно!
                </Text>
              )}
              {isCorrect === false && (
                <Text
                  style={[styles.feedbackErr, { color: palette.danger }]}
                  maxFontSizeMultiplier={1.2}
                  accessibilityLabel="Неправильно">
                  ✗ Неправильно
                </Text>
              )}
            </View>
          </View>

          {/* Daily progress bar */}
          <View style={styles.progressWrapper}>
            <View
              style={[styles.progressTrack, { backgroundColor: palette.surface }]}
              accessibilityRole="progressbar"
              accessibilityLabel={`Денний прогрес: ${todayCount} з ${dailyGoal} слів`}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: isDark ? Blue[400] : Blue[600] },
                  progressStyle,
                ]}
              />
            </View>
            <Text
              style={[styles.progressLabel, { color: isDark ? Blue[300] : Blue[600] }]}
              maxFontSizeMultiplier={1.2}>
              {todayCount} / {dailyGoal} слів сьогодні
            </Text>
          </View>

          {/* Word card */}
          <View
            style={[
              styles.wordCard,
              {
                backgroundColor: palette.surface,
                borderColor: isDark ? Blue[700] : Blue[400],
              },
            ]}>
            <ThemedText
              type="title"
              style={styles.wordText}
              adjustsFontSizeToFit
              numberOfLines={1}>
              {currentWord.en}
            </ThemedText>
            <Text
              style={[styles.queueLabel, { color: palette.mutedText }]}
              maxFontSizeMultiplier={1.2}>
              {queueIndex + 1} / {poolSize}
            </Text>
            {hint !== null && (
              <Text
                style={[styles.hintText, { color: isDark ? Blue[300] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                Підказка: {hint}
              </Text>
            )}
          </View>

          {/* Auxiliary row: Hint + Skip (hidden after answering) */}
          {selected === null && (
            <View style={styles.auxRow}>
              {hint === null && (
                <Pressable
                  style={({ pressed }) => [
                    styles.auxBtn,
                    { borderColor: palette.surfaceBorder },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={revealHint}
                  accessibilityLabel="Показати підказку"
                  accessibilityRole="button">
                  <Text
                    style={[styles.auxBtnText, { color: palette.mutedText }]}
                    maxFontSizeMultiplier={1.2}>
                    💡 Підказка
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.auxBtn,
                  { borderColor: palette.surfaceBorder },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={skipWord}
                accessibilityLabel="Пропустити слово"
                accessibilityRole="button">
                <Text
                  style={[styles.auxBtnText, { color: palette.mutedText }]}
                  maxFontSizeMultiplier={1.2}>
                  Пропустити →
                </Text>
              </Pressable>
            </View>
          )}

          {/* Answer options */}
          <View>
            {options.map((option) => (
              <AnswerButton
                key={option}
                label={option}
                state={getButtonState(option)}
                onPress={() => handleAnswer(option)}
              />
            ))}
          </View>
        </View>

        {/* Daily goal celebration */}
        <CelebrationModal
          visible={showCelebration}
          goal={dailyGoal}
          onDismiss={() => setShowCelebration(false)}
        />
      </SafeAreaView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  menuBtn: {
    paddingVertical: 4,
    paddingRight: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 22,
    fontWeight: '600',
  },
  feedbackSlot: {
    flex: 1,
    alignItems: 'flex-end',
  },
  feedbackOk: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackErr: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressWrapper: {
    marginBottom: 14,
    gap: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  wordCard: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  wordText: {
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 1,
  },
  queueLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },
  auxRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  auxBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  auxBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
