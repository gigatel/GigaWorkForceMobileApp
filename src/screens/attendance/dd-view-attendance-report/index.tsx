/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {ListView} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, SIZE} from '@res';
import {viewAttendanceInOutReportApi} from '@slices/attendance.slice';
import {ScreenProps} from '@types';
import {Common} from '@utils';
import React, {FC, useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import YearMonthPicker from 'react-native-year-month-pickers';
import {connect, useDispatch} from 'react-redux';
import {AttendanceHeaderTitle} from '../components/attendance-header';
import {DateInfoButtons} from '../components/date-buttons';

const Header = ({title}: {title: string}) => {
  return (
    <AttendanceHeaderTitle
      title={title}
      isHeader={true}
      isBorder={title !== 'OT'}
      isDD={true}
    />
  );
};
const DateValue = ({title}: {title: string}) => {
  return <AttendanceHeaderTitle title={title} isHeader={false} isDD={true} />;
};
const DDViewAttendanceReport: FC<ScreenProps.DDViewAttendanceReport> = ({
  navigation,
  loading,
  data,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [month, setMonth] = useState<string>(Common.getCurrentMonth() + '');
  const [year, setYear] = useState<string>(Common.getCurrentYear() + '');

  const dispatch = useDispatch<StoreDispatch>();

  const getData = useCallback(
    (mnth: string, yer: string) => {
      dispatch(
        viewAttendanceInOutReportApi({
          page: '1',
          size: '31',
          year: yer,
          month: mnth,
          showAttPolicy: false,
          search: '',
          // ofDate: 0,
          // status: '',
          // dayOrNight: 'day',
        }),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    getData(month, year);

    return () => {};
  }, [month, year, dispatch, getData]);

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'fixed'}
      loading={loading}
      navBarColor={COLORS.PRIMARY_MEDIUM}>
      <BackHeader
        headerTitle={'Double Duty Attendance Report '}
        onBackPress={() => {
          navigation.goBack();
        }}
      />
      <View style={styles.headerView}>
        <Header title={'Date'} />
        <Header title={'In'} />
        <Header title={'Out'} />
        <Header title={'Late'} />
        <Header title={'WH'} />
        <Header title={'OT'} />
      </View>
      <ListView
        data={data ?? []}
        renderItem={({item}) => {
          const isDD = item?.doubleDuty !== null;
          const ddData = isDD ? item?.doubleDuty : item;
          return (
            <>
              <View style={styles.dayView}>
                <DateValue title={`${ddData.date.split('-')[0]}`} />

                <DateValue title={isDD ? ddData?.inTime ?? '' : ''} />
                <DateValue title={isDD ? ddData?.outTime ?? '' : ''} />
                <DateValue title={isDD ? ddData?.late ?? '' : ''} />
                <DateValue title={isDD ? ddData?.workingHours ?? '' : ''} />
                <DateValue title={isDD ? ddData?.overTime ?? '' : ''} />
              </View>
              {isDD && (
                <View style={styles.behalfView}>
                  <Text
                    style={
                      styles.behalfText
                    }>{`Duty done on behalf of: ${ddData?.empName}`}</Text>
                </View>
              )}
            </>
          );
        }}
      />
      <DateInfoButtons
        onDatePress={() => setShowPicker(true)}
        date={Common.dateFormatFromTo(
          month + '/' + year,
          'MM/YYYY',
          'MMM YYYY',
        )}
        isDD={true}
      />

      <YearMonthPicker
        primaryColor={COLORS.PRIMARY}
        show={showPicker}
        value={month + '/' + year}
        onClose={() => setShowPicker(false)}
        onDone={dt => {
          setMonth(dt.split('/')[0]);
          setYear(dt.split('/')[1]);
          setShowPicker(false);
        }}
      />
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.attendance.inoutLoading === 'pending',
  data: state.attendance.inoutReportData,
});
export default connect(MapStateToProps)(DDViewAttendanceReport);

const styles = StyleSheet.create({
  behalfView: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingVertical: SIZE.MVS(12),
    borderBottomWidth: SIZE.MS(2),
    borderColor: COLORS.PRIMARY_DARK,
  },
  behalfText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_DARKER,
    textAlign: 'center',
  },
  dayView: {
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
  },
  headerView: {
    backgroundColor: COLORS.PRIMARY_DARK,
    flexDirection: 'row',
  },
});
