// Button.tsx
import {COLORS, CONSTANT, FONTS, SIZE, STYLES} from '@res';
import React from 'react';
import {
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  type?:
    | 'primary'
    | 'close'
    | 'delete'
    | 'icon'
    | 'leftIconText'
    | 'rightIconText'
    | 'primaryRightIconText';
  title?: string;
  disabled?: boolean;
  icon?: number;
  viewStyle?: ViewStyle;
  titleStyle?: TextStyle;
  iconStyle?: ImageStyle;
  onPress?: () => void;
}

interface ViewStyles {
  primary: ViewStyle;
  close: ViewStyle;
  delete: ViewStyle;
  leftIconText: ViewStyle;
  rightIconText: ViewStyle;
  primaryRightIconText: ViewStyle;
  icon: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  type = 'primary',
  title,
  icon,
  disabled = false,
  viewStyle,
  titleStyle,
  iconStyle,
  onPress,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[viewStyles[type], viewStyle]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={CONSTANT.BUTTON_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={title || 'Button'}
      {...props}>
      {(type === 'leftIconText' || type === 'icon') && (
        <Image source={icon} style={[iconStyles[type], iconStyle]} />
      )}
      {title && type !== 'icon' && (
        <Text style={[titleStyles[type], titleStyle]}>{title || 'Button'}</Text>
      )}
      {(type === 'rightIconText' || type === 'primaryRightIconText') && (
        <Image source={icon} style={[iconStyles[type], iconStyle]} />
      )}
    </TouchableOpacity>
  );
};
const BASE_STYLE: ViewStyle = {
  height: SIZE.MVS(55),
  maxHeight: SIZE.MVS(55),
  borderRadius: SIZE.MVS(55),
  justifyContent: 'center',
  alignItems: 'center',
};
const BASE_TEXT_STYLE: TextStyle = {
  fontSize: SIZE.MVS(15),
  fontFamily: FONTS.BOLD,
};

const viewStyles: ViewStyles = {
  icon: {
    ...BASE_STYLE,
    backgroundColor: COLORS.TRANSPARENT,
  },
  leftIconText: {
    ...BASE_STYLE,
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
  },
  rightIconText: {
    ...BASE_STYLE,
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
  },
  primaryRightIconText: {
    ...BASE_STYLE,
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
  },
  primary: {
    ...BASE_STYLE,
    backgroundColor: COLORS.PRIMARY,
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.PRIMARY,
    ...STYLES.SHADOW_PRIMARY_3,
  },
  close: {
    ...BASE_STYLE,
    backgroundColor: COLORS.WHITE,
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.PRIMARY,
    ...STYLES.SHADOW_PRIMARY_3,
  },
  delete: {
    ...BASE_STYLE,
    backgroundColor: COLORS.WHITE,
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.ERROR,
    ...STYLES.SHADOW_DELETE,
  },
};
const titleStyles = {
  leftIconText: {
    ...BASE_TEXT_STYLE,
    color: COLORS.TEXT_LINK,
    fontFamily: FONTS.REGULAR,
  },
  rightIconText: {
    ...BASE_TEXT_STYLE,
    color: COLORS.TEXT_LINK,
    fontFamily: FONTS.REGULAR,
  },
  primaryRightIconText: {
    ...BASE_TEXT_STYLE,
    color: COLORS.WHITE,
    fontFamily: FONTS.MEDIUM,
  },
  primary: {
    ...BASE_TEXT_STYLE,
    color: COLORS.WHITE,
  },
  close: {
    ...BASE_TEXT_STYLE,
    color: COLORS.PRIMARY,
  },
  delete: {
    ...BASE_TEXT_STYLE,
    color: COLORS.ERROR,
  },
};

const iconStyles = StyleSheet.create({
  leftIconText: {
    marginRight: SIZE.MS(8),
    width: SIZE.MS(25),
    height: SIZE.MS(25),
    resizeMode: 'contain',
    tintColor: COLORS.TEXT_LINK,
  },
  rightIconText: {
    marginLeft: SIZE.MS(8),
    width: SIZE.MS(25),
    height: SIZE.MS(25),
    resizeMode: 'contain',
    tintColor: COLORS.TEXT_LINK,
  },
  primaryRightIconText: {
    marginLeft: SIZE.MS(8),
    width: SIZE.MS(25),
    height: SIZE.MS(25),
    resizeMode: 'contain',
    tintColor: COLORS.WHITE,
  },
  icon: {
    width: SIZE.MS(25),
    height: SIZE.MS(25),
    resizeMode: 'contain',
    tintColor: COLORS.WHITE,
  },
});
export default Button;
