/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {AttendanceCalendar} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {useFocusEffect} from '@react-navigation/native';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import {
  getEmpOfficeBranchesApi,
  getEmpZoneChambersApi,
  getTodayWorkingOnBehalfApi,
  todayAttendanceApi,
  viewAttendanceApi,
} from '@slices/attendance.slice';
import {checkCameraPermission} from '@slices/permission.slice';
import {DataType, ScreenProps} from '@types';
import {Common, Location, Preferences, Times, Voice} from '@utils';
import React, {FC, useCallback, useEffect, useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {connect, useDispatch} from 'react-redux';
import {CardButton} from '../components/card-button-view';
import {MarkInOutButton} from '../components/mark-inout-button';
import {log} from 'src/utils/common';
let isFocused = false;
//! **************** DDAttendance Dashboard ***********************
const DDAttendanceDashboard: FC<ScreenProps.DDAttendanceDashboard> = ({
  route,
  navigation,
  loading,
  calenderAttData,
  empData,
  todayAttData: tad,
  todayDoubleDuty: tdd,
  todayDuty,
  employeeShift,
}) => {
  const {isViewAllow, isMarkAllow} = route.params;
  const [currMonth, setCurrMonth] = React.useState<number>(
    Common.getCurrentMonth(),
  );
  const dispatch = useDispatch<StoreDispatch>();
  const currentYear = useMemo(() => Common.getCurrentYear(), []);

  const getData = useCallback(
    (month: number, year: number) => {
      dispatch(
        viewAttendanceApi({
          page: '1',
          size: '31',
          year: year,
          month: month,
          showAttPolicy: true,
          search: '',
          // ofDate: 0,
          // status: '',
          // dayOrNight: 'day',
        }),
      );
    },
    [dispatch],
  );

  const isMissPunch = useCallback(() => {
    return Common.isEqualIgnoreCase(todayDuty?.status ?? '', 'mp');
  }, [todayDuty?.status]);
  const isMissPunchDD = useCallback(() => {
    return Common.isEqualIgnoreCase(tdd?.status ?? '', 'mp');
  }, [tdd?.status]);

  // Check Mark-In and Mark-Out Done to Show Alert
  const checkAlreadyMarkedInOut = useCallback(() => {
    if (isFocused && tdd?.inTime && tdd.outTime) {
      const msg = `आप पहले ही ${tdd?.inTime ?? '-'} पर मार्क इन और ${
        tdd?.outTime
      } पर मार्क आउट कर चुके है।`;
      Common.alert({
        title: 'Already Marked In and Out',
        msg: `You have already Marked In at ${
          tdd?.inTime ?? '-'
        } and Marked Out at ${tdd?.outTime}\n\n${msg}`,
      });
      Voice.speak(msg);
      return true;
    }
    return false;
  }, [tdd?.inTime, tdd?.outTime]);

  useEffect(() => {
    isFocused = true;
    getLastAddress();
    return () => {
      isFocused = false;
    };
  }, []);

  useEffect(() => {
    getData(currMonth, currentYear);
  }, [currMonth, getData, currentYear]);

  const getLastAddress = async () => {
    const data = await Location.getAddressFromLatLong();
    // Preferences.setData('LAST_GEO_ADDRESS', data);
  };

  // Call Totay Attendance API
  useFocusEffect(
    useCallback(() => {
      dispatch(
        todayAttendanceApi({
          employeeId: empData?.id,
          companyId: empData?.companyId,
        }),
      );
    }, [dispatch, empData?.companyId, empData?.id]),
  );

  // Call API
  useFocusEffect(
    useCallback(() => {
      console.log('employeeData==>', {empData});
      dispatch(getEmpOfficeBranchesApi());
      dispatch(getEmpZoneChambersApi());
      dispatch(getTodayWorkingOnBehalfApi('?empId=' + empData?.id));
      dispatch(checkCameraPermission());
    }, [dispatch, empData?.id]),
  );

  useFocusEffect(
    useCallback(() => {
      checkAlreadyMarkedInOut();
    }, [checkAlreadyMarkedInOut]),
  );

  const gotoMarkIn = () => {
    navigation.navigate('AttendanceInOut', {
      from: 'in',
      shiftType: 'double',
      behalfOfData: null,
    });
  };
  const gotoMarkOut = () => {
    navigation.navigate('AttendanceInOut', {
      from: 'out',
      shiftType: 'double',
      behalfOfData: null,
    });
  };
  const onDoubleDutyMarkInPress = () => {
    // Check if Current Shift Over

    if (!Times.isCurrentShiftOver(employeeShift?.shiftEndTime ?? '')) {
      console.log('here2');
      const msg =
        'अपकी वर्तमान शिफ्ट अभी समाप्त नहीं हुई है । अभी डबल ड्यूटी शुरू करने में समय है । ';
      Common.alert({
        title: 'Alert',
        msg,
      });
      Voice.speak(msg);
    }
    //
    else if (Common.isEqualIgnoreCase(todayDuty?.status ?? '', 'pi')) {
      const msg =
        'आपने अभी तक करंट ड्यूटी से मार्क आउट नहीं किया है। पहले मार्क आउट करें फिर डबल ड्यूटी शुरू करें';
      Common.alert({
        title: 'Mark Out Not Done',
        msg,
      });
      Voice.speak(msg);
    }
    //
    else if (tdd?.inTime && tdd.outTime) {
      const msg = `You have already Marked In at ${tdd?.inTime} and Marked Out at ${tdd?.outTime}\n\nआप पहले ही ${tdd?.inTime} पर मार्क इन और ${tdd?.outTime} पर मार्क आउट कर चुके है।`;
      Common.alert({
        title: 'Already Marked In and Out',
        msg,
      });
      Voice.speak(msg);
    } else if (tdd?.inTime) {
      Common.alert({
        title: 'Already Marked In',
        msg: `You have already Marked In at ${
          tdd?.inTime ?? ''
        }\n\nआप पहले ही ${tdd?.inTime ?? ''} पर मार्क इन कर चुके है।`,
      });
      Voice.speak(`आप पहले ही ${tdd?.inTime ?? ''} पर मार्क इन कर चुके है।`);
    }
    //
    else if (
      (tad?.inTimeStr && tad?.outTime) ||
      (!tad?.inTimeStr && !tad?.outTime) ||
      isMissPunch() ||
      Common.isEqualIgnoreCase(todayDuty?.status ?? '', 'a')
    ) {
      gotoMarkIn();
    }
    //
    else {
      Common.showToast('Something went wrong, Try Again!');
    }
    return;
  };

  const onDoubleDutyMarkOutPress = () => {
    if (isMissPunchDD()) {
      const msgInHindi = 'आपने अपनी ड्यूटी का पंच आउट मिस कर दिया है|';
      const msgInEnglish = 'You have missed your punch out.';
      Common.alert({
        title: 'Missed Punch Out',
        msg: `${msgInEnglish}\n\n${msgInHindi}`,
      });
      Voice.speak(msgInHindi);
    }
    //
    else if (tdd?.inTime && tdd.outTime) {
      const msg = `You have already Marked In at ${tdd?.inTime} and Marked Out at ${tdd?.outTime}\n\nआप पहले ही ${tdd?.inTime} पर मार्क इन और ${tdd?.outTime} पर मार्क आउट कर चुके है।`;
      Common.alert({
        title: 'Already Marked In and Out',
        msg,
      });
      Voice.speak(msg);
    }
    //
    else if (tdd?.outTime) {
      Common.alert({
        title: 'Already Marked Out',
        msg: `You have already Marked Out at ${
          tdd?.inTime ?? ''
        }\n\nआप पहले ही ${tdd?.outTime ?? ''} पर मार्क आउट कर चुके है।`,
      });
      Voice.speak(`आप पहले ही ${tdd?.outTime ?? ''} पर मार्क आउट कर चुके है।`);
    }
    // Not Mark In
    else if (!tdd?.inTime) {
      const msg = 'पहले नीचे मार्क इन करें';
      Common.alert({
        title: 'Mark In First',
        msg: `Please mark in first\n\n${msg}`,
      });
      Voice.speak(msg);
    } else if (
      (tdd.inTime && !tdd.outTime) ||
      Common.isEqualIgnoreCase(tdd?.status ?? '', 'pi')
    ) {
      gotoMarkOut();
    } else {
      Common.showToast('Something went wrong!');
    }
  };

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'scroll'}
      loading={loading}
      navBarColor={COLORS.PRIMARY_MEDIUM}
      fixedComponent={
        <BackHeader
          headerTitle={'Double Duty Dashboard '}
          onBackPress={() => {
            navigation.goBack();
          }}
        />
      }>
      <View style={[styles.innerView]}>
        <AttendanceCalendar
          isDoubleDuty={true}
          presentDates={calenderAttData ?? []}
          currMonth={currMonth}
          onMonthChange={(date: DataType.DateProps) => {
            setCurrMonth(date.month);
          }}
        />
        <View style={styles.spacer} />
        {isViewAllow && (
          <CardButton
            isDD={true}
            title={'View Double Duty Report'}
            icon={IMAGES.viewAttendance}
            onPress={() => {
              navigation.navigate('DDViewAttendanceReport');
            }}
          />
        )}
        {tdd?.empName !== null &&
          tdd?.inTime !== null &&
          tdd?.outTime === null && (
            <Text style={styles.timeText}>
              {`आप अभी डबल ड्यूटी पर है आप अभी ${
                tdd?.empName ?? ''
              } की ड्यूटी कर रहे है।`}
            </Text>
          )}
        {tdd &&
          tdd?.empName !== null &&
          tdd?.inTime !== null &&
          tdd?.outTime !== null && (
            <Text style={styles.timeText}>
              {`आपने ${tdd?.empName ?? ''} की डबल ड्यूटी किया है।`}
            </Text>
          )}
        {tad !== null && isMarkAllow && (
          <View style={styles.attButtonsViewRow}>
            {
              <MarkInOutButton
                shift={'double'}
                type={'in'}
                time={tdd?.inTime ?? '-'}
                disabled={tdd?.inTime !== null}
                onPress={onDoubleDutyMarkInPress}
              />
            }
            <MarkInOutButton
              shift={'double'}
              type={'out'}
              time={
                Common.isEqualIgnoreCase(tdd?.status ?? '', 'mp')
                  ? 'Miss Punch'
                  : tdd?.outTime ?? '-'
              }
              disabled={
                (tdd?.outTime === null && tdd?.inTime === null) ||
                (tdd?.outTime !== null && tdd?.inTime !== null)
              }
              onPress={onDoubleDutyMarkOutPress}
            />
          </View>
        )}
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading:
    state.attendance.viewAttLoading === 'pending' ||
    state.attendance.inoutLoading === 'pending' ||
    state.attendance.onBehalfLoading === 'pending' ||
    state.attendance.zoneChambersLoading === 'pending' ||
    state.attendance.officeBranchesLoading === 'pending',
  calenderAttData: state.attendance.calenderAttendanceData,
  empData: state.dashboard.dashboardList?.employeeDetails ?? null,
  todayAttData: state.attendance.todayAttendanceData ?? null,
  zoneChambersData: state.attendance.zoneChambersData,
  employeeOfficeBranchesData: state.attendance.employeeOfficeBranchesData,
  employeeShift: state.attendance.employeeShift,
  todayDoubleDuty: state.attendance.todayDoubleDuty,
  todayDuty: state.attendance.todayDuty,
  attendancePolicy: state.attendance.attendancePolicy,
});
export default connect(MapStateToProps)(DDAttendanceDashboard);

const styles = StyleSheet.create({
  timeText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(14),
    color: COLORS.WHITE,
    marginHorizontal: SIZE.MS(20),
    textAlign: 'center',
  },
  ddBg: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  innerView: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_MEDIUM,
  },
  spacer: {flex: 1},
  attButtonsViewRow: {
    flexDirection: 'row',
    paddingVertical: SIZE.MVS(20),
    marginHorizontal: SIZE.MVS(10),
  },
});
