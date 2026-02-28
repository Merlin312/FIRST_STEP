import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Blue, Colors } from '@/constants/theme';
import {
  WORDS,
  WORDS_BY_CATEGORY,
  type Word,
  type WordCategory,
  type TargetLanguage,
} from '@/constants/words';
import { WORDS_ES, WORDS_ES_BY_CATEGORY } from '@/constants/words-es';
import { WORDS_DE, WORDS_DE_BY_CATEGORY } from '@/constants/words-de';
import { useAppTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { useKnownWords } from '@/hooks/use-known-words';

const CATEGORY_ALL = 'all' as const;
type FilterCategory = WordCategory | typeof CATEGORY_ALL;

function getWordSource(lang: TargetLanguage): {
  all: Word[];
  byCategory: Record<WordCategory, Word[]>;
} {
  switch (lang) {
    case 'es':
      return { all: WORDS_ES, byCategory: WORDS_ES_BY_CATEGORY };
    case 'de':
      return { all: WORDS_DE, byCategory: WORDS_DE_BY_CATEGORY };
    default:
      return { all: WORDS, byCategory: WORDS_BY_CATEGORY };
  }
}

export default function WordsScreen() {
  const router = useRouter();
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const { strings: s } = useLanguage();

  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(CATEGORY_ALL);

  const { isKnown, toggleKnown, knownCount, isLoaded } = useKnownWords(targetLanguage);

  // Load targetLanguage from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.targetLanguage)
      .then((val) => {
        if (val === 'es' || val === 'de') setTargetLanguage(val);
      })
      .catch(() => {});
  }, []);

  const source = useMemo(() => getWordSource(targetLanguage), [targetLanguage]);

  const filteredWords = useMemo(() => {
    let words =
      activeCategory === CATEGORY_ALL
        ? source.all
        : (source.byCategory[activeCategory as WordCategory] ?? source.all);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      words = words.filter(
        (w) => w.target.toLowerCase().includes(q) || w.ua.toLowerCase().includes(q),
      );
    }
    return words;
  }, [source, activeCategory, searchQuery]);

  const CATEGORY_FILTERS: { label: string; value: FilterCategory }[] = [
    { label: s.catAll, value: CATEGORY_ALL },
    { label: s.catVerb, value: 'verb' },
    { label: s.catNoun, value: 'noun' },
    { label: s.catAdj, value: 'adjective' },
    { label: s.catAdv, value: 'adverb' },
  ];

  const renderItem = ({ item }: { item: Word }) => {
    const known = isKnown(item);
    return (
      <View
        style={[
          styles.row,
          { borderBottomColor: palette.surfaceBorder },
          known && { backgroundColor: isDark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.08)' },
        ]}>
        {/* Left: word + IPA */}
        <View style={styles.rowLeft}>
          <Text
            style={[styles.targetWord, { color: known ? palette.success : palette.text }]}
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}>
            {item.target}
          </Text>
          {item.transcription ? (
            <Text
              style={[styles.transcription, { color: palette.subtleText }]}
              maxFontSizeMultiplier={1.2}>
              {item.transcription}
            </Text>
          ) : null}
        </View>

        {/* Middle: Ukrainian translation */}
        <Text
          style={[styles.uaWord, { color: palette.mutedText }]}
          maxFontSizeMultiplier={1.2}
          numberOfLines={2}>
          {item.ua}
        </Text>

        {/* Right: toggle known button */}
        <Pressable
          style={({ pressed }) => [styles.checkBtn, pressed && { opacity: 0.6 }]}
          onPress={() => void toggleKnown(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={known ? s.wordsMarkUnknown : s.wordsMarkKnown}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: known }}>
          {known ? (
            <View style={styles.checkCircleFilled}>
              <MaterialIcons name="check" size={14} color="#fff" />
            </View>
          ) : (
            <View style={[styles.checkCircleEmpty, { borderColor: palette.subtleText }]} />
          )}
        </Pressable>
      </View>
    );
  };

  const isEmpty = isLoaded && filteredWords.length === 0 && !searchQuery;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.surfaceBorder }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
          accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={isDark ? Blue[300] : Blue[600]} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
          {s.wordsScreenTitle}
        </Text>

        <Text
          style={[styles.headerCount, { color: isDark ? Blue[300] : Blue[600] }]}
          maxFontSizeMultiplier={1.2}>
          {s.wordsKnownCount(knownCount, source.all.length)}
        </Text>
      </View>

      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
        ]}>
        <MaterialIcons name="search" size={18} color={palette.subtleText} />
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          placeholder={s.wordsSearchPlaceholder}
          placeholderTextColor={palette.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          maxFontSizeMultiplier={1.2}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={16} color={palette.subtleText} />
          </Pressable>
        )}
      </View>

      {/* Category filter pills */}
      <View style={styles.filterRow}>
        {CATEGORY_FILTERS.map(({ label, value }) => {
          const active = activeCategory === value;
          return (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.filterPill,
                {
                  backgroundColor: active ? (isDark ? Blue[500] : Blue[600]) : palette.surface,
                  borderColor: active ? (isDark ? Blue[500] : Blue[600]) : palette.surfaceBorder,
                },
                pressed && !active && { opacity: 0.7 },
              ]}
              onPress={() => setActiveCategory(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text
                style={[
                  styles.filterPillText,
                  { color: active ? '#fff' : isDark ? Blue[300] : Blue[700] },
                ]}
                maxFontSizeMultiplier={1.2}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Word list */}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color={palette.success} />
          <Text
            style={[styles.emptyText, { color: palette.mutedText }]}
            maxFontSizeMultiplier={1.2}>
            {s.wordsAllKnownEmpty}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWords}
          keyExtractor={(item) => item.target}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={30}
          maxToRenderPerBatch={30}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  filterPill: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  rowLeft: {
    width: 120,
    flexShrink: 0,
  },
  targetWord: {
    fontSize: 15,
    fontWeight: '700',
  },
  transcription: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 1,
  },
  uaWord: {
    flex: 1,
    fontSize: 14,
  },
  checkBtn: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleFilled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
