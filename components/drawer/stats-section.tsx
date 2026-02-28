import { useRef, useEffect, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Blue, Colors } from '@/constants/theme';
import { useStatsContext } from '@/contexts/stats-context';
import { useLanguage } from '@/contexts/language-context';
import { RingProgress } from '@/components/ring-progress';
import { sectionStyles } from './shared';

interface StatsSectionProps {
  isDark: boolean;
  todayCount: number;
  dailyGoal: number;
  totalAnswered: number;
  totalWrong: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
}

function StatCard({
  iconName,
  value,
  label,
  sublabel,
  isDark,
}: {
  iconName?: ComponentProps<typeof MaterialIcons>['name'];
  value: string;
  label: string;
  sublabel?: string;
  isDark: boolean;
}) {
  const palette = isDark ? Colors.dark : Colors.light;
  const valueColor = isDark ? Blue[200] : Blue[800];
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
      ]}>
      <View style={styles.statCardValueRow}>
        {iconName && <MaterialIcons name={iconName} size={18} color={valueColor} />}
        <Text
          style={[styles.statCardValue, { color: valueColor }]}
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
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

function MonthlyChart({
  dailyHistory,
  dailyGoal,
  isDark,
}: {
  dailyHistory: Record<string, number>;
  dailyGoal: number;
  isDark: boolean;
}) {
  const palette = isDark ? Colors.dark : Colors.light;
  const { strings: s } = useLanguage();
  const days = getLastNDays(30);
  const today = days[days.length - 1];
  const maxBarHeight = 36;
  const effectiveGoal = Math.max(dailyGoal, 1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  return (
    <View style={styles.chartWrapper}>
      <Text style={[styles.chartTitle, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
        {s.activityChart}
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartBars}>
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
                {s.dayLabels[dayOfWeek]}
              </Text>
            </View>
          );
        })}
      </ScrollView>
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
  bestStreak,
}: StatsSectionProps) {
  const palette = isDark ? Colors.dark : Colors.light;
  const { dailyHistory } = useStatsContext();
  const { lang, strings: s } = useLanguage();
  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal;
  const progressRatio = dailyGoal > 0 ? Math.min(todayCount / dailyGoal, 1) : 0;
  const progressColor = goalReached ? palette.success : isDark ? Blue[400] : Blue[600];
  const numLocale = lang === 'uk' ? 'uk-UA' : 'en-US';

  return (
    <View style={sectionStyles.section}>
      <View style={styles.sectionLabelRow}>
        <MaterialIcons name="bar-chart" size={13} color={isDark ? Blue[400] : Blue[500]} />
        <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>{s.stats}</Text>
      </View>

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
              <View style={styles.goalReachedRow}>
                <MaterialIcons name="check" size={20} color={palette.success} />
                <Text
                  style={[styles.ringCount, { color: palette.success }]}
                  maxFontSizeMultiplier={1.2}>
                  {s.goalReached}
                </Text>
              </View>
              <Text
                style={[styles.ringLabel, { color: palette.mutedText }]}
                maxFontSizeMultiplier={1.2}>
                {s.wordsToday(todayCount)}
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
                {s.wordsTodayLabel}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* 2×2 stat cards */}
      <View style={styles.grid}>
        <StatCard
          iconName="local-fire-department"
          value={`${streak}`}
          label={s.streakDays(streak)}
          sublabel={bestStreak > 0 ? s.bestStreakLabel(bestStreak) : undefined}
          isDark={isDark}
        />
        <StatCard value={`${accuracy}%`} label={s.accuracy} sublabel={s.allTime} isDark={isDark} />
        <StatCard
          value={totalAnswered.toLocaleString(numLocale)}
          label={s.totalAnswered}
          isDark={isDark}
        />
        <StatCard
          value={totalWrong.toLocaleString(numLocale)}
          label={s.totalWrong}
          isDark={isDark}
        />
      </View>

      {/* 30-day activity chart */}
      <MonthlyChart dailyHistory={dailyHistory} dailyGoal={dailyGoal} isDark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  goalReachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
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
    width: 18,
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
