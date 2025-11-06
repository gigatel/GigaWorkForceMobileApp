/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {COLORS, CONTENT, FONTS, SIZE} from '@res';
import {ScreenProps} from '@types';
import React, {FC, memo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

const PrivacyItem = memo(({item}: {item: any}) => {
  return (
    <View style={styles.outerView}>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.descText}>{item.description}</Text>
    </View>
  );
});
const PrivacyPolicy: FC<ScreenProps.PrivacyPolicy> = ({navigation}) => {
  return (
    <Screen statusBgColor={COLORS.PRIMARY} preset={'fixed'}>
      <BackHeader
        headerTitle={'Privacy Policy'}
        onBackPress={() => {
          navigation.goBack();
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        {CONTENT.privacyContent.map(item => {
          return <PrivacyItem item={item} key={item.title} />;
        })}
      </ScrollView>
    </Screen>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  container: {flex: 1, marginHorizontal: SIZE.MS(25)},
  content: {flexGrow: 1},
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
