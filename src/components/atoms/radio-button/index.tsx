/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {COLORS, CONSTANT, FONTS, SIZE} from '@res';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface RadioButtonProps {
  viewStyle?: ViewStyle;
  active: boolean;
  title?: string;
  onPress?: () => void;
}
const RadioButton: React.FC<RadioButtonProps> = ({
  active,
  viewStyle,
  title,
  onPress,
}) => {
  return (
    <>
      {title ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={CONSTANT.BUTTON_OPACITY}
          style={[styles.titleViewRow, viewStyle]}>
          <View style={[styles.mainView, active && styles.activeMainView]}>
            <View
              style={[styles.innerView, active && styles.activeInnerView]}
            />
          </View>
          <Text style={styles.titleText}>{title}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={CONSTANT.BUTTON_OPACITY}
          style={[styles.mainView, active && styles.activeMainView, viewStyle]}>
          <View style={[styles.innerView, active && styles.activeInnerView]} />
        </TouchableOpacity>
      )}
    </>
  );
};
export default RadioButton;
const styles = StyleSheet.create({
  titleText: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    fontFamily: FONTS.MEDIUM,
    marginLeft: SIZE.MS(10),
  },
  mainView: {
    borderRadius: SIZE.MVS(20),
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.BORDER_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZE.MS(5),
  },
  innerView: {
    width: SIZE.MVS(10),
    height: SIZE.MVS(10),
    borderRadius: SIZE.MVS(10),
    backgroundColor: COLORS.WHITE,
  },
  titleViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeMainView: {
    borderColor: COLORS.PRIMARY,
  },
  activeInnerView: {
    backgroundColor: COLORS.PRIMARY,
  },
});
