import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Blue, Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

interface CelebrationModalProps {
  visible: boolean;
  goal: number;
  onDismiss: () => void;
}

export function CelebrationModal({ visible, goal, onDismiss }: CelebrationModalProps) {
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
      scale.value = 0.8;
      opacity.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onDismiss} accessibilityLabel="Закрити">
        <Pressable onPress={() => {}} accessibilityRole="none">
          <Animated.View
            style={[styles.card, { backgroundColor: palette.background }, cardStyle]}>
            <Text style={styles.emoji}>🎉</Text>
            <Text
              style={[styles.title, { color: palette.text }]}
              maxFontSizeMultiplier={1.2}>
              Мету досягнуто!
            </Text>
            <Text
              style={[styles.subtitle, { color: palette.mutedText }]}
              maxFontSizeMultiplier={1.2}>
              Сьогодні ви вивчили{'\n'}
              <Text style={{ fontWeight: '700', color: isDark ? Blue[300] : Blue[700] }}>
                {goal} слів
              </Text>
              . Чудова робота!
            </Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statsEmoji]}>🔥</Text>
              <Text
                style={[styles.statsText, { color: palette.mutedText }]}
                maxFontSizeMultiplier={1.2}>
                Серія не переривається
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
                Продовжити 🚀
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
  emoji: {
    fontSize: 52,
    lineHeight: 64,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsEmoji: {
    fontSize: 16,
  },
  statsText: {
    fontSize: 13,
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
