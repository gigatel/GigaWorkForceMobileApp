/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 @ ℂ𝕣𝕖𝕒𝕥𝕖𝕕 𝕆𝕟: Tue Apr 22 2025
 */

import {Buttons} from '@atoms';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import React, {FC, memo} from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';

interface UserNameDesigRowProps {
  name: string;
  designation: string;
  onBellPress?: () => void;
  onLogoutPress?: () => void;
  style?: ViewStyle;
}
const UserNameDesigRow: FC<UserNameDesigRowProps> = ({
  name,
  designation,
  onBellPress,
  onLogoutPress,
  style,
}) => {
  return (
    <View style={[styles.userDetailsContainer, style]}>
      <View style={styles.shortNameView}>
        <Text style={styles.shortNameText}>{name[0]}</Text>
      </View>
      <View style={styles.nameTextView}>
        <Text style={styles.userNameText}>{name}</Text>
        <Text style={styles.userDesignText}>{designation}</Text>
      </View>
      {onBellPress && (
        <Buttons
          type={'icon'}
          icon={IMAGES.notification}
          onPress={onBellPress}
          viewStyle={styles.bellButton}
        />
      )}
      {onLogoutPress && (
        <Buttons
          type={'icon'}
          icon={IMAGES.logout}
          onPress={onLogoutPress}
          viewStyle={styles.bellButton}
        />
      )}
    </View>
  );
};

export default memo(UserNameDesigRow);

const styles = StyleSheet.create({
  bellButton: {
    width: SIZE.MS(40),
    alignItems: 'flex-end',
    borderRadius: 0,
  },
  userDetailsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(15),
    paddingVertical: SIZE.MS(10),
    alignItems: 'center',
  },
  shortNameView: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: SIZE.MS(25),
    width: SIZE.MS(50),
    height: SIZE.MS(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortNameText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(25),
    color: COLORS.PRIMARY_DARK,
  },
  nameTextView: {
    marginLeft: SIZE.MS(10),
    justifyContent: 'center',
    flex: 1,
    marginVertical: SIZE.MVS(10),
  },
  userNameText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(20),
    color: COLORS.WHITE,
  },
  userDesignText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(12),
    color: COLORS.WHITE,
  },
});
