import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Blue, Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

const MILESTONE_TEXTS: Record<number, string> = {
  10: 'Чудовий початок! Перший крок зроблено.',
  50: '50 слів — це вже помітний прогрес!',
  100: '100 слів. Ти покриваєш більшість текстів!',
  200: '200 слів — справжнє досягнення!',
  300: '300 слів. Більшість людей ніколи не доходять так далеко.',
  500: '500 слів! Словниковий запас для реального спілкування.',
};

interface MilestoneModalProps {
  visible: boolean;
  milestone: number | null;
  onDismiss: () => void;
}

export function MilestoneModal({ visible, milestone, onDismiss }: MilestoneModalProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
    } else {
      scale.value = withTiming(0.8, { duration: 0 });
      opacity.value = withTiming(0, { duration: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!milestone) return null;

  const subtitle = MILESTONE_TEXTS[milestone] ?? `${milestone} слів вивчено!`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <Pressable
        style={styles.overlay}
        onPress={onDismiss}
        accessibilityLabel="Закрити"
        accessibilityRole="button">
        <Pressable onPress={() => {}} accessibilityRole="none">
          <Animated.View style={[styles.card, { backgroundColor: palette.background }, cardStyle]}>
            <Text style={styles.trophy} accessibilityLabel="Трофей">
              🏆
            </Text>
            <Text style={[styles.title, { color: palette.text }]} maxFontSizeMultiplier={1.2}>
              Ти вивчив вже {milestone} слів!
            </Text>
            <Text
              style={[styles.subtitle, { color: palette.mutedText }]}
              maxFontSizeMultiplier={1.2}>
              {subtitle}
            </Text>
            <View style={styles.badge}>
              <MaterialIcons
                name="local-fire-department"
                size={16}
                color={isDark ? Blue[300] : Blue[500]}
              />
              <Text
                style={[styles.badgeText, { color: isDark ? Blue[300] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                Продовжуй у тому ж темпі!
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: Blue[600] },
                pressed && { opacity: 0.85 },
              ]}
              onPress={onDismiss}
              accessibilityLabel="Продовжити навчання"
              accessibilityRole="button">
              <Text style={styles.btnText} maxFontSizeMultiplier={1.2}>
                Продовжити
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 30,
    width: 300,
  },
  trophy: {
    fontSize: 52,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  btn: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
