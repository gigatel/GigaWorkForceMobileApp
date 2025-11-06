/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 @ ℂ𝕣𝕖𝕒𝕥𝕖𝕕 𝕆𝕟: Sun Apr 20 2025
 */

import {COLORS, FONTS, SIZE} from '@res';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface NotFoundViewProps {
  message?: string;
}
export const NotFoundView: React.FC<NotFoundViewProps> = ({message}) => {
  return (
    <View style={styles.mainView}>
      <Text style={styles.messageText}>{message ?? 'No Record(s) Found'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZE.MVS(20),
  },
  messageText: {
    fontSize: SIZE.MS(20),
    color: COLORS.TEXT_DARKER,
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
  },
});
