import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Blue, Colors } from '@/constants/theme';
import { type ThemeMode, useAppTheme } from '@/contexts/theme-context';
import { sectionStyles } from './shared';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Системна', value: 'system' },
  { label: 'Світла', value: 'light' },
  { label: 'Темна', value: 'dark' },
];

export function ThemeSection({ isDark }: { isDark: boolean }) {
  const { themeMode, setThemeMode } = useAppTheme();
  const palette = isDark ? Colors.dark : Colors.light;

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>
        🎨  ТЕМА
      </Text>
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map(({ label, value }) => {
          const active = themeMode === value;
          return (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.themePill,
                {
                  backgroundColor: active ? Blue[600] : palette.surface,
                  borderColor: active ? Blue[600] : palette.surfaceBorder,
                },
                pressed && !active && styles.pressed,
              ]}
              onPress={() => setThemeMode(value)}
              accessibilityLabel={`Тема: ${label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text
                style={[
                  styles.themePillText,
                  { color: active ? '#fff' : isDark ? Blue[300] : Blue[700] },
                ]}
                maxFontSizeMultiplier={1.2}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  themePill: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
