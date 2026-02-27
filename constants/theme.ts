import { Platform } from 'react-native';

// Синя палітра (Tailwind blue)
export const Blue = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
} as const;

// Сіра палітра (Tailwind slate)
export const Slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
} as const;

export const Colors = {
  light: {
    text: Slate[900],
    background: '#ffffff',
    tint: Blue[600],
    icon: Blue[400],
    tabIconDefault: Slate[400],
    tabIconSelected: Blue[600],
    // Семантичні кольори поверхонь
    surface: Blue[50],
    cardBackground: Blue[100], // slightly deeper than surface, for panel cards
    surfaceBorder: Blue[200],
    mutedText: Slate[500],
    subtleText: Slate[400],
    // Семантичні кольори стану
    success: '#22c55e',
    danger: '#ef4444',
    link: '#0a7ea4',
  },
  dark: {
    text: Slate[100],
    background: Slate[900],
    tint: Blue[400],
    icon: Blue[300],
    tabIconDefault: Slate[500],
    tabIconSelected: Blue[400],
    // Семантичні кольори поверхонь
    surface: Slate[800],
    cardBackground: Slate[700], // slightly lighter than surface, for cards inside panels
    surfaceBorder: Slate[600], // more visible border (was Slate[700])
    mutedText: Slate[400],
    subtleText: Slate[500],
    // Семантичні кольори стану
    success: '#86efac',
    danger: '#fca5a5',
    link: Blue[400],
  },
};

export type ButtonState = 'idle' | 'correct' | 'wrong' | 'disabled';

export const ButtonColors: Record<
  'light' | 'dark',
  Record<ButtonState, { bg: string; text: string; border: string }>
> = {
  light: {
    idle: { bg: Blue[50], text: Blue[900], border: Blue[200] },
    correct: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
    wrong: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    disabled: { bg: Slate[50], text: Slate[400], border: Slate[200] },
  },
  dark: {
    idle: { bg: Slate[800], text: Blue[200], border: Slate[700] },
    correct: { bg: '#14532d', text: '#86efac', border: '#22c55e' },
    wrong: { bg: '#450a0a', text: '#fca5a5', border: '#ef4444' },
    disabled: { bg: Slate[900], text: Slate[600], border: Slate[800] },
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
