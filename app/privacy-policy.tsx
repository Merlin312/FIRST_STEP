import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Blue, Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export default function PrivacyPolicyScreen() {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.surfaceBorder }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Назад"
          accessibilityRole="button">
          <Text style={[styles.backText, { color: isDark ? Blue[300] : Blue[600] }]}>← Назад</Text>
        </Pressable>
        <Text style={[styles.title, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
          Конфіденційність
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
          Оновлено: 27 лютого 2026 р.
        </Text>

        <Section title="Які дані зберігаються" palette={palette}>
          <Text style={[styles.body, { color: palette.text }]} maxFontSizeMultiplier={1.3}>
            Додаток зберігає дані виключно{' '}
            <Text style={styles.bold}>локально на вашому пристрої</Text>:
          </Text>
          <BulletList
            palette={palette}
            items={[
              'Прогрес навчання (слова пройдено, правильні/неправильні відповіді)',
              'Щоденна ціль та стрік активності',
              'Налаштування (тема, категорія слів, автоперехід, звук)',
              'Прапорець першого запуску (онбординг)',
            ]}
          />
        </Section>

        <Section title="Що ми НЕ збираємо" palette={palette}>
          <BulletList
            palette={palette}
            items={[
              "Жодних персональних даних (ім'я, email, телефон)",
              'Дані не передаються третім особам',
              'Без аналітики, реклами або трекерів',
              'Без власних серверів або баз даних',
            ]}
          />
        </Section>

        <Section title="Дозволи Android" palette={palette}>
          <Text style={[styles.body, { color: palette.text }]} maxFontSizeMultiplier={1.3}>
            <Text style={styles.bold}>VIBRATE</Text>
            {" — тактильний зворотний зв'язок при відповіді."}
            {'\n\n'}Жодних інших дозволів (камера, мікрофон, геолокація, контакти) не запитується.
          </Text>
        </Section>

        <Section title="Видалення даних" palette={palette}>
          <Text style={[styles.body, { color: palette.text }]} maxFontSizeMultiplier={1.3}>
            Ви можете видалити всі дані через Меню → Налаштування → Скинути прогрес, або видаливши
            Додаток з пристрою.
          </Text>
        </Section>

        <Section title="Контакти" palette={palette}>
          <Text style={[styles.body, { color: palette.text }]} maxFontSizeMultiplier={1.3}>
            Питання щодо конфіденційності:{'\n'}
            <Text style={[styles.bold, { color: isDark ? Blue[300] : Blue[600] }]}>
              YOUR_EMAIL@example.com
            </Text>
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  palette,
  children,
}: {
  title: string;
  palette: typeof Colors.light | typeof Colors.dark;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function BulletList({
  items,
  palette,
}: {
  items: string[];
  palette: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: palette.mutedText }]}>•</Text>
          <Text style={[styles.bulletText, { color: palette.text }]} maxFontSizeMultiplier={1.3}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    minWidth: 60,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  updated: {
    fontSize: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  list: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
});
