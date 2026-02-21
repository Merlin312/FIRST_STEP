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

function StatRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  const palette = isDark ? Colors.dark : Colors.light;
  return (
    <View style={styles.statRow}>
      <Text
        style={[styles.statLabel, { color: palette.mutedText }]}
        maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <Text
        style={[styles.statValue, { color: isDark ? Blue[200] : Blue[800] }]}
        maxFontSizeMultiplier={1.2}>
        {value}
      </Text>
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

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>
        📊  СТАТИСТИКА
      </Text>
      <StatRow label="За сьогодні" value={`${todayCount} / ${dailyGoal}`} isDark={isDark} />
      <StatRow label="Всього слів" value={totalAnswered.toLocaleString()} isDark={isDark} />
      <StatRow label="Точність" value={`${accuracy}%`} isDark={isDark} />
      <StatRow label="Неправильно" value={totalWrong.toLocaleString()} isDark={isDark} />
      <StatRow label="Серія" value={`🔥 ${streak} ${pluralDays(streak)}`} isDark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
