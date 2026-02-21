import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerButton } from '@/components/answer-button';
import { DrawerPanel } from '@/components/drawer-panel';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/contexts/theme-context';
import { Blue, Colors } from '@/constants/theme';
import { useDailyProgress } from '@/hooks/use-daily-progress';
import { useDevice } from '@/hooks/use-device';
import { useDrawer } from '@/hooks/use-drawer';
import { useQuiz } from '@/hooks/use-quiz';
import { useStatsContext } from '@/contexts/stats-context';
import type { ButtonState } from '@/components/answer-button';

export default function HomeScreen() {
  const { currentWord, options, selected, isCorrect, score, total, selectAnswer, nextWord } =
    useQuiz();

  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;

  const { todayCount, dailyGoal, incrementTodayCount, reload: reloadProgress } = useDailyProgress();
  const { addResult } = useStatsContext();
  const { horizontalPadding } = useDevice();
  const drawer = useDrawer();

  // Re-read persisted values every time this screen comes into focus
  useFocusEffect(useCallback(() => {
    reloadProgress();
  }, [reloadProgress]));

  const handleAnswer = (option: string) => {
    if (selected !== null) return;
    selectAnswer(option);
    incrementTodayCount();
    addResult(option === currentWord.ua);
  };

  const getButtonState = (option: string): ButtonState => {
    if (selected === null) return 'idle';
    if (option === currentWord.ua) return 'correct';
    if (option === selected) return 'wrong';
    return 'disabled';
  };

  const progressRatio = Math.min(todayCount / Math.max(dailyGoal, 1), 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      {/* Drawer panel — absolute overlay */}
      <DrawerPanel
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        todayCount={todayCount}
        dailyGoal={dailyGoal}
      />

      {/* Main content — padded responsively */}
      <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>

        {/* Рядок рахунку + кнопка меню */}
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

          <Text
            style={[styles.score, { color: isDark ? Blue[300] : Blue[700] }]}
            maxFontSizeMultiplier={1.2}>
            {score} / {total}
          </Text>

          <View style={styles.feedbackSlot}>
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

        {/* Денний прогрес */}
        <View style={styles.progressWrapper}>
          <View
            style={[styles.progressTrack, { backgroundColor: palette.surface }]}
            accessibilityRole="progressbar"
            accessibilityLabel={`Денний прогрес: ${todayCount} з ${dailyGoal} слів`}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressRatio * 100}%`,
                  backgroundColor: isDark ? Blue[400] : Blue[600],
                },
              ]}
            />
          </View>
          <Text
            style={[styles.progressLabel, { color: isDark ? Blue[300] : Blue[600] }]}
            maxFontSizeMultiplier={1.2}>
            {todayCount} / {dailyGoal} слів сьогодні
          </Text>
        </View>

        {/* Картка зі словом */}
        <View
          style={[
            styles.wordCard,
            {
              backgroundColor: palette.surface,
              borderColor: isDark ? Blue[700] : Blue[400],
            },
          ]}>
          <ThemedText type="title" style={styles.wordText}>
            {currentWord.en}
          </ThemedText>
        </View>

        {/* Варіанти відповідей */}
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

        {/* Кнопка «Далі» */}
        {selected !== null && (
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              { backgroundColor: isDark ? Blue[500] : Blue[600] },
              pressed && styles.nextPressed,
            ]}
            onPress={nextWord}
            accessibilityLabel="Наступне слово"
            accessibilityRole="button">
            <Text style={styles.nextText} maxFontSizeMultiplier={1.2}>Далі →</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
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
  score: {
    fontSize: 16,
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
    marginBottom: 20,
  },
  wordText: {
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 1,
  },
  nextButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextPressed: {
    opacity: 0.8,
  },
  nextText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
