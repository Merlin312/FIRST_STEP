import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

const SPRING = {
  damping: 32,
  stiffness: 280,
  mass: 0.85,
  overshootClamping: true,
} as const;

type Palette = (typeof Colors)['light'] | (typeof Colors)['dark'];

export function SettingsSection({ isDark }: { isDark: boolean }) {
  const palette: Palette = isDark ? Colors.dark : Colors.light;
  const [isExpanded, setIsExpanded] = useState(false);
  const contentHeight = useRef(0);
  const heightValue = useSharedValue(0);
  const chevronAngle = useSharedValue(0);

  const animatedHeight = useAnimatedStyle(() => ({
    height: heightValue.value,
    overflow: 'hidden',
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronAngle.value * 90}deg` }],
  }));

  const toggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    heightValue.value = withSpring(next ? contentHeight.current : 0, SPRING);
    chevronAngle.value = withSpring(next ? 1 : 0, SPRING);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
        onPress={toggle}
        accessibilityLabel="Налаштування"
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}>
        <Text style={[styles.label, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
          ⚙️  НАЛАШТУВАННЯ
        </Text>
        <Animated.View style={chevronStyle}>
          <Text style={[styles.chevron, { color: palette.mutedText }]}>›</Text>
        </Animated.View>
      </Pressable>

      <Animated.View style={animatedHeight}>
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) contentHeight.current = h;
          }}>
          <PlaceholderRow label="Варіантів відповіді" hint="6" palette={palette} />
          <PlaceholderRow label="Тільки нові слова" palette={palette} />
          <PlaceholderRow label="Нагадування" palette={palette} />
        </View>
      </Animated.View>
    </View>
  );
}

function PlaceholderRow({
  label,
  hint,
  palette,
}: {
  label: string;
  hint?: string;
  palette: Palette;
}) {
  return (
    <View style={[styles.row, { opacity: 0.45 }]}>
      <Text style={[styles.rowLabel, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {hint !== undefined && (
          <Text style={[styles.hintText, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
            {hint}
          </Text>
        )}
        <View
          style={[
            styles.soonBadge,
            { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
          ]}>
          <Text style={[styles.soonText, { color: palette.mutedText }]} maxFontSizeMultiplier={1.2}>
            скоро
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '400',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 13,
  },
  soonBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  soonText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
