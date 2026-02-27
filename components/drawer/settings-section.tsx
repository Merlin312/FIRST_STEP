import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import type { WordCategory } from '@/constants/words';
import { useStatsContext } from '@/contexts/stats-context';
import { type ThemeMode, useAppTheme } from '@/contexts/theme-context';

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
  const { dailyGoal, streakCorrectOnly, setStreakCorrectOnly, reloadDailyGoal, resetStats } =
    useStatsContext();
  const router = useRouter();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const toggle = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

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
        <Text style={[styles.sectionLabel, { color: palette.mutedText }]}>⚙️ НАЛАШТУВАННЯ</Text>

        {/* ─── Тема ─── */}
        <CollapsibleCard
          id="theme"
          label="🎨  Тема"
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
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
        </CollapsibleCard>

        {/* ─── Мова ─── */}
        <CollapsibleCard
          id="language"
          label="🌐  Мова перекладу"
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
          <View
            style={[
              styles.langRow,
              { backgroundColor: palette.background, borderColor: palette.surfaceBorder },
            ]}>
            <Text style={[styles.langText, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
              🇺🇦 Українська
            </Text>
            <Text style={{ color: Blue[500] }}>✓</Text>
          </View>
          <View style={[styles.addLangBtn, { borderColor: palette.surfaceBorder }]}>
            <Text
              style={[styles.addLangText, { color: palette.subtleText }]}
              maxFontSizeMultiplier={1.2}>
              + Додати мову (скоро)
            </Text>
          </View>
        </CollapsibleCard>

        {/* ─── Квіз ─── */}
        <CollapsibleCard
          id="quiz"
          label="📚  Квіз"
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
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
          <SwitchRow
            label="Автоперехід"
            value={autoAdvance}
            onValueChange={onAutoAdvanceChange}
            palette={palette}
          />
        </CollapsibleCard>

        {/* ─── Серія ─── */}
        <CollapsibleCard
          id="streak"
          label="🔥  Серія"
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
          <SwitchRow
            label="Тільки правильні"
            value={streakCorrectOnly}
            onValueChange={setStreakCorrectOnly}
            palette={palette}
          />
        </CollapsibleCard>

        {/* ─── Туторіал ─── */}
        <Pressable
          style={({ pressed }) => [
            styles.tutorialBtn,
            { borderColor: isDark ? Blue[600] : Blue[400] },
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleViewTutorial}
          accessibilityLabel="Переглянути туторіал"
          accessibilityRole="button">
          <Text
            style={[styles.tutorialBtnText, { color: isDark ? Blue[300] : Blue[600] }]}
            maxFontSizeMultiplier={1.2}>
            📖 Переглянути туторіал
          </Text>
        </Pressable>

        {/* ─── Небезпечна зона ─── */}
        <CollapsibleCard
          id="danger"
          label="⚠️  Небезпечна зона"
          openSection={openSection}
          onToggle={toggle}
          palette={palette}
          cardStyle={{
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
          }}>
          <Pressable
            style={({ pressed }) => [
              styles.dangerBtn,
              { borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)' },
              pressed && styles.dangerBtnPressed,
            ]}
            onPress={handleResetStats}
            accessibilityLabel="Скинути статистику"
            accessibilityRole="button">
            <Text
              style={[styles.dangerText, { color: palette.danger }]}
              maxFontSizeMultiplier={1.2}>
              🗑 Скинути статистику
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.dangerBtn,
              { borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)' },
              pressed && styles.dangerBtnPressed,
            ]}
            onPress={handleStartOver}
            accessibilityLabel="Почати спочатку"
            accessibilityRole="button">
            <Text
              style={[styles.dangerText, { color: palette.danger }]}
              maxFontSizeMultiplier={1.2}>
              🔄 Почати спочатку
            </Text>
          </Pressable>
        </CollapsibleCard>
      </View>

      {/* Кастомний діалог підтвердження через Modal */}
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
          <Pressable
            style={[styles.dialogCard, { backgroundColor: palette.background }]}
            onPress={() => {}}
            accessibilityRole="none">
            <Text style={[styles.dialogTitle, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
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
                <Text style={[styles.dialogBtnText, { color: '#fff' }]} maxFontSizeMultiplier={1.2}>
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

function CollapsibleCard({
  id,
  label,
  openSection,
  onToggle,
  palette,
  cardStyle,
  children,
}: {
  id: string;
  label: string;
  openSection: string | null;
  onToggle: (key: string) => void;
  palette: Palette;
  cardStyle?: ViewStyle;
  children: ReactNode;
}) {
  const isOpen = openSection === id;
  return (
    <View
      style={[
        styles.groupCard,
        { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
        cardStyle,
      ]}>
      <Pressable
        style={({ pressed }) => [styles.cardHeader, pressed && { opacity: 0.7 }]}
        onPress={() => onToggle(id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}>
        <Text style={[styles.subLabel, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
          {label}
        </Text>
        <Text style={[styles.chevron, { color: palette.subtleText }]}>{isOpen ? '▲' : '▼'}</Text>
      </Pressable>
      {isOpen && (
        <View style={[styles.cardContent, { borderTopColor: palette.surfaceBorder }]}>
          {children}
        </View>
      )}
    </View>
  );
}

function RowLabel({ label, palette }: { label: string; palette: Palette }) {
  return (
    <Text style={[styles.rowLabelText, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
      {label}
    </Text>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
  palette,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  palette: Palette;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchLabel, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: palette.surfaceBorder, true: Blue[500] }}
        thumbColor="#ffffff"
        ios_backgroundColor={palette.surfaceBorder}
      />
    </View>
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
          backgroundColor: active ? Blue[600] : palette.background,
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
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardContent: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 10,
  },
  rowLabelText: {
    fontSize: 12,
    fontWeight: '500',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '500',
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
  tutorialBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tutorialBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Danger zone buttons
  dangerBtn: {
    borderWidth: 1,
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
