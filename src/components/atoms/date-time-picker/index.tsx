/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import {Common} from '@utils';
import React, {FC, memo, useEffect, useState} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import DatePicker from 'react-native-date-picker';

interface DatePickerProps {
  title?: string;
  mode: 'date' | 'time' | 'datetime';
  minDate?: string | 'today' | Date; // "YYYY-MM-DD"
  maxDate?: string | 'today' | Date; // "YYYY-MM-DD"
  placeholder?: string;
  disabled?: boolean;
  isRequired?: boolean;
  date: Date | null;
  viewStyle?: ViewStyle;
  setDate: (dt: Date | null) => void;
}
const DateTimePicker: FC<DatePickerProps> = ({
  title,
  minDate,
  maxDate,
  placeholder,
  date,
  disabled,
  isRequired,
  viewStyle,
  setDate,
}) => {
  const [cDate, setCDate] = useState(new Date());
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) {
      setCDate(date ?? new Date());
    }
  }, [date, show]);

  let mnDate;
  let mxDate;
  if (minDate === 'today') {
    mnDate = new Date();
  } else if (minDate instanceof Date) {
    mnDate = date ? date : undefined;
  } else if (minDate !== '') {
    mnDate = minDate ? new Date(minDate) : undefined;
  }
  if (maxDate === 'today') {
    mxDate = new Date();
  } else if (maxDate instanceof Date) {
    mxDate = date ? date : undefined;
  } else if (maxDate !== '') {
    mxDate = maxDate ? new Date(maxDate) : undefined;
  }

  // console.log('Min Date', mnDate);
  // console.log('Max Date', mxDate);
  // console.log('date', Common.formatDate(date));
  return (
    <>
      {title && (
        <Text style={styles.titleText}>
          {title}
          {isRequired && <Text style={styles.requiredText}>{'*'}</Text>}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => {
          setShow(true);
        }}
        disabled={disabled}
        activeOpacity={0.65}
        style={[styles.dropdownView, viewStyle]}>
        <Text style={styles.dropdownValueText}>
          {date ? Common.formatDate(date, 'DD-MMM-YYYY') : placeholder}
        </Text>
        <Image source={IMAGES.calendar} style={styles.calenderIconButton} />
      </TouchableOpacity>
      <DatePicker
        modal={true}
        mode={'date'}
        title={title}
        open={show}
        date={cDate}
        minimumDate={mnDate}
        maximumDate={mxDate}
        buttonColor={COLORS.PRIMARY}
        dividerColor={COLORS.PRIMARY_LIGHT}
        onConfirm={(dt: Date) => {
          setShow(false);
          setCDate(dt);
          setDate(dt);
        }}
        onCancel={() => {
          setShow(false);
        }}
      />
    </>
  );
};
export default memo(DateTimePicker);

const styles = StyleSheet.create({
  calenderIconButton: {
    height: SIZE.MS(25),
    width: SIZE.MS(25),
    tintColor: COLORS.TEXT_LIGHT,
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
    height: SIZE.MS(50),
    maxHeight: SIZE.MS(60),
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
