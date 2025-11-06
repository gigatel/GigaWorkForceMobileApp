/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity} from 'react-native';

interface DropdownInputFieldProps {
  title?: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
  isRequired?: boolean;
}

const DropdownInput: React.FC<DropdownInputFieldProps> = ({
  title,
  value,
  placeholder = 'Select',
  disabled,
  isRequired,
  onPress,
}) => {
  return (
    <>
      {title && (
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
          {isRequired && <Text style={styles.requiredText}>{'*'}</Text>}
        </Text>
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.65}
        style={styles.dropdownView}>
        <Text style={styles.dropdownValueText}>{value ?? placeholder}</Text>
        <Image source={IMAGES.down} style={styles.downArrowButton} />
      </TouchableOpacity>
    </>
  );
};
DropdownInput.displayName = 'DropdownInput';
export default React.memo(DropdownInput);

const styles = StyleSheet.create({
  downArrowButton: {
    height: SIZE.MS(25),
    width: SIZE.MS(25),
    tintColor: COLORS.BORDER_SECONDARY,
  },
  dropdownView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(6),
    paddingHorizontal: SIZE.MS(10),
    paddingVertical: SIZE.MS(15),
    marginVertical: SIZE.MS(10),
    // height: SIZE.MS(50),
    maxHeight: SIZE.MS(63),
    backgroundColor: COLORS.WHITE,
  },
  dropdownValueText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(13),
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  titleText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(15),
    color: COLORS.PRIMARY_DARK,
    marginTop: SIZE.MVS(10),
  },
  requiredText: {
    fontSize: SIZE.MS(16),
    color: COLORS.ERROR,
    fontFamily: FONTS.BOLD,
  },
});
