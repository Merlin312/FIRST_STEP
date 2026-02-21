import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Blue, Colors } from '@/constants/theme';
import { sectionStyles } from './shared';

function handleAuthPlaceholder() {
  Alert.alert('Скоро буде', 'Авторизація буде доступна в наступних оновленнях.');
}

export function AuthSection({ isDark }: { isDark: boolean }) {
  const palette = isDark ? Colors.dark : Colors.light;

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionLabel, { color: palette.mutedText }]}>
        👤  АВТОРИЗАЦІЯ
      </Text>
      <View style={styles.authRow}>
        <Pressable
          style={({ pressed }) => [
            styles.authBtn,
            { borderColor: Blue[600] },
            pressed && styles.pressed,
          ]}
          onPress={handleAuthPlaceholder}
          accessibilityLabel="Увійти в акаунт"
          accessibilityRole="button">
          <Text style={[styles.authBtnText, { color: Blue[600] }]} maxFontSizeMultiplier={1.2}>
            Увійти
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.authBtn,
            { backgroundColor: Blue[600], borderColor: Blue[600] },
            pressed && styles.pressed,
          ]}
          onPress={handleAuthPlaceholder}
          accessibilityLabel="Зареєструватись"
          accessibilityRole="button">
          <Text style={[styles.authBtnText, { color: '#fff' }]} maxFontSizeMultiplier={1.2}>
            Реєстрація
          </Text>
        </Pressable>
      </View>
      <Text style={[styles.comingSoon, { color: palette.subtleText }]}>
        Скоро буде
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  authRow: {
    flexDirection: 'row',
    gap: 8,
  },
  authBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  authBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: 11,
    textAlign: 'center',
  },
});
