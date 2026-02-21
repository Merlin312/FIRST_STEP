import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Blue, Colors } from '@/constants/theme';
import { sectionStyles } from './shared';

export function LanguageSection({ isDark }: { isDark: boolean }) {
  const palette = isDark ? Colors.dark : Colors.light;

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>
        🌐  МОВА ПЕРЕКЛАДУ
      </Text>
      <View
        style={[
          styles.langRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.surfaceBorder,
          },
        ]}>
        <Text style={[styles.langText, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
          🇺🇦  Українська
        </Text>
        <Text style={{ color: Blue[500] }}>✓</Text>
      </View>
      <Pressable
        style={[styles.addLangBtn, { borderColor: palette.surfaceBorder }]}
        disabled
        accessibilityLabel="Додати мову (скоро буде)"
        accessibilityState={{ disabled: true }}>
        <Text
          style={[styles.addLangText, { color: palette.subtleText }]}
          maxFontSizeMultiplier={1.2}>
          + Додати мову  (скоро)
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 10,
    alignItems: 'center',
  },
  addLangText: {
    fontSize: 13,
  },
});
