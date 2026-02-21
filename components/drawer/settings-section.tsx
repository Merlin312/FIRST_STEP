import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import type { WordCategory } from '@/constants/words';
import { type ThemeMode, useAppTheme } from '@/contexts/theme-context';
import { useStatsContext } from '@/contexts/stats-context';

const SPRING = {
  damping: 32,
  stiffness: 280,
  mass: 0.85,
  overshootClamping: true,
} as const;

type Palette = (typeof Colors)['light'] | (typeof Colors)['dark'];

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Системна', value: 'system' },
  { label: 'Світла', value: 'light' },
  { label: 'Темна', value: 'dark' },
];

const GOAL_OPTIONS = [10, 20, 50] as const;

const CATEGORY_OPTIONS: { label: string; value: WordCategory | undefined }[] = [
  { label: 'Всі', value: undefined },
  { label: 'Дієслова', value: 'verb' },
  { label: 'Іменники', value: 'noun' },
  { label: 'Прикмет.', value: 'adjective' },
  { label: 'Прислів.', value: 'adverb' },
];

export interface SettingsSectionProps {
  isDark: boolean;
  category: WordCategory | undefined;
  onCategoryChange: (cat: WordCategory | undefined) => void;
  autoAdvance: boolean;
  onAutoAdvanceChange: (val: boolean) => void;
}

