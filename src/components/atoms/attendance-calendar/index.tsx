/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {COLORS, CONSTANT, FONTS, SIZE, STYLES} from '@res';
import {DataType} from '@types';
import {Common} from '@utils';
import React, {FC, memo, useCallback} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {Calendar} from 'react-native-calendars';

interface AttendanceCalenderProps {
  showPresent?: boolean;
  isDoubleDuty?: boolean;
  presentDates: DataType.AttendanceData[];
  currMonth: number;
  onDayPress?: (day: DataType.DateProps) => void;
  onMonthChange?: (day: DataType.DateProps) => void;
}

interface DayViewProps {
  date: DataType.DateProps;
  showPresent?: boolean;
  isDoubleDuty?: boolean;
  isPresent: boolean;
  isCurrMonth: boolean;
  isDD: boolean | undefined;
}
const DayView: FC<DayViewProps> = ({date, isDD, isPresent, isCurrMonth}) => {
  return (
    <TouchableOpacity
      activeOpacity={CONSTANT.BUTTON_OPACITY}
      onPress={() => {
        // Common.showToast(date?.dateString);
      }}
      style={[
        styles.dayView,
        isDD && styles.dayViewDD,
        {backgroundColor: isDD ? COLORS.WHITE : COLORS.PRIMARY_LIGHT},
        isCurrMonth && styles.dayDisableView,
        isPresent && (isDD ? styles.presentDayViewDD : styles.presentDayView),
      ]}>
      <Text
        style={[
          styles.dayText,
          isPresent && (isDD ? styles.presentDayTextDD : styles.presentDayText),
        ]}>
        {date.day + ''}
      </Text>
    </TouchableOpacity>
  );
};
const AttendanceCalender: FC<AttendanceCalenderProps> = ({
  currMonth,
  presentDates,
  onMonthChange,
  isDoubleDuty,
}) => {
  const [desableNextRow, setDesableNextRow] = React.useState(false);

  const checkMonth = (cDate: DataType.DateProps) => {
    const currentYear = Common.getCurrentYear();
    const currentMonth = Common.getCurrentMonth(); // assuming this is 1-based (i.e., Jan = 1)

    const isPastMonth =
      cDate.year < currentYear ||
      (cDate.year === currentYear && cDate.month < currentMonth);

    setDesableNextRow(!isPastMonth); // disable if not a past month

    onMonthChange?.(cDate);
  };

  const renderDayComponent = useCallback(
    ({date}: {date: DataType.DateProps}) => {
      const isCurrMonth = date?.month !== currMonth;
      const isPresent = presentDates?.some(item => {
        return (
          Common.dateFormatFromTo(
            item.date ?? '',
            'DD-MM-YYYY',
            'YYYY-MM-DD',
          ) === date.dateString &&
          item?.isPresent &&
          (isDoubleDuty ? item?.doubleLogs?.length > 0 : true)
        );
      });
      return (
        <DayView
          date={date}
          isPresent={isPresent}
          isCurrMonth={isCurrMonth}
          isDD={isDoubleDuty}
        />
      );
    },
    [currMonth, isDoubleDuty, presentDates],
  );
  return (
    <Calendar
      style={{
        ...styles.calenderContainerStyle,
        ...{...(isDoubleDuty ? styles.ddShadow : styles.shadow)},
        backgroundColor: isDoubleDuty ? COLORS.PRIMARY_MEDIUM : COLORS.WHITE,
      }}
      theme={{
        arrowColor: isDoubleDuty ? COLORS.WHITE : COLORS.PRIMARY_DARK,
        textSectionTitleColor: isDoubleDuty
          ? COLORS.WHITE
          : COLORS.PRIMARY_DARK,
        calendarBackground: isDoubleDuty ? COLORS.PRIMARY_MEDIUM : COLORS.WHITE,
        monthTextColor: isDoubleDuty ? COLORS.WHITE : COLORS.PRIMARY_DARK,
      }}
      dayComponent={renderDayComponent}
      minDate={'2022-01-01'}
      maxDate={Common.formatTodayDate('YYYY-MM-DD')}
      pastScrollRange={36}
      futureScrollRange={0}
      hideExtraDays={false}
      hideArrows={false}
      onMonthChange={checkMonth}
      disableArrowRight={desableNextRow}
    />
  );
};
export default memo(AttendanceCalender);

const styles = StyleSheet.create({
  ddCalView: {
    backgroundColor: COLORS.PRIMARY,
  },
  dotOuter: {
    flexDirection: 'row',
    marginTop: SIZE.MVS(2),
  },
  emptyDot: {
    backgroundColor: COLORS.TRANSPARENT,
  },

  dotView: {
    height: SIZE.MS(4),
    width: SIZE.MS(4),
    borderRadius: SIZE.MS(4),
    backgroundColor: COLORS.SUCCESS,
    marginHorizontal: SIZE.MS(2),
  },
  presentDayView: {
    backgroundColor: COLORS.SUCCESS,
  },
  presentDayViewDD: {
    backgroundColor: COLORS.SUCCESS,
  },
  presentDayText: {
    color: COLORS.WHITE,
  },
  presentDayTextDD: {
    color: COLORS.WHITE,
  },
  dayDisableView: {
    backgroundColor: COLORS.DISABLED,
  },
  dayViewDD: {
    backgroundColor: COLORS.WHITE,
    borderWidth: SIZE.MS(1),
  },
  dayView: {
    width: (Common.width - 100) / 7,
    height: (Common.width - 100) / 7,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: SIZE.MS(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
  },
  ddBg: {
    backgroundColor: COLORS.PRIMARY,
  },
  shadow: {
    ...STYLES.SHADOW_PRIMARY_6,
  },
  ddShadow: {
    ...STYLES.SHADOW_WHITE_6,
  },
  calenderContainerStyle: {
    marginBottom: SIZE.MVS(25),
    borderColor: COLORS.BORDER_DEFAULT,
    paddingBottom: SIZE.MVS(15),
    borderBottomRightRadius: SIZE.MS(12),
    borderBottomLeftRadius: SIZE.MS(12),
  },
});

// /* {showPresent && (
//       <View style={styles.dotOuter}>
//         <View style={[styles.dotView, !showPresent && styles.emptyDot]} />
//         {isDoubleDuty && <View style={styles.dotView} />}
//       </View>
//     )} */
