/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {COLORS, FONTS, SIZE} from '@res';
import React, {FC, memo} from 'react';
import {ColorValue, StyleSheet, Text} from 'react-native';
import * as Animatable from 'react-native-animatable';
import ModalSheet from '../modal-sheet';
interface AlertViewProps {
  show: boolean;
  title?: string;
  message?: string;
  icon?: number;
  iconTintColor?: ColorValue;
  onDonePress?: () => void;
  onClose?: () => void;
}

const AlertView: FC<AlertViewProps> = ({
  show,
  title,
  message,
  icon,
  iconTintColor,
  onDonePress,
  onClose,
}) => {
  return (
    <ModalSheet
      show={show}
      title={title}
      onPrimaryPress={onDonePress}
      onClose={onClose}>
      {icon && (
        <Animatable.Image
          duration={5000}
          animation={'bounceIn'}
          source={icon}
          style={styles.iconImage}
          tintColor={iconTintColor}
        />
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
    </ModalSheet>
  );
};
export default memo(AlertView);
const styles = StyleSheet.create({
  iconImage: {
    width: SIZE.MS(100),
    height: SIZE.MS(100),
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  title: {
    fontSize: SIZE.MS(20),
    textAlign: 'center',
    marginTop: SIZE.MS(20),
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_DARKER,
    paddingHorizontal: SIZE.MS(20),
  },
  message: {
    fontSize: SIZE.MS(16),
    textAlign: 'center',
    marginTop: SIZE.MS(20),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_MEDIUM,
    paddingHorizontal: SIZE.MS(20),
  },
});
