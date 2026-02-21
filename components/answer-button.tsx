import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ButtonColors, type ButtonState } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export type { ButtonState };

interface AnswerButtonProps {
  label: string;
  state: ButtonState;
  onPress: () => void;
}

const STATE_ICON: Partial<Record<ButtonState, string>> = {
  correct: '✓',
  wrong: '✗',
};

export function AnswerButton({ label, state, onPress }: AnswerButtonProps) {
  const { colorScheme } = useAppTheme();
  const colors = useMemo(
    () => ButtonColors[colorScheme][state],
    [colorScheme, state],
  );

  const icon = STATE_ICON[state];

  return (
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
          <Text
            style={[styles.icon, { color: colors.text }]}
            maxFontSizeMultiplier={1.2}>
            {icon}
          </Text>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        <Text
          style={[styles.label, { color: colors.text }]}
          maxFontSizeMultiplier={1.2}>
          {label}
        </Text>
      </View>
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
  },
  pressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 15,
    fontWeight: '700',
    width: 16,
    textAlign: 'center',
  },
  iconPlaceholder: {
    width: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
});
