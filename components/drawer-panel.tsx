import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BACKDROP_CLOSE_TIMING,
  BACKDROP_OPEN_TIMING,
  DRAWER_WIDTH,
  PANEL_SPRING,
  SWIPE_THRESHOLD,
} from '@/constants/ui';
import { Blue, Colors } from '@/constants/theme';
import type { WordCategory, TargetLanguage } from '@/constants/words';
import { useAppTheme } from '@/contexts/theme-context';
import { useStatsContext } from '@/contexts/stats-context';
import { useLanguage } from '@/contexts/language-context';
import { useAuthContext } from '@/contexts/auth-context';
import type { ReminderDays } from '@/hooks/use-reminder-settings';
import type { QuizDirection } from '@/hooks/use-quiz';

import { SettingsSection } from '@/components/drawer/settings-section';
import { StatsSection } from '@/components/drawer/stats-section';

interface DrawerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResetQuiz?: () => void;
  todayCount: number;
  dailyGoal: number;
  category: WordCategory | undefined;
  onCategoryChange: (cat: WordCategory | undefined) => void;
  autoAdvance: boolean;
  onAutoAdvanceChange: (val: boolean) => void;
  optionsCount: 4 | 6 | 8;
  onOptionsCountChange: (val: 4 | 6 | 8) => void;
  quizDirection: QuizDirection;
  onQuizDirectionChange: (val: QuizDirection) => void;
  targetLanguage: TargetLanguage;
  onTargetLanguageChange: (val: TargetLanguage) => void;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: ReminderDays;
  onReminderEnabledChange: (val: boolean) => Promise<void>;
  onReminderTimeChange: (time: string) => Promise<void>;
  onReminderDaysChange: (days: ReminderDays) => Promise<void>;
}

