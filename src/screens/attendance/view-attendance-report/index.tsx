import {ListView} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS} from '@res';
import {viewAttendanceInOutReportApi} from '@slices/attendance.slice';
import {ScreenProps} from '@types';
import {Common} from '@utils';
import React, {FC, useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import YearMonthPicker from 'react-native-year-month-pickers';
import {connect, useDispatch} from 'react-redux';
import {AttendanceHeaderTitle} from '../components/attendance-header';
import {DateInfoButtons} from '../components/date-buttons';
import {InfoAttendamceSheet} from '../components/info-sheet';
const ViewAttendanceReport: FC<ScreenProps.ViewAttendanceReport> = ({
  navigation,
  loading,
  data,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
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
    <Screen statusBgColor={COLORS.PRIMARY} preset={'fixed'} loading={loading}>
      <BackHeader
        headerTitle={'Attendance Report '}
        onBackPress={() => {
          navigation.goBack();
        }}
      />
      <View style={styles.headerView}>
        <AttendanceHeaderTitle title={'Date'} />
        <AttendanceHeaderTitle title={'In'} />
        <AttendanceHeaderTitle title={'Out'} />
        <AttendanceHeaderTitle title={'Late'} />
        <AttendanceHeaderTitle title={'WH'} />
        <AttendanceHeaderTitle title={'OT'} isBorder={false} />
      </View>

      <ListView
        data={data}
        renderItem={({item}) => {
          return (
            <View
              style={[
                styles.dayView,
                // item?.status === 'A'
                //   ? styles.absentBg
                //   : item?.status === 'P'
                //   ? styles.presentBg
                //   : item?.status === 'HD'
                //   ? styles.halfDayBg
                //   : styles.dayView,
              ]}>
              <AttendanceHeaderTitle
                title={`${item.date.split('-')[0]} ${
                  item?.status ? '(' + item?.status + ')' : ''
                }`}
                isHeader={false}
              />
              <AttendanceHeaderTitle
                title={item?.inTime ?? ''}
                isHeader={false}
              />
              <AttendanceHeaderTitle
                title={item?.outTime ?? ''}
                isHeader={false}
              />
              <AttendanceHeaderTitle
                title={item?.late ?? ''}
                isHeader={false}
              />
              <AttendanceHeaderTitle
                title={item?.workingHours ?? ''}
                isHeader={false}
              />
              <AttendanceHeaderTitle
                title={item?.overTime ?? ''}
                isBorder={false}
                isHeader={false}
              />
            </View>
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
        onInfoPress={() => setShowInfo(true)}
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
      <InfoAttendamceSheet
        type={'single'}
        show={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.attendance.inoutLoading === 'pending',
  data: state.attendance.inoutReportData,
});
export default connect(MapStateToProps)(ViewAttendanceReport);

const styles = StyleSheet.create({
  absentBg: {
    backgroundColor: COLORS.BACKGROUND_PINK,
  },
  halfDayBg: {
    backgroundColor: COLORS.WAITING,
  },
  presentBg: {
    backgroundColor: COLORS.ACCENT_GREEN_LIGHT,
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
