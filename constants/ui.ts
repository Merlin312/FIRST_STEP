import { Easing } from 'react-native-reanimated';

// ─── Quiz ─────────────────────────────────────────────────────────────────────

/** Milliseconds before auto-advancing to the next word after an answer. */
export const QUIZ_ADVANCE_DELAY_MS = 1500;

/** Milliseconds for the animated progress bar fill transition. */
export const PROGRESS_BAR_TIMING_MS = 400;

// ─── Drawer ───────────────────────────────────────────────────────────────────

export const DRAWER_WIDTH = 300;

/** Spring config for the side panel slide — smooth, no overshoot. */
export const PANEL_SPRING = {
  damping: 32,
  stiffness: 280,
  mass: 0.85,
  overshootClamping: true,
} as const;

/** Timing config for backdrop fade-in. */
export const BACKDROP_OPEN_TIMING = {
  duration: 260,
  easing: Easing.out(Easing.ease),
} as const;

/** Timing config for backdrop fade-out. */
export const BACKDROP_CLOSE_TIMING = {
  duration: 200,
  easing: Easing.in(Easing.ease),
} as const;

// ─── Gesture ──────────────────────────────────────────────────────────────────

/** Min horizontal translation (px) to trigger a swipe action. */
export const SWIPE_THRESHOLD = 50;

/** Max X position (px) where a swipe-to-open gesture may start. */
export const SWIPE_OPEN_EDGE = 40;

// ─── Splash ───────────────────────────────────────────────────────────────────

/** Milliseconds for splash screen fade-out. */
export const SPLASH_FADE_DURATION_MS = 300;
