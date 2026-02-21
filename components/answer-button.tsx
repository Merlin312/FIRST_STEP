import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ButtonColors, type ButtonState } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export type { ButtonState };

interface AnswerButtonProps {
  label: string;
  state: ButtonState;
  onPress: () => void;
}

export function AnswerButton({ label, state, onPress }: AnswerButtonProps) {
  const { colorScheme } = useAppTheme();
  const colors = useMemo(
    () => ButtonColors[colorScheme][state],
    [colorScheme, state],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.bg, borderColor: colors.border },
        pressed && state === 'idle' && styles.pressed,
      ]}
      onPress={onPress}
      disabled={state !== 'idle'}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: state !== 'idle' }}>
      <Text style={[styles.label, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
});
