import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import type { WordCategory } from '@/constants/words';
import { useStatsContext } from '@/contexts/stats-context';
import { type ThemeMode, useAppTheme } from '@/contexts/theme-context';
import type { QuizDirection } from '@/hooks/use-quiz';
import type { ReminderDays } from '@/hooks/use-reminder-settings';

type Palette = (typeof Colors)['light'] | (typeof Colors)['dark'];

type PendingAction = 'reset' | null;

const DIALOG_CONFIG = {
  reset: {
    title: 'Скинути статистику',
    message: 'Весь прогрес буде видалено. Продовжити?',
    confirm: 'Скинути',
  },
} as const;

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Системна', value: 'system' },
  { label: 'Світла', value: 'light' },
  { label: 'Темна', value: 'dark' },
];

const GOAL_OPTIONS = [10, 20, 50] as const;
const OPTIONS_COUNT_OPTIONS = [4, 6, 8] as const;

const QUIZ_DIRECTION_OPTIONS: { label: string; value: QuizDirection }[] = [
  { label: 'EN → UA', value: 'en-ua' },
  { label: 'UA → EN', value: 'ua-en' },
];

// Days of week starting Monday (1=Mon…6=Sat, 0=Sun)
const DAY_OPTIONS: { label: string; value: number }[] = [
  { label: 'Пн', value: 1 },
  { label: 'Вт', value: 2 },
  { label: 'Ср', value: 3 },
  { label: 'Чт', value: 4 },
  { label: 'Пт', value: 5 },
  { label: 'Сб', value: 6 },
  { label: 'Нд', value: 0 },
];

// Time options from 06:00 to 23:30 in 30-minute steps
const TIME_OPTIONS: { label: string; value: string }[] = [];
for (let h = 6; h <= 23; h++) {
  for (const m of [0, 30]) {
    const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    TIME_OPTIONS.push({ label, value: label });
  }
}

// Approximate pill width + gap for scroll-to-active calculation
const TIME_PILL_WIDTH = 64;

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
  optionsCount: 4 | 6 | 8;
  onOptionsCountChange: (val: 4 | 6 | 8) => void;
  quizDirection: QuizDirection;
  onQuizDirectionChange: (val: QuizDirection) => void;
  onClose: () => void;
  onResetQuiz?: () => void;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: ReminderDays;
  onReminderEnabledChange: (val: boolean) => Promise<void>;
  onReminderTimeChange: (time: string) => Promise<void>;
  onReminderDaysChange: (days: ReminderDays) => Promise<void>;
}

