import { useWindowDimensions } from 'react-native';

/** Threshold (dp) above which the device is treated as a tablet */
const TABLET_BREAKPOINT = 768;

/** Maximum content width for comfortable reading on large screens */
const MAX_CONTENT_WIDTH = 520;

/** Horizontal padding applied to the main content container */
const HORIZONTAL_PADDING = 20;

export function useDevice() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const isLandscape = width > height;

  // On tablets: cap width and center; on phones: fill width minus padding
  const contentWidth = isTablet
    ? Math.min(width - HORIZONTAL_PADDING * 2, MAX_CONTENT_WIDTH)
    : width - HORIZONTAL_PADDING * 2;

  const horizontalPadding = isTablet
    ? (width - contentWidth) / 2
    : HORIZONTAL_PADDING;

  return { width, height, isTablet, isLandscape, contentWidth, horizontalPadding };
}
