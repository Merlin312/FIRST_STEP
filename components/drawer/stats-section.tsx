import { StyleSheet, Text, View } from 'react-native';

import { Blue, Colors } from '@/constants/theme';
import { pluralDays } from '@/utils/pluralize';
import { sectionStyles } from './shared';

interface StatsSectionProps {
  isDark: boolean;
  todayCount: number;
  dailyGoal: number;
  totalAnswered: number;
  totalWrong: number;
  accuracy: number;
  streak: number;
}

function StatCard({
  value,
  label,
  sublabel,
  isDark,
}: {
  value: string;
  label: string;
  sublabel?: string;
  isDark: boolean;
}) {
  const palette = isDark ? Colors.dark : Colors.light;
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
      ]}>
      <Text
        style={[styles.statCardValue, { color: isDark ? Blue[200] : Blue[800] }]}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>
      <Text
        style={[styles.statCardLabel, { color: palette.mutedText }]}
        maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      {sublabel && (
        <Text
          style={[styles.statCardSublabel, { color: palette.subtleText }]}
          maxFontSizeMultiplier={1.2}>
          {sublabel}
        </Text>
      )}
    </View>
  );
}

export function StatsSection({
  isDark,
  todayCount,
  dailyGoal,
  totalAnswered,
  totalWrong,
  accuracy,
  streak,
}: StatsSectionProps) {
  const palette = isDark ? Colors.dark : Colors.light;
  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal;
  const progressRatio = dailyGoal > 0 ? Math.min(todayCount / dailyGoal, 1) : 0;
  const progressColor = goalReached ? palette.success : isDark ? Blue[400] : Blue[600];
  const goalBadgeBg = isDark ? 'rgba(134, 239, 172, 0.15)' : 'rgba(34, 197, 94, 0.12)';

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>📊 СТАТИСТИКА</Text>

      {/* Daily progress */}
      <View style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <Text
            style={[styles.progressLabel, { color: palette.mutedText }]}
            maxFontSizeMultiplier={1.2}>
            Сьогодні
          </Text>
          {goalReached ? (
            <View style={[styles.goalBadge, { backgroundColor: goalBadgeBg }]}>
              <Text
                style={[styles.goalBadgeText, { color: palette.success }]}
                maxFontSizeMultiplier={1.2}>
                ✓ Ціль виконана!
              </Text>
            </View>
          ) : (
            <Text
              style={[styles.progressCount, { color: isDark ? Blue[300] : Blue[600] }]}
              maxFontSizeMultiplier={1.2}>
              {todayCount} / {dailyGoal}
            </Text>
          )}
        </View>
        <View style={[styles.progressTrack, { backgroundColor: palette.surfaceBorder }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: progressColor, width: `${progressRatio * 100}%` as `${number}%` },
            ]}
          />
        </View>
      </View>

      {/* 2×2 stat cards */}
      <View style={styles.grid}>
        <StatCard value={`🔥 ${streak}`} label={pluralDays(streak)} isDark={isDark} />
        <StatCard value={`${accuracy}%`} label="Точність" sublabel="за весь час" isDark={isDark} />
        <StatCard value={totalAnswered.toLocaleString('uk-UA')} label="Всього" isDark={isDark} />
        <StatCard value={totalWrong.toLocaleString('uk-UA')} label="Помилок" isDark={isDark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressBlock: {
    gap: 6,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 2,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statCardSublabel: {
    fontSize: 10,
    marginTop: 1,
  },
});
