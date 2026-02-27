import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import type { WordCategory } from '@/constants/words';
import { useAppTheme } from '@/contexts/theme-context';
import { useStatsContext } from '@/contexts/stats-context';
import { useDevice } from '@/hooks/use-device';
import { useDrawer } from '@/hooks/use-drawer';
import { useQuiz } from '@/hooks/use-quiz';
import { useSound } from '@/hooks/use-sound';
import type { ButtonState } from '@/components/answer-button';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [category, setCategory] = useState<WordCategory | undefined>(undefined);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const {
    currentWord,
    options,
    selected,
    readyToAdvance,
    hint,
    queueIndex,
    poolSize,
    selectAnswer,
    nextWord,
    skipWord,
    revealHint,
    resetQuiz,
  } = useQuiz(category);

  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;

  const { todayCount, dailyGoal, addAnswer, reloadDailyGoal, isLoaded } = useStatsContext();
  const { horizontalPadding } = useDevice();
  const drawer = useDrawer();
  const { soundEnabled, speak, toggleSound } = useSound();

  const [showCelebration, setShowCelebration] = useState(false);
  // Stores the ISO date ('YYYY-MM-DD') when the celebration was last shown.
  // Persisted to AsyncStorage so it survives component unmounts within the same day.
  const celebrationShownDateRef = useRef('');

  // Load persisted quiz settings on mount
  useEffect(() => {
    AsyncStorage.multiGet([
      STORAGE_KEYS.wordCategory,
      STORAGE_KEYS.autoAdvance,
      STORAGE_KEYS.celebrationShownDate,
    ])
      .then((entries) => {
        // Lookup by key — avoids relying on positional array order
        const cat = entries.find(([k]) => k === STORAGE_KEYS.wordCategory)?.[1];
        const adv = entries.find(([k]) => k === STORAGE_KEYS.autoAdvance)?.[1];
        const cel = entries.find(([k]) => k === STORAGE_KEYS.celebrationShownDate)?.[1];
        if (cat) setCategory(cat as WordCategory);
        if (adv !== null && adv !== undefined) setAutoAdvance(adv !== 'false');
        if (cel) celebrationShownDateRef.current = cel;
      })
      .catch(() => {});
  }, []);

  const handleCategoryChange = useCallback(async (cat: WordCategory | undefined) => {
    setCategory(cat);
    try {
      if (cat) {
        await AsyncStorage.setItem(STORAGE_KEYS.wordCategory, cat);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.wordCategory);
      }
    } catch (e) {
      console.warn('[home] failed to persist category', e);
    }
  }, []);

  const handleAutoAdvanceChange = useCallback(async (val: boolean) => {
    setAutoAdvance(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.autoAdvance, String(val));
    } catch (e) {
      console.warn('[home] failed to persist autoAdvance', e);
    }
  }, []);

  // Re-read dailyGoal from storage on focus (picks up goal set during onboarding)
  useFocusEffect(
    useCallback(() => {
      reloadDailyGoal();
      // Celebration tracking is date-based (celebrationShownDateRef), no reset needed here
    }, [reloadDailyGoal]),
  );

  // Auto-advance to next word after QUIZ_ADVANCE_DELAY_MS (only when autoAdvance is on)
  useEffect(() => {
    if (!readyToAdvance || !autoAdvance) return;
    const timer = setTimeout(nextWord, QUIZ_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [readyToAdvance, nextWord, autoAdvance]);

  // Show celebration modal once per day when daily goal is first reached
  useEffect(() => {
    if (dailyGoal <= 0 || todayCount < dailyGoal) return;
    const today = new Date().toISOString().slice(0, 10);
    if (celebrationShownDateRef.current === today) return; // already shown today
    const timer = setTimeout(() => {
      celebrationShownDateRef.current = today;
      AsyncStorage.setItem(STORAGE_KEYS.celebrationShownDate, today).catch(() => {});
      setShowCelebration(true);
    }, QUIZ_ADVANCE_DELAY_MS + 100);
    return () => clearTimeout(timer);
  }, [todayCount, dailyGoal]);

  // Auto-pronounce the English word whenever a new word appears
  useEffect(() => {
    if (currentWord) speak(currentWord.en);
    // speak is memoized on soundEnabled; intentionally omit it to avoid re-firing on toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord]);

  // Animated progress bar
  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal;
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
    if (selected !== null || !isLoaded || !currentWord) return;
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
    if (option === currentWord?.ua) return 'correct';
    if (option === selected) return 'wrong';
    return 'disabled';
  };

  // Swipe from left edge to open drawer — memoized to avoid re-registering on every render
  const openDrawerGesture = useMemo(
    () =>
      Gesture.Pan().onEnd((e) => {
        const startX = e.absoluteX - e.translationX;
        if (e.translationX > SWIPE_THRESHOLD && startX < SWIPE_OPEN_EDGE) {
          runOnJS(drawer.open)();
        }
      }),
    [drawer.open],
  );

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
          category={category}
          onCategoryChange={handleCategoryChange}
          autoAdvance={autoAdvance}
          onAutoAdvanceChange={handleAutoAdvanceChange}
        />

        {/* Main content — padded responsively */}
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          {/* Feedback row + menu button */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.menuBtn,
                (pressed || drawer.isOpen) && { opacity: 0.5 },
              ]}
              onPress={drawer.open}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Відкрити меню"
              accessibilityRole="button"
              accessibilityState={{ expanded: drawer.isOpen }}>
              <Text
                style={[styles.menuIcon, { color: isDark ? Blue[300] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                ☰
              </Text>
            </Pressable>

            <View style={styles.feedbackSlot}>
              <Pressable
                style={({ pressed }) => [styles.soundBtn, pressed && { opacity: 0.5 }]}
                onPress={toggleSound}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
                accessibilityRole="button"
                accessibilityState={{ checked: soundEnabled }}>
                <MaterialIcons
                  name={soundEnabled ? 'volume-up' : 'volume-off'}
                  size={24}
                  color={isDark ? Blue[300] : Blue[600]}
                />
              </Pressable>
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
                  { backgroundColor: goalReached ? '#22c55e' : isDark ? Blue[400] : Blue[600] },
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

          {/* Word card — tap to pronounce */}
          <Pressable
            style={({ pressed }) => [
              styles.wordCard,
              {
                backgroundColor: palette.surface,
                borderColor: isDark ? Blue[700] : Blue[400],
              },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => currentWord && speak(currentWord.en)}
            accessibilityLabel={`Вимовити слово ${currentWord?.en ?? ''}`}
            accessibilityRole="button">
            <ThemedText type="title" style={styles.wordText} adjustsFontSizeToFit numberOfLines={1}>
              {currentWord?.en ?? ''}
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
            {hint === null && selected === null && (
              <Pressable
                style={({ pressed }) => [
                  styles.cardCornerBtn,
                  styles.cardCornerBtnBL,
                  pressed && { opacity: 0.5 },
                ]}
                onPress={revealHint}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Показати підказку"
                accessibilityRole="button">
                <MaterialIcons name="lightbulb" size={18} color={isDark ? Blue[300] : Blue[500]} />
              </Pressable>
            )}
            {selected === null && (
              <Pressable
                style={({ pressed }) => [
                  styles.cardCornerBtn,
                  styles.cardCornerBtnBR,
                  pressed && { opacity: 0.5 },
                ]}
                onPress={skipWord}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Пропустити слово"
                accessibilityRole="button">
                <MaterialIcons
                  name="arrow-forward"
                  size={18}
                  color={isDark ? Blue[300] : Blue[500]}
                />
              </Pressable>
            )}
          </Pressable>

          {/* Manual advance button — shown after answering when autoAdvance is off */}
          {selected !== null && !autoAdvance && (
            <View style={styles.auxRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.nextBtn,
                  { backgroundColor: Blue[600] },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={nextWord}
                accessibilityLabel="Наступне слово"
                accessibilityRole="button">
                <Text style={styles.nextBtnText} maxFontSizeMultiplier={1.2}>
                  Далі →
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
  soundBtn: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 28,
    paddingBottom: 44,
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
  cardCornerBtn: {
    position: 'absolute',
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCornerBtnBL: {
    bottom: 8,
    left: 10,
  },
  cardCornerBtnBR: {
    bottom: 8,
    right: 10,
  },
  nextBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
