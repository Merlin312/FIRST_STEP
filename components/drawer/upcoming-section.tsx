import { StyleSheet, Text, View } from 'react-native';

import { Blue, Colors } from '@/constants/theme';
import { sectionStyles } from './shared';

const UPCOMING_FEATURES = [
  { icon: '🔐', label: 'Акаунт та синхронізація' },
  { icon: '🔔', label: 'Нагадування' },
  { icon: '🏆', label: 'Рейтинг' },
] as const;

export function UpcomingSection({ isDark }: { isDark: boolean }) {
  const palette = isDark ? Colors.dark : Colors.light;

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>
        🚀  НЕЗАБАРОМ
      </Text>
      {UPCOMING_FEATURES.map(({ icon, label }) => (
        <View key={label} style={styles.row}>
          <Text
            style={[styles.label, { color: palette.mutedText }]}
            maxFontSizeMultiplier={1.2}>
            {icon}  {label}
          </Text>
          <View style={[styles.badge, { backgroundColor: isDark ? Blue[900] : Blue[50] }]}>
            <Text
              style={[styles.badgeText, { color: isDark ? Blue[300] : Blue[600] }]}
              maxFontSizeMultiplier={1.2}>
              скоро
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
  },
  badge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
