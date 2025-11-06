/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons} from '@atoms';
import {COLORS, IMAGES, SIZE} from '@res';
import React, {FC, memo} from 'react';
import {StyleSheet, View} from 'react-native';

interface DateInfoButtonsProps {
  date: string;
  isDD?: boolean;
  onDatePress?: () => void;
  onInfoPress?: () => void;
}
export const DateInfoButtons: FC<DateInfoButtonsProps> = memo(
  ({date, isDD = false, onDatePress, onInfoPress}) => {
    return (
      <View style={[styles.buttonView, isDD && styles.ddBg]}>
        <Buttons
          type={'leftIconText'}
          icon={IMAGES.calendar}
          title={date}
          viewStyle={{...styles.dateButton, ...(isDD && styles.ddbutton)}}
          iconStyle={{...styles.icon, ...(isDD && styles.ddIcon)}}
          titleStyle={{...styles.buttonTitleText, ...(isDD && styles.ddTitle)}}
          onPress={onDatePress}
        />
        {onInfoPress && (
          <Buttons
            type={'leftIconText'}
            icon={IMAGES.info}
            title={'Info'}
            viewStyle={styles.dateButton}
            iconStyle={styles.icon}
            titleStyle={styles.buttonTitleText}
            onPress={onInfoPress}
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  ddTitle: {color: COLORS.PRIMARY_DARK},
  ddIcon: {tintColor: COLORS.PRIMARY_DARK},
  ddbutton: {
    backgroundColor: COLORS.WHITE,
  },
  ddBg: {
    backgroundColor: COLORS.PRIMARY_MEDIUM,
  },
  buttonTitleText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(17),
  },
  icon: {
    tintColor: COLORS.WHITE,
  },
  buttonView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZE.MVS(10),
    backgroundColor: COLORS.WHITE,
  },
  dateButton: {
    borderRadius: SIZE.MS(12),
    flex: 1,
    marginHorizontal: SIZE.MS(10),
    backgroundColor: COLORS.PRIMARY,
  },
});
