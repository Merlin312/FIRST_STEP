import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

export type IconSymbolName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * A cross-platform icon component using Material Icons on all platforms.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <MaterialIcons color={color} size={size} name={name} style={style as StyleProp<TextStyle>} />
  );
}
