/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {COLORS, FONTS, SIZE} from '@res';
import React, {FC, memo} from 'react';
import {StyleSheet, Text} from 'react-native';

interface AttendanceHeaderTitleProps {
  title: string;
  isBorder?: boolean;
  isHeader?: boolean;
  isDD?: boolean;
}
export const AttendanceHeaderTitle: FC<AttendanceHeaderTitleProps> = memo(
  ({title, isBorder = true, isHeader = true, isDD = false}) => {
    return (
      <>
        {isDD ? (
          <Text
            style={[
              isHeader ? styles.headerTitle : styles.dayTitle,
              isHeader && styles.headerBGDD,
              styles.ddBg,
              styles.ddTitle,
              isBorder ? styles.isBorder : styles.notBorder,
            ]}>
            {title}
          </Text>
        ) : (
          <Text
            style={[
              isHeader ? styles.headerTitle : styles.dayTitle,
              isBorder && styles.isBorder,
              !isBorder && styles.notBorder,
            ]}>
            {title}
          </Text>
        )}
      </>
    );
  },
);

const styles = StyleSheet.create({
  ddTitle: {
    color: COLORS.WHITE,
  },
  headerBGDD: {
    backgroundColor: COLORS.PRIMARY_DARK,
  },
  ddBg: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
  },
  notBorder: {
    borderRightWidth: 0,
  },
  isBorder: {
    borderRightWidth: SIZE.MS(1),
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZE.MS(15),
    color: COLORS.WHITE,
    fontFamily: FONTS.MEDIUM,
    paddingVertical: SIZE.MVS(15),
    textAlign: 'center',
    borderColor: COLORS.WHITE,
    borderBottomWidth: SIZE.MS(1),
  },
  dayTitle: {
    flex: 1,
    fontSize: SIZE.MS(11),
    color: COLORS.PRIMARY_DARK,
    fontFamily: FONTS.REGULAR,
    paddingVertical: SIZE.MVS(15),
    textAlign: 'center',
    borderColor: COLORS.BORDER_SECONDARY,
    borderBottomWidth: SIZE.MS(1),
  },
});
