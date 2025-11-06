/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import React from 'react';
import {COLORS, FONTS, SIZE} from '@res';
import {Image, StyleSheet, Text, View} from 'react-native';

export const IconTitleRow = ({icon, title}: {icon: number; title: string}) => {
  return (
    <View style={styles.imageTitleRow}>
      <Image source={icon} style={styles.imageTitleImage} />
      <Text style={styles.imageTitleText}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  imageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZE.MVS(4),
    marginHorizontal: SIZE.MVS(20),
  },
  imageTitleImage: {
    width: SIZE.MVS(20),
    height: SIZE.MVS(20),
    resizeMode: 'contain',
    marginRight: SIZE.MVS(15),
    tintColor: COLORS.PRIMARY,
  },
  imageTitleText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(13),
    color: COLORS.PRIMARY_DARK,
    marginRight: SIZE.MS(20),
  },
});