export function SettingsSection({
  isDark,
  category,
  onCategoryChange,
  autoAdvance,
  onAutoAdvanceChange,
  optionsCount,
  onOptionsCountChange,
  quizDirection,
  onQuizDirectionChange,
  onClose,
  onResetQuiz,
  reminderEnabled,
  reminderTime,
  reminderDays,
  onReminderEnabledChange,
  onReminderTimeChange,
  onReminderDaysChange,
}: SettingsSectionProps) {
  const palette: Palette = isDark ? Colors.dark : Colors.light;
  const { themeMode, setThemeMode } = useAppTheme();
  const { dailyGoal, streakCorrectOnly, setStreakCorrectOnly, reloadDailyGoal, resetStats } =
    useStatsContext();
  const router = useRouter();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const timeScrollRef = useRef<ScrollView>(null);

  // Scroll time picker to active time when reminders section opens
  useEffect(() => {
    if (openSection === 'reminders' && reminderEnabled) {
      const idx = TIME_OPTIONS.findIndex((t) => t.value === reminderTime);
      if (idx > 0) {
        setTimeout(() => {
          timeScrollRef.current?.scrollTo({ x: idx * TIME_PILL_WIDTH, animated: false });
        }, 50);
      }
    }
  }, [openSection, reminderEnabled, reminderTime]);

  const toggleDay = (day: number) => {
    const current = reminderDays.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : reminderDays;
    if (current.includes(day)) {
      if (current.length <= 1) return; // keep at least 1 day
      const next = current.filter((d) => d !== day);
      void onReminderDaysChange(next);
    } else {
      const next = [...current, day];
      void onReminderDaysChange(next.length === 7 ? [] : next);
    }
  };

  const isDayActive = (day: number) => reminderDays.length === 0 || reminderDays.includes(day);

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
  const handleCancel = () => setPendingAction(null);

  const handleConfirm = async () => {
    setPendingAction(null);
    await resetStats();
    onResetQuiz?.();
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.sectionLabelRow}>
          <MaterialIcons name="settings" size={13} color={isDark ? Blue[400] : Blue[500]} />
          <Text style={[styles.sectionLabel, { color: palette.mutedText }]}>НАЛАШТУВАННЯ</Text>
        </View>

        {/* ─── Тема ─── */}
        <CollapsibleCard
          id="theme"
          icon="palette"
          label="Тема"
          isDark={isDark}
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
          icon="language"
          label="Мова перекладу"
          isDark={isDark}
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
            <MaterialIcons name="check" size={14} color={Blue[500]} />
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
          icon="quiz"
          label="Квіз"
          isDark={isDark}
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
          <RowLabel label="Варіантів відповіді" palette={palette} />
          <View style={styles.pillRow}>
            {OPTIONS_COUNT_OPTIONS.map((n) => (
              <SelectPill
                key={n}
                label={String(n)}
                active={optionsCount === n}
                isDark={isDark}
                palette={palette}
                flex
                onPress={() => onOptionsCountChange(n)}
                accessibilityLabel={`${n} варіантів відповіді`}
              />
            ))}
          </View>
          <RowLabel label="Напрям квізу" palette={palette} />
          <View style={styles.pillRow}>
            {QUIZ_DIRECTION_OPTIONS.map(({ label, value }) => (
              <SelectPill
                key={value}
                label={label}
                active={quizDirection === value}
                isDark={isDark}
                palette={palette}
                flex
                onPress={() => onQuizDirectionChange(value)}
                accessibilityLabel={`Напрям: ${label}`}
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
          icon="local-fire-department"
          label="Серія"
          isDark={isDark}
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

        {/* ─── Нагадування ─── */}
        <CollapsibleCard
          id="reminders"
          icon="notifications"
          label="Нагадування"
          isDark={isDark}
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
          <SwitchRow
            label="Щоденне нагадування"
            value={reminderEnabled}
            onValueChange={onReminderEnabledChange}
            palette={palette}
          />
          {reminderEnabled && (
            <>
              <RowLabel label="Час нагадування" palette={palette} />
              <ScrollView
                ref={timeScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}>
                {TIME_OPTIONS.map(({ label, value }) => (
                  <SelectPill
                    key={value}
                    label={label}
                    active={reminderTime === value}
                    isDark={isDark}
                    palette={palette}
                    flex={false}
                    onPress={() => void onReminderTimeChange(value)}
                    accessibilityLabel={`Час нагадування: ${label}`}
                  />
                ))}
              </ScrollView>
              <RowLabel label="Дні тижня" palette={palette} />
              <View style={styles.pillRow}>
                {DAY_OPTIONS.map(({ label, value }) => (
                  <SelectPill
                    key={value}
                    label={label}
                    active={isDayActive(value)}
                    isDark={isDark}
                    palette={palette}
                    flex
                    onPress={() => toggleDay(value)}
                    accessibilityLabel={`${label}: ${isDayActive(value) ? 'увімкнено' : 'вимкнено'}`}
                  />
                ))}
              </View>
            </>
          )}
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
          <View style={styles.tutorialBtnInner}>
            <MaterialIcons name="menu-book" size={16} color={isDark ? Blue[300] : Blue[600]} />
            <Text
              style={[styles.tutorialBtnText, { color: isDark ? Blue[300] : Blue[600] }]}
              maxFontSizeMultiplier={1.2}>
              Переглянути туторіал
            </Text>
          </View>
        </Pressable>

        {/* ─── Скинути статистику ─── */}
        <Pressable
          style={({ pressed }) => [
            styles.resetBtn,
            { borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)' },
            pressed && { opacity: 0.65 },
          ]}
          onPress={handleResetStats}
          accessibilityLabel="Скинути статистику"
          accessibilityRole="button">
          <MaterialIcons name="autorenew" size={18} color={palette.danger} />
          <Text
            style={[styles.resetBtnText, { color: palette.danger }]}
            maxFontSizeMultiplier={1.2}>
            Скинути статистику
          </Text>
        </Pressable>
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
  icon,
  label,
  isDark,
  openSection,
  onToggle,
  palette,
  cardStyle,
  children,
}: {
  id: string;
  icon?: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  isDark: boolean;
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
        <View style={styles.cardHeaderLeft}>
          {icon && <MaterialIcons name={icon} size={15} color={isDark ? Blue[300] : Blue[500]} />}
          <Text style={[styles.subLabel, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
            {label}
          </Text>
        </View>
        <MaterialIcons
          name={isOpen ? 'expand-less' : 'expand-more'}
          size={18}
          color={palette.subtleText}
        />
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
          backgroundColor: active ? (isDark ? Blue[500] : Blue[600]) : palette.background,
          borderColor: active ? (isDark ? Blue[500] : Blue[600]) : palette.surfaceBorder,
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
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  tutorialBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tutorialBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Reset stats button
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resetBtnText: {
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
