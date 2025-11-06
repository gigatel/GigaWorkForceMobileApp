/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {COLORS, CONSTANT, FONTS, IMAGES, SIZE, STYLES} from '@res';
import React, {FC, memo} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity} from 'react-native';

interface ButtonProps {
  shift: 'single' | 'double';
  type: 'in' | 'out';
  disabled: boolean;
  onPress: () => void;
  time: string;
  title?: string;
}

export const MarkInOutButton: FC<ButtonProps> = memo(
  ({shift, type, disabled, onPress, time, title}) => {
    const isIn = type === 'in';
    const buttonStyle = [
      styles.attButton,
      shift === 'double' && styles.doubleDutyBorder,
      isIn ? styles.attButtonMarkIn : styles.attButtonMarkOut,
      disabled && styles.disabled,
    ];
    const buttonImageStyle = [
      styles.attButtonImage,
      isIn ? styles.attButtonImageIn : styles.attButtonImageOut,
      disabled && styles.attButtonImageDisable,
    ];
    const buttonTitleStyle = [
      styles.attButtonTitle,
      isIn ? styles.markInTitle : styles.markOutTitle,
      disabled && styles.disabledTitle,
    ];

    return (
      <TouchableOpacity
        activeOpacity={CONSTANT.BUTTON_OPACITY}
        style={buttonStyle}
        onPress={onPress}>
        <Image
          source={
            isIn
              ? shift === 'single'
                ? IMAGES.markIn
                : IMAGES.markInDouble
              : shift === 'single'
              ? IMAGES.markOut
              : IMAGES.markOutDouble
          }
          style={buttonImageStyle}
        />
        <Text style={buttonTitleStyle}>
          {isIn
            ? shift === 'single'
              ? 'Mark In'
              : title ?? 'Mark In\nDouble Duty'
            : shift === 'single'
            ? 'Mark out'
            : 'Mark Out\nDouble Duty'}
        </Text>
        {time && <Text style={styles.outTimeText}> {time}</Text>}
      </TouchableOpacity>
    );
  },
);
const styles = StyleSheet.create({
  doubleDutyBorder: {
    borderWidth: SIZE.MS(2),
  },
  outTimeText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(15),
    color: COLORS.TEXT_DARKER,
    marginTop: SIZE.MS(5),
  },
  markInTitle: {
    color: COLORS.SUCCESS,
  },
  disabledTitle: {
    color: COLORS.TEXT_DARK,
  },
  markOutTitle: {
    color: COLORS.ERROR,
  },
  disabled: {
    backgroundColor: COLORS.DISABLED,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  attButtonTitle: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(22),
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
  },
  attButtonMarkOut: {
    backgroundColor: COLORS.BUTTON_CANCEL,
    borderColor: COLORS.ERROR,
  },
  attButtonMarkIn: {
    backgroundColor: COLORS.BACKGROUND_GREEN,
    borderColor: COLORS.SUCCESS,
  },
  attButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_GREEN,
    paddingVertical: SIZE.MVS(10),
    marginHorizontal: SIZE.MVS(5),
    borderRadius: SIZE.MS(12),
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    ...STYLES.SHADOW_BLACK_3,
  },
  attButtonImageIn: {
    tintColor: COLORS.SUCCESS,
  },
  attButtonImageOut: {
    tintColor: COLORS.ERROR,
  },
  attButtonImageDisable: {
    tintColor: COLORS.TEXT_DARK,
  },
  attButtonImage: {
    width: SIZE.MVS(60),
    height: SIZE.MVS(60),
    resizeMode: 'contain',
    marginRight: SIZE.MVS(10),
  },
});
