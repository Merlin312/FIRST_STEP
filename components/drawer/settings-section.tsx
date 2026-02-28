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
import type { WordCategory, TargetLanguage } from '@/constants/words';
import { useStatsContext } from '@/contexts/stats-context';
import { type ThemeMode, useAppTheme } from '@/contexts/theme-context';
import { useLanguage, type AppLanguage } from '@/contexts/language-context';
import type { QuizDirection } from '@/hooks/use-quiz';
import type { ReminderDays } from '@/hooks/use-reminder-settings';

type Palette = (typeof Colors)['light'] | (typeof Colors)['dark'];

type PendingAction = 'reset' | null;

const GOAL_OPTIONS = [10, 20, 50] as const;
const OPTIONS_COUNT_OPTIONS = [4, 6, 8] as const;

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
  targetLanguage: TargetLanguage;
  onTargetLanguageChange: (val: TargetLanguage) => void;
  onClose: () => void;
  onResetQuiz?: () => void;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: ReminderDays;
  onReminderEnabledChange: (val: boolean) => Promise<void>;
  onReminderTimeChange: (time: string) => Promise<void>;
  onReminderDaysChange: (days: ReminderDays) => Promise<void>;
}

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
  targetLanguage,
  onTargetLanguageChange,
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
  const { lang, setLang, strings: s } = useLanguage();
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

  const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
    { label: s.themeSystem, value: 'system' },
    { label: s.themeLight, value: 'light' },
    { label: s.themeDark, value: 'dark' },
  ];

  const LANGUAGE_OPTIONS: { label: string; value: AppLanguage }[] = [
    { label: s.langUk, value: 'uk' },
    { label: s.langEn, value: 'en' },
    { label: s.langEs, value: 'es' },
    { label: s.langDe, value: 'de' },
  ];

  const langCode = targetLanguage.toUpperCase();
  const QUIZ_DIRECTION_OPTIONS: { label: string; value: QuizDirection }[] = [
    { label: `${langCode} → UA`, value: 'forward' },
    { label: `UA → ${langCode}`, value: 'reverse' },
  ];

  const LEARNING_LANG_OPTIONS: { label: string; value: TargetLanguage }[] = [
    { label: s.langEn, value: 'en' },
    { label: s.langEs, value: 'es' },
    { label: s.langDe, value: 'de' },
  ];

  const CATEGORY_OPTIONS: { label: string; value: WordCategory | undefined }[] = [
    { label: s.catAll, value: undefined },
    { label: s.catVerb, value: 'verb' },
    { label: s.catNoun, value: 'noun' },
    { label: s.catAdj, value: 'adjective' },
    { label: s.catAdv, value: 'adverb' },
  ];

  // Days of week starting Monday (1=Mon…6=Sat, 0=Sun)
  const DAY_OPTIONS: { label: string; value: number }[] = s.reminderDayLabels.map((label, i) => ({
    label,
    value: i === 6 ? 0 : i + 1,
  }));

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

  const handleViewAllWords = () => {
    onClose();
    router.push('/words');
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
          <Text style={[styles.sectionLabel, { color: palette.mutedText }]}>{s.settings}</Text>
        </View>

        {/* ─── Тема ─── */}
        <CollapsibleCard
          id="theme"
          icon="palette"
          label={s.theme}
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
                accessibilityLabel={s.themeA11y(label)}
              />
            ))}
          </View>
        </CollapsibleCard>

        {/* ─── Мова інтерфейсу ─── */}
        <CollapsibleCard
          id="language"
          icon="language"
          label={s.interfaceLanguage}
          isDark={isDark}
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
          <View style={styles.pillRow}>
            {LANGUAGE_OPTIONS.map(({ label, value }) => (
              <SelectPill
                key={value}
                label={label}
                active={lang === value}
                isDark={isDark}
                palette={palette}
                flex
                onPress={() => void setLang(value)}
                accessibilityLabel={s.langA11y(label)}
              />
            ))}
          </View>
        </CollapsibleCard>

        {/* ─── Квіз ─── */}
        <CollapsibleCard
          id="quiz"
          icon="quiz"
          label={s.quiz}
          isDark={isDark}
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
          <RowLabel label={s.learningLanguage} palette={palette} />
          <View style={styles.pillRow}>
            {LEARNING_LANG_OPTIONS.map(({ label, value }) => (
              <SelectPill
                key={value}
                label={label}
                active={targetLanguage === value}
                isDark={isDark}
                palette={palette}
                flex
                onPress={() => onTargetLanguageChange(value)}
                accessibilityLabel={s.langA11y(label)}
              />
            ))}
          </View>
          <RowLabel label={s.dailyGoal} palette={palette} />
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
                accessibilityLabel={s.goalA11y(g)}
              />
            ))}
          </View>
          <RowLabel label={s.answersCount} palette={palette} />
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
                accessibilityLabel={s.optionsA11y(n)}
              />
            ))}
          </View>
          <RowLabel label={s.quizDirection} palette={palette} />
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
                accessibilityLabel={s.dirA11y(label)}
              />
            ))}
          </View>
          <RowLabel label={s.wordCategory} palette={palette} />
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
                accessibilityLabel={s.catA11y(label)}
              />
            ))}
          </View>
          <SwitchRow
            label={s.autoAdvance}
            value={autoAdvance}
            onValueChange={onAutoAdvanceChange}
            palette={palette}
          />
        </CollapsibleCard>

        {/* ─── Серія ─── */}
        <CollapsibleCard
          id="streak"
          icon="local-fire-department"
          label={s.streak}
          isDark={isDark}
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
          <SwitchRow
            label={s.correctOnly}
            value={streakCorrectOnly}
            onValueChange={setStreakCorrectOnly}
            palette={palette}
          />
        </CollapsibleCard>

        {/* ─── Нагадування ─── */}
        <CollapsibleCard
          id="reminders"
          icon="notifications"
          label={s.reminders}
          isDark={isDark}
          openSection={openSection}
          onToggle={toggle}
          palette={palette}>
          <SwitchRow
            label={s.dailyReminder}
            value={reminderEnabled}
            onValueChange={onReminderEnabledChange}
            palette={palette}
          />
          {reminderEnabled && (
            <>
              <RowLabel label={s.reminderTime} palette={palette} />
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
                    accessibilityLabel={s.reminderTimeA11y(label)}
                  />
                ))}
              </ScrollView>
              <RowLabel label={s.reminderDays} palette={palette} />
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
                    accessibilityLabel={s.reminderDayA11y(label, isDayActive(value))}
                  />
                ))}
              </View>
            </>
          )}
        </CollapsibleCard>

        {/* ─── Всі слова ─── */}
        <Pressable
          style={({ pressed }) => [
            styles.tutorialBtn,
            { borderColor: isDark ? Blue[600] : Blue[400] },
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleViewAllWords}
          accessibilityLabel={s.viewAllWords}
          accessibilityRole="button">
          <View style={styles.tutorialBtnInner}>
            <MaterialIcons name="list" size={16} color={isDark ? Blue[300] : Blue[600]} />
            <Text
              style={[styles.tutorialBtnText, { color: isDark ? Blue[300] : Blue[600] }]}
              maxFontSizeMultiplier={1.2}>
              {s.viewAllWords}
            </Text>
          </View>
        </Pressable>

        {/* ─── Туторіал ─── */}
        <Pressable
          style={({ pressed }) => [
            styles.tutorialBtn,
            { borderColor: isDark ? Blue[600] : Blue[400] },
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleViewTutorial}
          accessibilityLabel={s.viewTutorial}
          accessibilityRole="button">
          <View style={styles.tutorialBtnInner}>
            <MaterialIcons name="menu-book" size={16} color={isDark ? Blue[300] : Blue[600]} />
            <Text
              style={[styles.tutorialBtnText, { color: isDark ? Blue[300] : Blue[600] }]}
              maxFontSizeMultiplier={1.2}>
              {s.viewTutorial}
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
          accessibilityLabel={s.resetStats}
          accessibilityRole="button">
          <MaterialIcons name="autorenew" size={18} color={palette.danger} />
          <Text
            style={[styles.resetBtnText, { color: palette.danger }]}
            maxFontSizeMultiplier={1.2}>
            {s.resetStats}
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
          accessibilityLabel={s.resetDialogCancel}>
          <Pressable
            style={[styles.dialogCard, { backgroundColor: palette.background }]}
            onPress={() => {}}
            accessibilityRole="none">
            <Text style={[styles.dialogTitle, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
              {s.resetDialogTitle}
            </Text>
            <Text
              style={[styles.dialogMessage, { color: palette.mutedText }]}
              maxFontSizeMultiplier={1.2}>
              {s.resetDialogMessage}
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
                  {s.resetDialogCancel}
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
                  {s.resetDialogConfirm}
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
