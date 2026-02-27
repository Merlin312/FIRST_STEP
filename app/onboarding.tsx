import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, ButtonColors, Colors, Slate } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

// Stable reference — never changes between renders, so FlatList never resets scroll
const SLIDE_KEYS = ['intro', 'how', 'goal'] as const;
type SlideKey = (typeof SLIDE_KEYS)[number];

const GOALS = [10, 20, 50] as const;
type Goal = (typeof GOALS)[number];

// ─── Slide 1 ────────────────────────────────────────────────────────────────

function SlideIntro({ isDark }: { isDark: boolean }) {
  const palette = isDark ? Colors.dark : Colors.light;
  return (
    <View style={[styles.slide, { backgroundColor: palette.background }]}>
      <Text style={styles.emoji} accessibilityLabel="Книги">
        📚
      </Text>
      <Text style={[styles.slideTitle, { color: palette.text }]}>Вивчи 500 слів</Text>
      <Text style={[styles.slideSubtitle, { color: isDark ? Blue[300] : Blue[700] }]}>
        Найпоширеніші слова англійської мови — підібрані так, щоб охопити 90% текстів
      </Text>
      <Text style={[styles.slideBody, { color: isDark ? Slate[400] : Slate[600] }]}>
        Метод інтервального повторення: вибери правильний переклад з 6 варіантів і рухайся далі. Чим
        частіше практикуєш — тим краще запамятовуєш.
      </Text>
    </View>
  );
}

// ─── Slide 2 ────────────────────────────────────────────────────────────────

const EXAMPLE_BUTTONS: { label: string; state: 'correct' | 'wrong' | 'disabled' }[] = [
  { label: 'привіт', state: 'correct' },
  { label: 'добре', state: 'wrong' },
  { label: 'дякую', state: 'disabled' },
  { label: 'будь ласка', state: 'disabled' },
  { label: 'так', state: 'disabled' },
  { label: 'ні', state: 'disabled' },
];