export function SettingsSection({
  isDark,
  category,
  onCategoryChange,
  autoAdvance,
  onAutoAdvanceChange,
}: SettingsSectionProps) {
  const palette: Palette = isDark ? Colors.dark : Colors.light;
  const { themeMode, setThemeMode } = useAppTheme();
  const { dailyGoal, streakCorrectOnly, setStreakCorrectOnly, reloadDailyGoal } = useStatsContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const contentHeight = useRef(0);
  const heightValue = useSharedValue(0);
  const chevronAngle = useSharedValue(0);

  const animatedHeight = useAnimatedStyle(() => ({
    height: heightValue.value,
    overflow: 'hidden',
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronAngle.value * 90}deg` }],
  }));

  const toggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    heightValue.value = withSpring(next ? contentHeight.current : 0, SPRING);
    chevronAngle.value = withSpring(next ? 1 : 0, SPRING);
  };

  const handleGoalChange = async (goal: number) => {
    await AsyncStorage.setItem(STORAGE_KEYS.dailyGoal, String(goal));
    reloadDailyGoal();
  };

  return (
    <View style={styles.wrapper}>
      {/* Header — always visible */}
      <Pressable
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
        onPress={toggle}
        accessibilityLabel="Налаштування"
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}>
        <Text style={[styles.headerLabel, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
          ⚙️  НАЛАШТУВАННЯ
        </Text>
        <Animated.View style={chevronStyle}>
          <Text style={[styles.chevron, { color: palette.mutedText }]}>›</Text>
        </Animated.View>
      </Pressable>

      {/* Expandable body */}
      <Animated.View style={animatedHeight}>
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) contentHeight.current = h;
          }}>

          {/* ─── Вигляд ─── */}
          <InnerDivider palette={palette} />
          <SubLabel label="🎨  ВИГЛЯД" palette={palette} />
          <View style={styles.pillRow}>
            {THEME_OPTIONS.map(({ label, value }) => (
              <SelectPill
                key={value}
                label={label}
                active={themeMode === value}
                isDark={isDark}
                palette={palette}
                flex
                onPress={() => setThemeMode(value)}
                accessibilityLabel={`Тема: ${label}`}
              />
            ))}
          </View>

          {/* ─── Мова ─── */}
          <InnerDivider palette={palette} />
          <SubLabel label="🌐  МОВА ПЕРЕКЛАДУ" palette={palette} />
          <View
            style={[
              styles.langRow,
              { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
            ]}>
            <Text style={[styles.langText, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
              🇺🇦  Українська
            </Text>
            <Text style={{ color: Blue[500] }}>✓</Text>
          </View>
          <View style={[styles.addLangBtn, { borderColor: palette.surfaceBorder }]}>
            <Text
              style={[styles.addLangText, { color: palette.subtleText }]}
              maxFontSizeMultiplier={1.2}>
              + Додати мову  (скоро)
            </Text>
          </View>

          {/* ─── Квіз ─── */}
          <InnerDivider palette={palette} />
          <SubLabel label="📚  КВІЗ" palette={palette} />

          <RowLabel label="Щоденна ціль" palette={palette} />
          <View style={styles.pillRow}>
            {GOAL_OPTIONS.map((g) => (
              <SelectPill
                key={g}
                label={String(g)}
                active={dailyGoal === g}
                isDark={isDark}
                palette={palette}
                flex
                onPress={() => handleGoalChange(g)}
                accessibilityLabel={`Ціль ${g} слів на день`}
              />
            ))}
          </View>

          <RowLabel label="Категорія слів" palette={palette} />
          <View style={[styles.pillRow, styles.pillRowWrap]}>
            {CATEGORY_OPTIONS.map(({ label, value }) => (
              <SelectPill
                key={label}
                label={label}
                active={category === value}
                isDark={isDark}
                palette={palette}
                flex={false}
                onPress={() => onCategoryChange(value)}
                accessibilityLabel={`Категорія: ${label}`}
              />
            ))}
          </View>

          <RowLabel label="Автоперехід" palette={palette} />
          <View style={styles.pillRow}>
            <SelectPill
              label="Авто"
              active={autoAdvance}
              isDark={isDark}
              palette={palette}
              flex
              onPress={() => onAutoAdvanceChange(true)}
              accessibilityLabel="Автоматичний перехід до наступного слова"
            />
            <SelectPill
              label="Вручну"
              active={!autoAdvance}
              isDark={isDark}
              palette={palette}
              flex
              onPress={() => onAutoAdvanceChange(false)}
              accessibilityLabel="Перехід до наступного слова вручну"
            />
          </View>

          {/* ─── Серія ─── */}
          <InnerDivider palette={palette} />
          <SubLabel label="🔥  СЕРІЯ" palette={palette} />

          <RowLabel label="Зараховувати відповіді" palette={palette} />
          <View style={[styles.pillRow, { marginBottom: 4 }]}>
            <SelectPill
              label="Будь-які"
              active={!streakCorrectOnly}
              isDark={isDark}
              palette={palette}
              flex
              onPress={() => setStreakCorrectOnly(false)}
              accessibilityLabel="Серія зараховується за будь-яку відповідь"
            />
            <SelectPill
              label="Правильні"
              active={streakCorrectOnly}
              isDark={isDark}
              palette={palette}
              flex
              onPress={() => setStreakCorrectOnly(true)}
              accessibilityLabel="Серія зараховується тільки за правильні відповіді"
            />
          </View>

        </View>
      </Animated.View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InnerDivider({ palette }: { palette: Palette }) {
  return <View style={[styles.innerDivider, { backgroundColor: palette.surfaceBorder }]} />;
}

function SubLabel({ label, palette }: { label: string; palette: Palette }) {
  return (
    <Text style={[styles.subLabel, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
      {label}
    </Text>
  );
}

function RowLabel({ label, palette }: { label: string; palette: Palette }) {
  return (
    <Text style={[styles.rowLabelText, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
      {label}
    </Text>
  );
}

function SelectPill({
  label,
  active,
  isDark,
  palette,
  flex,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  active: boolean;
  isDark: boolean;
  palette: Palette;
  flex: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        flex && { flex: 1 },
        {
          backgroundColor: active ? Blue[600] : palette.surface,
          borderColor: active ? Blue[600] : palette.surfaceBorder,
        },
        pressed && !active && { opacity: 0.7 },
      ]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <Text
        style={[styles.pillText, { color: active ? '#fff' : isDark ? Blue[300] : Blue[700] }]}
        maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '400',
  },
  innerDivider: {
    height: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  rowLabelText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 6,
    color: 'transparent', // overridden by inline style
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillRowWrap: {
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Language subsection
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  langText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addLangBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addLangText: {
    fontSize: 12,
  },
});
