/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 @ ℂ𝕣𝕖𝕒𝕥𝕖𝕕 𝕆𝕟: Tue Apr 22 2025
 */

import {ModalSheet} from '@molecules';
import {COLORS, CONTENT, FONTS, SIZE} from '@res';
import {Common} from '@utils';
import React, {memo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

interface PrivacySheetProps {
  show: boolean;
  onClose: () => void;
}

const PrivacyItem = memo(({item}: {item: any}) => {
  return (
    <View style={styles.outerView}>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.descText}>{item.description}</Text>
    </View>
  );
});

const PrivacySheet: React.FC<PrivacySheetProps> = ({show, onClose}) => {
  Common.log('PrivacySheet');
  return (
    <ModalSheet
      show={show}
      title={'Privacy Policy'}
      closeTitle={'Close'}
      style={{}}
      onClosePress={onClose}>
      <ScrollView style={styles.container}>
        {CONTENT.privacyContent.map(item => {
          return <PrivacyItem item={item} key={item.title} />;
        })}
      </ScrollView>
    </ModalSheet>
  );
};

export default memo(PrivacySheet);

const styles = StyleSheet.create({
  container: {},
  outerView: {
    marginVertical: SIZE.MVS(10),
  },
  titleText: {
    fontSize: SIZE.MS(16),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARKER,
    marginBottom: SIZE.MVS(10),
  },
  descText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: SIZE.MVS(10),
  },
});
