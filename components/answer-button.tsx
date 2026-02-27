import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

import { ButtonColors, type ButtonState } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export type { ButtonState };

interface AnswerButtonProps {
  label: string;
  state: ButtonState;
  onPress: () => void;
  index: number;
}

export function AnswerButton({ label, state, onPress, index }: AnswerButtonProps) {
  const { colorScheme } = useAppTheme();
  const colors = useMemo(() => ButtonColors[colorScheme][state], [colorScheme, state]);

  // ─── Haptic feedback on state transition ────────────────────────────────────
  useEffect(() => {
    if (state === 'correct')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (state === 'wrong')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [state]);

  // ─── Entrance stagger animation ─────────────────────────────────────────────
  const enterOpacity = useSharedValue(0);
  const enterY = useSharedValue(-8);

  useEffect(() => {
    enterOpacity.value = 0;
    enterY.value = -8;
    enterOpacity.value = withDelay(index * 50, withTiming(1, { duration: 200 }));
    enterY.value = withDelay(index * 50, withTiming(0, { duration: 220 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // ─── Pulse on correct/wrong reveal ──────────────────────────────────────────
  const scale = useSharedValue(1);
  useEffect(() => {
    if (state === 'correct' || state === 'wrong') {
      scale.value = withSpring(1.04, { damping: 10, stiffness: 260 }, () => {
        scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      });
    }
  }, [state, scale]);

  // ─── Disabled fade ───────────────────────────────────────────────────────────
  const disabledOpacity = useSharedValue(1);
  useEffect(() => {
    if (state === 'disabled') {
      disabledOpacity.value = withTiming(0.55, { duration: 200 });
    } else {
      disabledOpacity.value = 1;
    }
  }, [state, disabledOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: enterY.value }],
    opacity: enterOpacity.value * disabledOpacity.value,
  }));

  const icon: 'check' | 'close' | null =
    state === 'correct' ? 'check' : state === 'wrong' ? 'close' : null;

  return (
    <Animated.View style={[styles.outerWrapper, animatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.bg, borderColor: colors.border },
          pressed && state === 'idle' && styles.pressed,
        ]}
        onPress={onPress}
        disabled={state !== 'idle'}
        accessibilityLabel={icon ? `${icon} ${label}` : label}
        accessibilityRole="button"
        accessibilityState={{ disabled: state !== 'idle' }}>
        <View style={styles.row}>
          {icon ? (
            <MaterialIcons name={icon} size={16} color={colors.text} style={styles.icon} />
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
          <Animated.Text
            style={[styles.label, { color: colors.text }]}
            maxFontSizeMultiplier={1.2}
            numberOfLines={2}
            adjustsFontSizeToFit>
            {label}
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    minWidth: '47%',
  },
  button: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  icon: {
    width: 16,
    textAlign: 'center',
  },
  iconPlaceholder: {
    width: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
});
