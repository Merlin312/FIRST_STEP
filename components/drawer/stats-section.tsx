import { StyleSheet, Text, View } from 'react-native';

import { Blue, Colors } from '@/constants/theme';
import { useStatsContext } from '@/contexts/stats-context';
import { RingProgress } from '@/components/ring-progress';
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

// Short Ukrainian day-of-week labels (Mon = 1 ... Sun = 0)
const DAY_LABELS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

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

/** Returns last N days as ISO date strings, from oldest to newest. */
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push(iso);
  }
  return days;
}

function WeeklyChart({
  dailyHistory,
  dailyGoal,
  isDark,
}: {
  dailyHistory: Record<string, number>;
  dailyGoal: number;
  isDark: boolean;
}) {
  const palette = isDark ? Colors.dark : Colors.light;
  const days = getLastNDays(7);
  const today = days[days.length - 1];
  const maxBarHeight = 36;
  const effectiveGoal = Math.max(dailyGoal, 1);

  return (
    <View style={styles.chartWrapper}>
      <Text style={[styles.chartTitle, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
        Активність за тиждень
      </Text>
      <View style={styles.chartBars}>
        {days.map((iso) => {
          const count = dailyHistory[iso] ?? 0;
          const ratio = Math.min(count / effectiveGoal, 1);
          const barHeight = Math.max(ratio * maxBarHeight, count > 0 ? 4 : 2);
          const isToday = iso === today;
          const dayOfWeek = new Date(iso + 'T00:00:00').getDay();
          const barColor = isToday
            ? isDark
              ? Blue[400]
              : Blue[600]
            : ratio >= 1
              ? palette.success
              : isDark
                ? Blue[700]
                : Blue[200];

          return (
            <View key={iso} style={styles.chartBarCol}>
              <View style={[styles.chartBarTrack, { height: maxBarHeight }]}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.chartDayLabel,
                  {
                    color: isToday ? (isDark ? Blue[300] : Blue[600]) : palette.subtleText,
                    fontWeight: isToday ? '700' : '400',
                  },
                ]}
                maxFontSizeMultiplier={1.2}>
                {DAY_LABELS[dayOfWeek]}
              </Text>
            </View>
          );
        })}
      </View>
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
  const { dailyHistory } = useStatsContext();
  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal;
  const progressRatio = dailyGoal > 0 ? Math.min(todayCount / dailyGoal, 1) : 0;
  const progressColor = goalReached ? palette.success : isDark ? Blue[400] : Blue[600];

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>📊 СТАТИСТИКА</Text>

      {/* Daily progress — ring + count */}
      <View style={styles.ringRow}>
        <RingProgress
          progress={progressRatio}
          size={72}
          thickness={7}
          color={progressColor}
          trackColor={palette.surfaceBorder}
        />
        <View style={styles.ringInfo}>
          {goalReached ? (
            <>
              <Text
                style={[styles.ringCount, { color: palette.success }]}
                maxFontSizeMultiplier={1.2}>
                ✓ Ціль!
              </Text>
              <Text
                style={[styles.ringLabel, { color: palette.mutedText }]}
                maxFontSizeMultiplier={1.2}>
                {todayCount} слів сьогодні
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[styles.ringCount, { color: isDark ? Blue[200] : Blue[800] }]}
                maxFontSizeMultiplier={1.2}>
                {todayCount} / {dailyGoal}
              </Text>
              <Text
                style={[styles.ringLabel, { color: palette.mutedText }]}
                maxFontSizeMultiplier={1.2}>
                слів сьогодні
              </Text>
            </>
          )}
        </View>
      </View>

      {/* 2×2 stat cards */}
      <View style={styles.grid}>
        <StatCard value={`🔥 ${streak}`} label={pluralDays(streak)} isDark={isDark} />
        <StatCard value={`${accuracy}%`} label="Точність" sublabel="за весь час" isDark={isDark} />
        <StatCard value={totalAnswered.toLocaleString('uk-UA')} label="Всього" isDark={isDark} />
        <StatCard value={totalWrong.toLocaleString('uk-UA')} label="Помилок" isDark={isDark} />
      </View>

      {/* 7-day activity chart */}
      <WeeklyChart dailyHistory={dailyHistory} dailyGoal={dailyGoal} isDark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  ringInfo: {
    flex: 1,
    gap: 2,
  },
  ringCount: {
    fontSize: 22,
    fontWeight: '700',
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  // Weekly chart
  chartWrapper: {
    gap: 8,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartBarTrack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
  },
  chartDayLabel: {
    fontSize: 9,
  },
});
