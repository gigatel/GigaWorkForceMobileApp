/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import React from 'react';
import {COLORS, CONSTANT, FONTS, SIZE, STYLES} from '@res';
import {FC} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity} from 'react-native';

interface CardButtonProps {
  isDD: boolean;
  title: string;
  icon: number;
  onPress?: () => void;
}
export const CardButton: FC<CardButtonProps> = ({
  isDD = true,
  title,
  icon,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.attButton, isDD && styles.ddView]}
      onPress={onPress}
      activeOpacity={CONSTANT.BUTTON_OPACITY}>
      <Image
        source={icon}
        style={[styles.attButtonImage, isDD && styles.ddImage]}
      />
      <Text style={[styles.attButtonTitle, isDD && styles.ddTitle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ddImage: {
    tintColor: COLORS.PRIMARY_DARK,
  },
  ddTitle: {
    color: COLORS.PRIMARY_DARK,
  },
  ddView: {
    backgroundColor: COLORS.WHITE,
  },
  attButtonTitle: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(15),
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
    marginTop: SIZE.MVS(5),
  },
  attButton: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    margin: SIZE.MVS(10),
    padding: SIZE.MS(10),
    flex: 1,
    borderRadius: SIZE.MS(12),
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    maxHeight: SIZE.MVS(90),
    ...STYLES.SHADOW_PRIMARY_3,
  },
  attButtonImage: {
    width: SIZE.MVS(40),
    height: SIZE.MVS(40),
    resizeMode: 'contain',
    tintColor: COLORS.PRIMARY_DARK,
  },
  attButtonsViewRow: {
    flexDirection: 'row',
    paddingVertical: SIZE.MVS(20),
    marginHorizontal: SIZE.MVS(10),
  },

  outerView: {
    marginVertical: SIZE.MVS(10),
  },
});
