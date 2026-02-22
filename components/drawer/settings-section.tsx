import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
  onClose: () => void;
  onResetQuiz?: () => void;
}

export function SettingsSection({
  isDark,
  category,
  onCategoryChange,
  autoAdvance,
  onAutoAdvanceChange,
  onClose,
  onResetQuiz,
}: SettingsSectionProps) {
  const palette: Palette = isDark ? Colors.dark : Colors.light;
  const { themeMode, setThemeMode } = useAppTheme();
  const { dailyGoal, streakCorrectOnly, setStreakCorrectOnly, reloadDailyGoal, resetStats } = useStatsContext();
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
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

  // Fallback height for the first toggle before onLayout has fired
  const FALLBACK_CONTENT_HEIGHT = 420;

  const toggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    heightValue.value = withSpring(next ? (contentHeight.current || FALLBACK_CONTENT_HEIGHT) : 0, SPRING);
    chevronAngle.value = withSpring(next ? 1 : 0, SPRING);
  };

  const handleGoalChange = async (goal: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.dailyGoal, String(goal));
      reloadDailyGoal();
    } catch (e) {
      console.warn('[settings] failed to persist daily goal', e);
    }
  };

  const handleViewTutorial = () => {
    onClose();
    router.replace('/onboarding');
  };

  const handleResetStats = () => setPendingAction('reset');
  const handleStartOver = () => setPendingAction('startOver');
  const handleCancel = () => setPendingAction(null);

  const handleConfirm = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'reset') {
      await resetStats();
      onResetQuiz?.();
    } else if (action === 'startOver') {
      await Promise.all([
        resetStats(),
        AsyncStorage.removeItem(STORAGE_KEYS.hasSeenOnboarding).catch(() => {}),
        AsyncStorage.removeItem(STORAGE_KEYS.dailyGoal).catch(() => {}),
        AsyncStorage.removeItem(STORAGE_KEYS.themeMode).catch(() => {}),
        AsyncStorage.removeItem(STORAGE_KEYS.wordCategory).catch(() => {}),
        AsyncStorage.removeItem(STORAGE_KEYS.autoAdvance).catch(() => {}),
      ]);
      onClose();
      router.replace('/onboarding');
    }
  };

  return (
    <>
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
            <View style={styles.pillRow}>
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

            {/* ─── Туторіал ─── */}
            <InnerDivider palette={palette} />
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: isDark ? Blue[600] : Blue[400] },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleViewTutorial}
              accessibilityLabel="Переглянути туторіал"
              accessibilityRole="button">
              <Text
                style={[styles.secondaryBtnText, { color: isDark ? Blue[300] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                📖  Переглянути туторіал
              </Text>
            </Pressable>

            {/* ─── Небезпечна зона ─── */}
            <InnerDivider palette={palette} />
            <SubLabel label="⚠️  НЕБЕЗПЕЧНА ЗОНА" palette={palette} />
            <View style={[styles.dangerGroup, { marginBottom: 4 }]}>
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

          </View>
        </Animated.View>
      </View>

      {/* Кастомний діалог підтвердження через Modal — гарантує рендер поверх усього */}
      <Modal
        visible={pendingAction !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
        statusBarTranslucent>
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCancel}
          accessibilityLabel="Скасувати">
          {/* Вкладений Pressable на картці поглинає дотики, щоб не закривати діалог */}
          <Pressable
            style={[styles.dialogCard, { backgroundColor: palette.background }]}
            onPress={() => {}}
            accessibilityRole="none">
            <Text
              style={[styles.dialogTitle, { color: palette.text }]}
              maxFontSizeMultiplier={1.2}>
              {pendingAction ? DIALOG_CONFIG[pendingAction].title : ''}
            </Text>
            <Text
              style={[styles.dialogMessage, { color: palette.mutedText }]}
              maxFontSizeMultiplier={1.2}>
              {pendingAction ? DIALOG_CONFIG[pendingAction].message : ''}
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
                  {pendingAction ? DIALOG_CONFIG[pendingAction].confirm : ''}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  // Tutorial button
  secondaryBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Danger zone
  dangerGroup: {
    gap: 10,
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
  // Custom dialog
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
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
