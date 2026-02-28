import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { AnswerButton } from '@/components/answer-button';
import { CelebrationModal } from '@/components/celebration-modal';
import { DrawerPanel } from '@/components/drawer-panel';
import { ReminderBanner } from '@/components/reminder-banner';
import { ThemedText } from '@/components/themed-text';
import {
  PROGRESS_BAR_TIMING_MS,
  QUIZ_ADVANCE_DELAY_MS,
  SWIPE_OPEN_EDGE,
  SWIPE_THRESHOLD,
} from '@/constants/ui';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import type { WordCategory, TargetLanguage } from '@/constants/words';
import { useAppTheme } from '@/contexts/theme-context';
import { useStatsContext } from '@/contexts/stats-context';
import { useLanguage } from '@/contexts/language-context';
import { useDevice } from '@/hooks/use-device';
import { useDrawer } from '@/hooks/use-drawer';
import { usePushReminders } from '@/hooks/use-push-reminders';
import { useQuiz, normalizeDirection, type QuizDirection } from '@/hooks/use-quiz';
import { useReminderSettings } from '@/hooks/use-reminder-settings';
import { useSound } from '@/hooks/use-sound';
import { getReminderType } from '@/utils/reminder-logic';
import type { ButtonState } from '@/components/answer-button';