function SlideHowItWorks({ isDark }: { isDark: boolean }) {
  const palette = isDark ? Colors.dark : Colors.light;
  const scheme = isDark ? 'dark' : 'light';

  return (
    <View style={[styles.slide, { backgroundColor: palette.background }]}>
      <Text style={[styles.slideTitle, { color: palette.text }]}>Як це працює</Text>

      {/* Mini word card */}
      <View
        style={[
          styles.exampleCard,
          {
            backgroundColor: isDark ? Slate[800] : Blue[50],
            borderColor: isDark ? Blue[700] : Blue[400],
          },
        ]}>
        <Text style={[styles.exampleWord, { color: palette.text }]}>hello</Text>
      </View>

      {/* Example answer buttons */}
      <View style={styles.exampleButtons}>
        {EXAMPLE_BUTTONS.map(({ label, state }) => {
          const c = ButtonColors[scheme][state];
          return (
            <View
              key={label}
              style={[styles.exBtn, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[styles.exBtnLabel, { color: c.text }]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendItem, { color: Slate[500] }]}>🟢 Правильно</Text>
        <Text style={[styles.legendItem, { color: Slate[500] }]}>🔴 Неправильно</Text>
        <Text style={[styles.legendItem, { color: Slate[500] }]}>⚪ Інші</Text>
      </View>
    </View>
  );
}

// ─── Slide 3 ────────────────────────────────────────────────────────────────

function SlideGoal({
  isDark,
  selected,
  onSelect,
  onStart,
  isFinishing,
}: {
  isDark: boolean;
  selected: Goal;
  onSelect: (g: Goal) => void;
  onStart: () => void;
  isFinishing: boolean;
}) {
  const palette = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.slide, { backgroundColor: palette.background }]}>
      <Text style={[styles.slideTitle, { color: palette.text }]}>Починаємо!</Text>
      <Text style={[styles.slideSubtitle, { color: isDark ? Blue[300] : Blue[700] }]}>
        Скільки слів вивчатимеш щодня?
      </Text>

      <View style={styles.goalRow}>
        {GOALS.map((g) => {
          const active = g === selected;
          return (
            <Pressable
              key={g}
              style={({ pressed }) => [
                styles.goalCard,
                {
                  backgroundColor: active ? Blue[600] : isDark ? Slate[800] : Blue[50],
                  borderColor: active ? Blue[600] : isDark ? Slate[700] : Blue[200],
                },
                pressed && styles.goalPressed,
              ]}
              onPress={() => onSelect(g)}
              accessibilityLabel={`${g} слів на день`}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}>
              <Text
                style={[
                  styles.goalNumber,
                  { color: active ? '#ffffff' : isDark ? Blue[200] : Blue[800] },
                ]}>
                {g}
              </Text>
              <Text style={[styles.goalLabel, { color: active ? Blue[100] : Slate[500] }]}>
                слів/день
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          { backgroundColor: Blue[600] },
          (pressed || isFinishing) && styles.startPressed,
        ]}
        onPress={onStart}
        disabled={isFinishing}
        accessibilityLabel="Почати навчання"
        accessibilityRole="button">
        {isFinishing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.startText} maxFontSizeMultiplier={1.2}>
            Почати →
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<Goal>(20);
  const [isFinishing, setIsFinishing] = useState(false);

  const goNext = () => {
    const next = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const finish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.hasSeenOnboarding, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.dailyGoal, String(selectedGoal)),
      ]);
    } catch (e) {
      // Storage failure is non-fatal — proceed with defaults rather than blocking the user
      console.warn('[onboarding] failed to save settings, proceeding with defaults', e);
    }
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item }: { item: SlideKey }) => {
    let content;
    if (item === 'intro') content = <SlideIntro isDark={isDark} />;
    else if (item === 'how') content = <SlideHowItWorks isDark={isDark} />;
    else
      content = (
        <SlideGoal
          isDark={isDark}
          selected={selectedGoal}
          onSelect={setSelectedGoal}
          onStart={finish}
          isFinishing={isFinishing}
        />
      );
    return <View style={{ width: screenWidth, flex: 1 }}>{content}</View>;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <FlatList
        ref={listRef}
        data={SLIDE_KEYS}
        keyExtractor={(item) => item}
        renderItem={renderSlide}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(idx);
        }}
      />

      {/* Bottom chrome */}
      <View style={[styles.chrome, { backgroundColor: palette.background }]}>
        {/* Dot indicators — tappable to jump to any slide */}
        <View style={styles.dots}>
          {SLIDE_KEYS.map((key, i) => (
            <Pressable
              key={key}
              onPress={() => {
                listRef.current?.scrollToIndex({ index: i, animated: true });
                setCurrentIndex(i);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={`Перейти до слайду ${i + 1} з ${SLIDE_KEYS.length}`}
              accessibilityRole="button">
              <View
                style={[
                  styles.dot,
                  { backgroundColor: i === currentIndex ? Blue[600] : Blue[200] },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Next button (hidden on last slide) */}
        {currentIndex < SLIDE_KEYS.length - 1 && (
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && styles.nextPressed]}
            onPress={goNext}
            accessibilityLabel="Наступний слайд"
            accessibilityRole="button">
            <Text style={[styles.nextText, { color: Blue[600] }]} maxFontSizeMultiplier={1.2}>
              Далі →
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  slideBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Slide 2
  exampleCard: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  exampleWord: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  exampleButtons: {
    alignSelf: 'stretch',
    marginBottom: 14,
  },
  exBtn: {
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
    alignItems: 'center',
  },
  exBtnLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    fontSize: 13,
  },

  // Slide 3
  goalRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  goalCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
  },
  goalPressed: {
    opacity: 0.8,
  },
  goalNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  goalLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  startButton: {
    alignSelf: 'stretch',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startPressed: {
    opacity: 0.85,
  },
  startText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },

  // Chrome
  chrome: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  nextPressed: {
    opacity: 0.7,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
