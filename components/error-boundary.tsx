import { Appearance, Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Blue, Colors } from '@/constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  handleRetry = () => {
    // Incrementing retryCount remounts children via the key prop, giving React
    // a clean slate instead of the potentially broken component subtree.
    this.setState((prev) => ({ hasError: false, retryCount: prev.retryCount + 1 }));
  };

  render() {
    if (this.state.hasError) {
      // Appearance API is safe in class components — honours the user's current theme
      const isDark = Appearance.getColorScheme() === 'dark';
      const palette = isDark ? Colors.dark : Colors.light;

      return (
        <View
          style={[styles.container, { backgroundColor: palette.background }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive">
          <Text style={[styles.text, { color: palette.danger }]}>Щось пішло не так.</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
            onPress={this.handleRetry}
            accessibilityLabel="Спробувати знову"
            accessibilityRole="button">
            <Text style={styles.retryText}>Спробувати знову</Text>
          </Pressable>
        </View>
      );
    }

    // key forces React to fully remount children after a retry,
    // clearing the stale component state that caused the error.
    return (
      <View key={this.state.retryCount} style={styles.fill}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Blue[600],
    borderRadius: 10,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
