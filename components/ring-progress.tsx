import { StyleSheet, View } from 'react-native';

interface RingProgressProps {
  /** 0–1 */
  progress: number;
  size: number;
  thickness: number;
  color: string;
  trackColor: string;
}

/**
 * View-based circular progress ring using the two-semicircle technique.
 * Does not require react-native-svg.
 */
export function RingProgress({ progress, size, thickness, color, trackColor }: RingProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const halfSize = size / 2;
  const radius = halfSize;

  // First half: rotates from 0 to 180° covering 0–50% progress
  // Second half: rotates from 0 to 180° covering 50–100% progress
  const rotate1 = clampedProgress <= 0.5 ? clampedProgress * 360 : 180;
  const rotate2 = clampedProgress > 0.5 ? (clampedProgress - 0.5) * 360 : 0;
  const showSecondHalf = clampedProgress > 0.5;

  return (
    <View style={{ width: size, height: size }}>
      {/* Background track ring */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: radius,
            borderWidth: thickness,
            borderColor: trackColor,
          },
        ]}
      />

      {/* Right half clipper — covers 0–50% progress */}
      <View
        style={{
          position: 'absolute',
          width: halfSize,
          height: size,
          left: halfSize,
          overflow: 'hidden',
        }}>
        <View
          style={{
            width: size,
            height: size,
            left: -halfSize,
            borderRadius: radius,
            borderWidth: thickness,
            borderColor: color,
            transform: [{ rotate: `${rotate1}deg` }],
          }}
        />
      </View>

      {/* Left half clipper — covers 50–100% progress */}
      {showSecondHalf && (
        <View
          style={{
            position: 'absolute',
            width: halfSize,
            height: size,
            left: 0,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: thickness,
              borderColor: color,
              transform: [{ rotate: `${rotate2}deg` }],
            }}
          />
        </View>
      )}
    </View>
  );
}