export function DrawerPanel({
  isOpen,
  onClose,
  onResetQuiz,
  todayCount,
  dailyGoal,
  category,
  onCategoryChange,
  autoAdvance,
  onAutoAdvanceChange,
  optionsCount,
  onOptionsCountChange,
  quizDirection,
  onQuizDirectionChange,
  targetLanguage,
  onTargetLanguageChange,
  reminderEnabled,
  reminderTime,
  reminderDays,
  onReminderEnabledChange,
  onReminderTimeChange,
  onReminderDaysChange,
}: DrawerPanelProps) {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { strings: s } = useLanguage();
  const { user, isGuest, signInWithGoogle, signInWithApple, signOut } = useAuthContext();

  const { totalAnswered, totalWrong, streak, bestStreak, accuracy } = useStatsContext();

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(isOpen ? 0 : -DRAWER_WIDTH, PANEL_SPRING);
    backdropOpacity.value = withTiming(
      isOpen ? 0.5 : 0,
      isOpen ? BACKDROP_OPEN_TIMING : BACKDROP_CLOSE_TIMING,
    );
    // translateX and backdropOpacity are stable shared values (like useRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    // pointerEvents is set via JSX prop below — not duplicated here
  }));

  // Swipe left to close the panel
  const swipeCloseGesture = Gesture.Pan().onEnd((e) => {
    if (e.translationX < -SWIPE_THRESHOLD) {
      runOnJS(onClose)();
    }
  });

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { width: screenWidth }, backdropStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={s.closeMenu}
        />
      </Animated.View>

      {/* Panel — swipe left to close */}
      <GestureDetector gesture={swipeCloseGesture}>
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: palette.background,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              borderRightColor: palette.surfaceBorder,
            },
            panelStyle,
          ]}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <View>
              <Text
                style={[styles.panelTitle, { color: palette.text }]}
                maxFontSizeMultiplier={1.2}>
                First Step
              </Text>
              <Text
                style={[styles.panelSubtitle, { color: palette.subtleText }]}
                maxFontSizeMultiplier={1.2}>
                {s.guestMode}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel={s.closeMenu}
              accessibilityRole="button">
              <MaterialIcons name="close" size={22} color={isDark ? Blue[300] : Blue[600]} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Auth section */}
            <Text
              style={[styles.sectionLabel, { color: palette.subtleText }]}
              maxFontSizeMultiplier={1.2}>
              {s.accountSection}
            </Text>
            {isGuest ? (
              <View style={styles.authCard}>
                <Pressable
                  style={({ pressed }) => [
                    styles.authBtn,
                    styles.authBtnPrimary,
                    { backgroundColor: isDark ? Blue[700] : Blue[600] },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={signInWithGoogle}
                  accessibilityRole="button">
                  <MaterialIcons name="login" size={16} color="#fff" />
                  <Text style={styles.authBtnPrimaryText} maxFontSizeMultiplier={1.2}>
                    {s.signIn}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.authBtn,
                    styles.authBtnSecondary,
                    { borderColor: isDark ? Blue[500] : Blue[400] },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={signInWithApple}
                  accessibilityRole="button">
                  <Text
                    style={[styles.authBtnSecondaryText, { color: isDark ? Blue[300] : Blue[700] }]}
                    maxFontSizeMultiplier={1.2}>
                    {s.signUp}
                  </Text>
                </Pressable>
                <Text
                  style={[styles.authHint, { color: palette.subtleText }]}
                  maxFontSizeMultiplier={1.2}>
                  {s.syncProgress}
                </Text>
              </View>
            ) : (
              <View style={styles.authCard}>
                <View style={styles.userRow}>
                  <View
                    style={[styles.avatar, { backgroundColor: isDark ? Blue[700] : Blue[100] }]}>
                    <Text
                      style={[styles.avatarInitial, { color: isDark ? Blue[200] : Blue[700] }]}
                      maxFontSizeMultiplier={1}>
                      {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text
                      style={[styles.userName, { color: palette.text }]}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={1}>
                      {user?.displayName ?? user?.email ?? ''}
                    </Text>
                    {user?.email && user?.displayName ? (
                      <Text
                        style={[styles.userEmail, { color: palette.subtleText }]}
                        maxFontSizeMultiplier={1.2}
                        numberOfLines={1}>
                        {user.email}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.authBtn,
                    styles.authBtnSecondary,
                    { borderColor: isDark ? Blue[500] : Blue[400] },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={signOut}
                  accessibilityRole="button">
                  <Text
                    style={[styles.authBtnSecondaryText, { color: isDark ? Blue[300] : Blue[700] }]}
                    maxFontSizeMultiplier={1.2}>
                    {s.signOut}
                  </Text>
                </Pressable>
              </View>
            )}
            <Divider palette={palette} />
            <StatsSection
              isDark={isDark}
              todayCount={todayCount}
              dailyGoal={dailyGoal}
              totalAnswered={totalAnswered}
              totalWrong={totalWrong}
              accuracy={accuracy}
              streak={streak}
              bestStreak={bestStreak}
            />
            <Divider palette={palette} />
            <SettingsSection
              isDark={isDark}
              category={category}
              onCategoryChange={onCategoryChange}
              autoAdvance={autoAdvance}
              onAutoAdvanceChange={onAutoAdvanceChange}
              optionsCount={optionsCount}
              onOptionsCountChange={onOptionsCountChange}
              quizDirection={quizDirection}
              onQuizDirectionChange={onQuizDirectionChange}
              targetLanguage={targetLanguage}
              onTargetLanguageChange={onTargetLanguageChange}
              onClose={onClose}
              onResetQuiz={onResetQuiz}
              reminderEnabled={reminderEnabled}
              reminderTime={reminderTime}
              reminderDays={reminderDays}
              onReminderEnabledChange={onReminderEnabledChange}
              onReminderTimeChange={onReminderTimeChange}
              onReminderDaysChange={onReminderDaysChange}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text
              style={[styles.footer, { color: palette.subtleText }]}
              maxFontSizeMultiplier={1.2}>
              First Step v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
            <Pressable
              onPress={() => {
                onClose();
                router.push('/privacy-policy');
              }}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel={s.privacyPolicy}>
              <Text
                style={[styles.privacyLink, { color: isDark ? Blue[400] : Blue[600] }]}
                maxFontSizeMultiplier={1.2}>
                {s.privacyPolicy}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

function Divider({ palette }: { palette: { surfaceBorder: string } }) {
  return <View style={[styles.divider, { backgroundColor: palette.surfaceBorder }]} />;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 11,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  panelSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  footer: {
    fontSize: 11,
    textAlign: 'center',
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  privacyLink: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  authCard: {
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  authBtnPrimary: {
    // backgroundColor set inline (theme-dependent)
  },
  authBtnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  authBtnSecondary: {
    borderWidth: 1,
    // borderColor set inline (theme-dependent)
  },
  authBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  authHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 11,
    marginTop: 1,
  },
});
