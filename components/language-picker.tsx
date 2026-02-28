import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Blue, Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import type { TargetLanguage } from '@/constants/words';

interface LanguageOption {
  value: TargetLanguage;
  flag: string;
  name: string;
  sub: string;
}

const LANGUAGES: LanguageOption[] = [
  { value: 'en', flag: '🇬🇧', name: 'English', sub: 'Англійська' },
  { value: 'de', flag: '🇩🇪', name: 'Deutsch', sub: 'Німецька' },
  { value: 'es', flag: '🇪🇸', name: 'Español', sub: 'Іспанська' },
  { value: 'ua', flag: '🇺🇦', name: 'Українська', sub: 'Ukrainian' },
];

interface LanguagePickerProps {
  selected: TargetLanguage;
  onSelect: (lang: TargetLanguage) => void;
  style?: ViewStyle;
}

export function LanguagePicker({ selected, onSelect, style }: LanguagePickerProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.grid, style]}>
      {LANGUAGES.map((lang) => {
        const isSelected = lang.value === selected;
        return (
          <Pressable
            key={lang.value}
            onPress={() => onSelect(lang.value)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: isSelected ? (isDark ? Blue[800] : Blue[100]) : colors.surface,
                borderColor: isSelected ? Blue[500] : colors.surfaceBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${lang.name} — ${lang.sub}`}>
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text
              style={[
                styles.name,
                { color: isSelected ? (isDark ? Blue[200] : Blue[700]) : colors.text },
              ]}
              maxFontSizeMultiplier={1.2}>
              {lang.name}
            </Text>
            <Text style={[styles.sub, { color: colors.mutedText }]} maxFontSizeMultiplier={1.2}>
              {lang.sub}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    width: '46%',
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  flag: {
    fontSize: 32,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    fontSize: 12,
    textAlign: 'center',
  },
});