export default function HomeScreen() {
  const [category, setCategory] = useState<WordCategory | undefined>(undefined);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [optionsCount, setOptionsCount] = useState<4 | 6 | 8>(6);
  const [quizDirection, setQuizDirection] = useState<QuizDirection>('forward');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('en');

  const {
    currentWord,
    options,
    selected,
    readyToAdvance,
    hintedOutOptions,
    queueIndex,
    poolSize,
    selectAnswer,
    nextWord,
    skipWord,
    revealHint,
    resetQuiz,
  } = useQuiz(category, optionsCount, quizDirection, targetLanguage);

  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;

  const { todayCount, dailyGoal, streak, lastActiveDate, addAnswer, reloadDailyGoal, isLoaded } =
    useStatsContext();
  const { horizontalPadding } = useDevice();
  const drawer = useDrawer();
  const { soundEnabled, speak, toggleSound } = useSound();
  const { strings: s } = useLanguage();

  const reminder = useReminderSettings();
  const { requestPermissions, scheduleDaily, cancelScheduled } = usePushReminders();

  const reminderType = reminder.isLoaded
    ? getReminderType({
        reminderEnabled: reminder.reminderEnabled,
        lastReminderDate: reminder.lastReminderDate,
        snoozedUntil: reminder.snoozedUntil,
        todayCount,
        dailyGoal,
        streak,
        lastActiveDate,
      })
    : null;

  const handleReminderEnabledChange = useCallback(
    async (val: boolean) => {
      await reminder.setReminderEnabled(val);
      if (val) {
        const granted = await requestPermissions();
        if (granted) await scheduleDaily(reminder.reminderTime, reminder.reminderDays);
      } else {
        await cancelScheduled();
      }
    },
    [reminder, requestPermissions, scheduleDaily, cancelScheduled],
  );

  const handleReminderTimeChange = useCallback(
    async (time: string) => {
      await reminder.setReminderTime(time);
      if (reminder.reminderEnabled) await scheduleDaily(time, reminder.reminderDays);
    },
    [reminder, scheduleDaily],
  );

  const handleReminderDaysChange = useCallback(
    async (days: number[]) => {
      await reminder.setReminderDays(days);
      if (reminder.reminderEnabled) await scheduleDaily(reminder.reminderTime, days);
    },
    [reminder, scheduleDaily],
  );

  // Prevents double-counting stats when two taps arrive before React flushes state
  const answeredRef = useRef(false);

  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationShownDateRef = useRef('');

  // Load persisted quiz settings on mount
  useEffect(() => {
    AsyncStorage.multiGet([
      STORAGE_KEYS.wordCategory,
      STORAGE_KEYS.autoAdvance,
      STORAGE_KEYS.celebrationShownDate,
      STORAGE_KEYS.optionsCount,
      STORAGE_KEYS.quizDirection,
      STORAGE_KEYS.targetLanguage,
    ])
      .then((entries) => {
        const get = (key: string) => entries.find(([k]) => k === key)?.[1];
        const cat = get(STORAGE_KEYS.wordCategory);
        const adv = get(STORAGE_KEYS.autoAdvance);
        const cel = get(STORAGE_KEYS.celebrationShownDate);
        const opts = get(STORAGE_KEYS.optionsCount);
        const dir = get(STORAGE_KEYS.quizDirection);
        const tgt = get(STORAGE_KEYS.targetLanguage);
        if (cat) setCategory(cat as WordCategory);
        if (adv !== null && adv !== undefined) setAutoAdvance(adv !== 'false');
        if (cel) celebrationShownDateRef.current = cel;
        if (opts === '4' || opts === '8') setOptionsCount(opts === '4' ? 4 : 8);
        setQuizDirection(normalizeDirection(dir));
        if (tgt === 'es' || tgt === 'de') setTargetLanguage(tgt);
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

  const handleOptionsCountChange = useCallback(async (val: 4 | 6 | 8) => {
    setOptionsCount(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.optionsCount, String(val));
    } catch (e) {
      console.warn('[home] failed to persist optionsCount', e);
    }
  }, []);

  const handleQuizDirectionChange = useCallback(async (val: QuizDirection) => {
    setQuizDirection(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.quizDirection, val);
    } catch (e) {
      console.warn('[home] failed to persist quizDirection', e);
    }
  }, []);

  const handleTargetLanguageChange = useCallback(async (val: TargetLanguage) => {
    setTargetLanguage(val);
    setQuizDirection('forward');
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.targetLanguage, val],
        [STORAGE_KEYS.quizDirection, 'forward'],
      ]);
    } catch (e) {
      console.warn('[home] failed to persist targetLanguage', e);
    }
  }, []);

  // Re-read dailyGoal from storage on focus
  useFocusEffect(
    useCallback(() => {
      reloadDailyGoal();
    }, [reloadDailyGoal]),
  );

  // Auto-advance to next word after QUIZ_ADVANCE_DELAY_MS
  useEffect(() => {
    if (!readyToAdvance || !autoAdvance) return;
    const timer = setTimeout(nextWord, QUIZ_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [readyToAdvance, nextWord, autoAdvance]);

  // Show celebration modal once per day when daily goal is first reached
  useEffect(() => {
    if (dailyGoal <= 0 || todayCount < dailyGoal) return;
    const today = new Date().toISOString().slice(0, 10);
    if (celebrationShownDateRef.current === today) return;
    const timer = setTimeout(() => {
      celebrationShownDateRef.current = today;
      AsyncStorage.setItem(STORAGE_KEYS.celebrationShownDate, today).catch(() => {});
      setShowCelebration(true);
    }, QUIZ_ADVANCE_DELAY_MS + 100);
    return () => clearTimeout(timer);
  }, [todayCount, dailyGoal]);

  // Reset double-tap guard whenever a new word is shown
  useEffect(() => {
    answeredRef.current = false;
  }, [currentWord]);

  // Maps TargetLanguage to BCP-47 TTS code
  const ttsLang = (lang: TargetLanguage): string => {
    if (lang === 'es') return 'es-ES';
    if (lang === 'de') return 'de-DE';
    return 'en-US';
  };

  // Auto-pronounce whenever a new word appears — language depends on quiz direction
  useEffect(() => {
    if (!currentWord) return;
    if (quizDirection === 'reverse') {
      speak(currentWord.ua, 'uk-UA');
    } else {
      speak(currentWord.target, ttsLang(targetLanguage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord]);

  // ─── Animated progress bar (width + color) ──────────────────────────────────

  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal;
  const progressRatio = Math.min(todayCount / Math.max(dailyGoal, 1), 1);
  const progressAnim = useSharedValue(progressRatio);
  const colorAnim = useSharedValue(goalReached ? 1 : 0);

  useEffect(() => {
    progressAnim.value = withTiming(progressRatio, { duration: PROGRESS_BAR_TIMING_MS });
    // progressAnim is a stable shared value — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressRatio]);

  useEffect(() => {
    colorAnim.value = withTiming(goalReached ? 1 : 0, { duration: 600 });
    // colorAnim is a stable shared value — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalReached]);

  const progressBlueColor = isDark ? Blue[400] : Blue[600];
  const progressGreenColor = palette.success;

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as `${number}%`,
    backgroundColor: interpolateColor(
      colorAnim.value,
      [0, 1],
      [progressBlueColor, progressGreenColor],
    ),
  }));

  // ─── Word card green flash on correct answer ─────────────────────────────────

  const cardHighlight = useSharedValue(0);

  const cardHighlightStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      cardHighlight.value,
      [0, 1],
      ['transparent', 'rgba(34,197,94,0.12)'],
    ),
  }));

  // ─── Word entrance animation ─────────────────────────────────────────────────

  const wordEntranceY = useSharedValue(-8);
  const wordEntranceOpacity = useSharedValue(0);

  useEffect(() => {
    wordEntranceY.value = -8;
    wordEntranceOpacity.value = 0;
    wordEntranceY.value = withSpring(0, { damping: 20, stiffness: 200 });
    wordEntranceOpacity.value = withTiming(1, { duration: 200 });
    // wordEntranceY and wordEntranceOpacity are stable shared values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord]);

  const wordEntranceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wordEntranceY.value }],
    opacity: wordEntranceOpacity.value,
  }));

  // ─── Answer handling ─────────────────────────────────────────────────────────

  const handleAnswer = (option: string) => {
    if (selected !== null || answeredRef.current || !isLoaded || !currentWord) return;
    answeredRef.current = true;
    const correctAnswer = quizDirection === 'forward' ? currentWord.ua : currentWord.target;
    const correct = option === correctAnswer;
    selectAnswer(option);
    addAnswer(correct);
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      cardHighlight.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 350 }),
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const getButtonState = (option: string): ButtonState => {
    if (selected === null) {
      if (hintedOutOptions.includes(option)) return 'disabled';
      return 'idle';
    }
    const correctAnswer = quizDirection === 'forward' ? currentWord?.ua : currentWord?.target;
    if (option === correctAnswer) return 'correct';
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
          optionsCount={optionsCount}
          onOptionsCountChange={handleOptionsCountChange}
          quizDirection={quizDirection}
          onQuizDirectionChange={handleQuizDirectionChange}
          targetLanguage={targetLanguage}
          onTargetLanguageChange={handleTargetLanguageChange}
          reminderEnabled={reminder.reminderEnabled}
          reminderTime={reminder.reminderTime}
          reminderDays={reminder.reminderDays}
          onReminderEnabledChange={handleReminderEnabledChange}
          onReminderTimeChange={handleReminderTimeChange}
          onReminderDaysChange={handleReminderDaysChange}
        />

        {/* Main content — padded responsively */}
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          {/* Header: menu button */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.menuBtn,
                (pressed || drawer.isOpen) && { opacity: 0.5 },
              ]}
              onPress={drawer.open}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={s.openMenu}
              accessibilityRole="button"
              accessibilityState={{ expanded: drawer.isOpen }}>
              <MaterialIcons name="menu" size={24} color={isDark ? Blue[300] : Blue[600]} />
            </Pressable>
          </View>

          {/* Daily progress bar */}
          <View style={styles.progressWrapper}>
            <View style={styles.progressLabelRow}>
              <Text
                style={[styles.progressGoalLabel, { color: isDark ? Blue[300] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                {s.dailyGoalLabel}
              </Text>
              <Text
                style={[styles.progressLabel, { color: isDark ? Blue[300] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                {todayCount} / {dailyGoal}
              </Text>
            </View>
            <View
              style={[styles.progressTrack, { backgroundColor: palette.surface }]}
              accessibilityRole="progressbar"
              accessibilityLabel={s.progressA11y(todayCount, dailyGoal)}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
          </View>

          {/* Reminder banner */}
          {reminderType && !drawer.isOpen && (
            <ReminderBanner
              type={reminderType}
              streak={streak}
              dailyGoal={dailyGoal}
              isDark={isDark}
              onDismiss={reminder.dismissForToday}
              onSnooze={() => reminder.snooze(2)}
            />
          )}

          {/* Skeleton while loading */}
          {!isLoaded ? (
            <>
              <View
                style={[
                  styles.wordCard,
                  styles.skeletonCard,
                  { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
                ]}
              />
              <View style={styles.optionsGrid}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.skeletonBtn,
                      { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
                    ]}
                  />
                ))}
              </View>
            </>
          ) : !currentWord ? (
            /* Empty state */
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={palette.mutedText} />
              <Text style={[styles.emptyText, { color: palette.mutedText }]}>{s.noWords}</Text>
            </View>
          ) : (
            <>
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
                onPress={() =>
                  quizDirection === 'reverse'
                    ? speak(currentWord.ua, 'uk-UA')
                    : speak(currentWord.target, ttsLang(targetLanguage))
                }
                accessibilityLabel={s.pronounceA11y(
                  quizDirection === 'reverse' ? currentWord.ua : currentWord.target,
                )}
                accessibilityRole="button">
                {/* Green flash overlay on correct answer */}
                <Animated.View
                  style={[StyleSheet.absoluteFillObject, styles.cardOverlay, cardHighlightStyle]}
                  pointerEvents="none"
                />

                {/* Word + queue with entrance animation */}
                <Animated.View style={[styles.wordContent, wordEntranceStyle]}>
                  <ThemedText
                    type="title"
                    style={styles.wordText}
                    adjustsFontSizeToFit
                    numberOfLines={1}>
                    {quizDirection === 'forward' ? currentWord.target : currentWord.ua}
                  </ThemedText>
                  {quizDirection === 'forward' && (
                    <Text
                      style={[styles.transcriptionText, { color: palette.mutedText }]}
                      maxFontSizeMultiplier={1.2}>
                      {currentWord.transcription}
                    </Text>
                  )}
                  <Text
                    style={[styles.queueLabel, { color: palette.mutedText }]}
                    maxFontSizeMultiplier={1.2}>
                    {queueIndex + 1} / {poolSize}
                  </Text>
                </Animated.View>

                {/* Sound toggle — top-right corner */}
                <Pressable
                  style={({ pressed }) => [
                    styles.cardCornerBtn,
                    styles.cardCornerBtnTR,
                    pressed && { opacity: 0.5 },
                  ]}
                  onPress={toggleSound}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={soundEnabled ? s.soundOff : s.soundOn}
                  accessibilityRole="button"
                  accessibilityState={{ checked: soundEnabled }}>
                  <MaterialIcons
                    name={soundEnabled ? 'volume-up' : 'volume-off'}
                    size={18}
                    color={isDark ? Blue[300] : Blue[500]}
                  />
                </Pressable>

                {/* Hint button — bottom-left */}
                {hintedOutOptions.length === 0 && selected === null && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.cardCornerBtn,
                      styles.cardCornerBtnBL,
                      pressed && { opacity: 0.5 },
                    ]}
                    onPress={revealHint}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={s.showHint}
                    accessibilityRole="button">
                    <MaterialIcons
                      name="lightbulb"
                      size={18}
                      color={isDark ? Blue[300] : Blue[500]}
                    />
                  </Pressable>
                )}

                {/* Skip button — bottom-right */}
                {selected === null && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.cardCornerBtn,
                      styles.cardCornerBtnBR,
                      pressed && { opacity: 0.5 },
                    ]}
                    onPress={skipWord}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={s.skipWord}
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
                    accessibilityLabel={s.nextWord}
                    accessibilityRole="button">
                    <Text style={styles.nextBtnText} maxFontSizeMultiplier={1.2}>
                      {s.nextWordBtn}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Answer options — 2×3 grid */}
              <View style={styles.optionsGrid}>
                {options.map((option, i) => (
                  <AnswerButton
                    key={option}
                    label={option}
                    state={getButtonState(option)}
                    onPress={() => handleAnswer(option)}
                    index={i}
                  />
                ))}
              </View>
            </>
          )}
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
  progressWrapper: {
    marginBottom: 14,
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressGoalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  wordCard: {
    borderWidth: 2,
    borderRadius: 16,
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardOverlay: {
    borderRadius: 14,
  },
  wordContent: {
    alignItems: 'center',
  },
  wordText: {
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 1,
    ...Platform.select({ ios: { fontFamily: 'ui-rounded' }, default: {} }),
  },
  transcriptionText: {
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 2,
    letterSpacing: 0.5,
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
  cardCornerBtnTR: {
    top: 8,
    right: 10,
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
  optionsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  skeletonCard: {
    height: 140,
  },
  skeletonBtn: {
    width: '100%',
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
