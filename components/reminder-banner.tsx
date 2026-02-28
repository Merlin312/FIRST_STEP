import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Blue, Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { ReminderType } from '@/utils/reminder-logic';

interface ReminderBannerProps {
  type: ReminderType;
  streak: number;
  dailyGoal: number;
  isDark: boolean;
  onDismiss: () => void;
  onSnooze: () => void;
}

export function ReminderBanner({
  type,
  streak,
  dailyGoal,
  isDark,
  onDismiss,
  onSnooze,
}: ReminderBannerProps) {
  const { strings: s } = useLanguage();

  if (!type) return null;

  const palette = isDark ? Colors.dark : Colors.light;

  const isAtRisk = type === 'streak-at-risk';
  const isMilestone = type === 'streak-milestone';

  const message = isMilestone
    ? s.reminderMilestone(streak)
    : isAtRisk
      ? s.reminderAtRisk(streak)
      : s.reminderIncomplete(dailyGoal);

  const accentColor = isMilestone ? '#f59e0b' : isAtRisk ? '#ef4444' : Blue[600];
  const bgColor = isMilestone
    ? isDark
      ? 'rgba(245,158,11,0.12)'
      : 'rgba(245,158,11,0.08)'
    : isAtRisk
      ? isDark
        ? 'rgba(239,68,68,0.12)'
        : 'rgba(239,68,68,0.08)'
      : isDark
        ? `rgba(59,130,246,0.12)`
        : `rgba(59,130,246,0.07)`;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(250)}
      style={[
        styles.banner,
        {
          backgroundColor: bgColor,
          borderColor: accentColor,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <View style={styles.content}>
        <MaterialIcons
          name={isMilestone ? 'emoji-events' : isAtRisk ? 'local-fire-department' : 'menu-book'}
          size={18}
          color={accentColor}
        />
        <Text
          style={[styles.message, { color: palette.text }]}
          maxFontSizeMultiplier={1.2}
          numberOfLines={3}>
          {message}
        </Text>
      </View>
      <View style={styles.actions}>
        {!isMilestone && (
          <Pressable
            style={({ pressed }) => [
              styles.snoozeBtn,
              { borderColor: accentColor },
              pressed && { opacity: 0.7 },
            ]}
            onPress={onSnooze}
            hitSlop={8}
            accessibilityLabel={s.snoozeA11y}
            accessibilityRole="button">
            <Text
              style={[styles.snoozeBtnText, { color: accentColor }]}
              maxFontSizeMultiplier={1.2}>
              {s.snoozeLater}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
          onPress={onDismiss}
          hitSlop={8}
          accessibilityLabel={s.dismissA11y}
          accessibilityRole="button">
          <MaterialIcons name="close" size={16} color={palette.subtleText} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  snoozeBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  snoozeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dismissBtn: {
    padding: 6,
    minWidth: 28,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
