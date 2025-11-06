/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {AttendanceCalendar} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {useFocusEffect} from '@react-navigation/native';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, IMAGES, SIZE} from '@res';
import {
  getEmpOfficeBranchesApi,
  getEmpZoneChambersApi,
  todayAttendanceApi,
  viewAttendanceApi,
} from '@slices/attendance.slice';
import {checkCameraPermission} from '@slices/permission.slice';
import {DataType, ScreenProps} from '@types';
import {Common, Location, Preferences, Times, Voice} from '@utils';
import React, {FC, useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {connect, useDispatch} from 'react-redux';
import {CardButton} from '../components/card-button-view';
import {MarkInOutButton} from '../components/mark-inout-button';
import {log} from './../../../utils/common';

let isFocused = false;

const AttendanceDashboard: FC<ScreenProps.AttendanceDashboard> = ({
  route,
  navigation,
  // NOTE: do not destructure `loading` here; we manage a local blocking loader instead
  calenderAttData,
  empData,
  todayAttData: tad,
  todayDoubleDuty: tdd,
  todayDuty,
  employeeShift,
}) => {
  const {isViewAllow, isMarkAllow} = route.params;
  const [isDoubleDuty] = useState(false);

  // Local, screen-level loader that only blocks during the main calendar fetch
  const [blockingLoad, setBlockingLoad] = useState<boolean>(true);

  const [currMonth, setCurrMonth] = React.useState<number>(
    Common.getCurrentMonth(),
  );
  const dispatch = useDispatch<StoreDispatch>();
  const currentYear = useMemo(() => Common.getCurrentYear(), []);

  const getData = useCallback(
    async (month: number, year: number) => {
      setBlockingLoad(true);
      try {
        await dispatch(
          viewAttendanceApi({
            page: '1',
            size: '31',
            year,
            month,
            showAttPolicy: true,
            search: '',
          }),
        ).unwrap();
      } catch (e) {
        log?.('viewAttendanceApi error', e);
      } finally {
        setBlockingLoad(false);
      }
    },
    [dispatch],
  );

  const isMissPunch = useCallback(() => {
    return Common.isEqualIgnoreCase(todayDuty?.status ?? '', 'mp');
  }, [todayDuty?.status]);

  const checkAlreadyMarkedInOut = useCallback(() => {
    if (isFocused && tad?.isMarkIn && tad?.isMarkOut) {
      Common.alert({
        title: 'Already Marked In and Out',
        msg: `You have already Marked In at ${tad?.inTimeStr} and Marked Out at ${tad?.outTimeStr}\n\nआप पहले ही ${tad?.inTimeStr} पर मार्क इन और ${tad?.outTimeStr} पर मार्क आउट कर चुके है।`,
      });
      return true;
    }
    return false;
  }, [tad?.inTimeStr, tad?.isMarkIn, tad?.isMarkOut, tad?.outTimeStr]);

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
    Preferences.setData('LAST_GEO_ADDRESS', data);
  };

  // Today Attendance (background; does not block full screen)
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

  // Other background fetches (do not block full screen)
  useFocusEffect(
    useCallback(() => {
      dispatch(getEmpOfficeBranchesApi());
      dispatch(getEmpZoneChambersApi());
      dispatch(checkCameraPermission());
    }, [dispatch]),
  );

  useFocusEffect(
    useCallback(() => {
      checkAlreadyMarkedInOut();
    }, [checkAlreadyMarkedInOut]),
  );

  const goToMarkIn = () => {
    navigation.navigate('AttendanceInOut', {
      from: 'in',
      shiftType: 'single',
      behalfOfData: null,
    });
  };

  const goToMarkOut = () => {
    navigation.navigate('AttendanceInOut', {
      from: 'out',
      shiftType: 'single',
      behalfOfData: null,
    });
  };

  // --> MARK IN
  const onMarkInPress = () => {
    console.log('todayDoubleDuty:', {tad});
    // 1 Check If DD Not Mark Out
    if (Common.isEqualIgnoreCase(tdd?.status ?? '', 'pi')) {
      const msg =
        'आपने अभी तक डबल ड्यूटी से मार्क आउट नहीं किया है। पहले डबल ड्यूटी से मार्क आउट करें फिर अपना शिफ्ट ड्यूटी शुरू करें';
      Common.alert({
        title: 'Message',
        msg,
      });
      Voice.speak(msg);
    }
    // 2 Check Shift Time Restriction
    else if (
      !tad?.isShiftTimingRestrictions &&
      Times.isBefore(employeeShift?.shiftEndTime ?? '')
    ) {
      goToMarkIn();
    }
    // 3 Check If Try to Mark in Before 2 Hour of Shift Time
    else if (Times.canLoginBefore2Hours(employeeShift?.shiftStartTime ?? '')) {
      if (tad?.isShiftTimingRestrictions) {
        goToMarkIn();
      } else {
        const msg =
          'अभी आपकी शिफ्ट का टाइम शुरू नहीं हुआ है आप अपनी शिफ्ट के टाइम से 2 घंटे पहले पंच इन कर सकते हैं';
        Voice.speak(msg);
        Common.alert({
          title: 'Shift Time Not Started',
          msg: `Shift Time ${employeeShift?.shiftTime}\n\n ${msg}`,
          onPress() {
            navigation.goBack();
          },
        });
      }
    }
    // 5 Already Mark In-Out
    else if (tad?.inTime && tad.outTime) {
      const msg = `You have already Marked In at ${tad?.inTimeStr} and Marked Out at ${tad?.outTimeStr}\n\nआप पहले ही ${tad?.inTimeStr} पर मार्क इन और ${tad?.outTimeStr} पर मार्क आउट कर चुके है।`;
      Common.alert({
        title: 'Already Marked In and Out',
        msg,
      });
      Voice.speak(msg);
    }
    // 6 Already Mark In
    else if (tad?.inTime) {
      Common.alert({
        title: 'Already Marked In',
        msg: `You have already Marked In at ${
          tad?.inTimeStr ?? ''
        }\n\nआप पहले ही ${tad?.inTimeStr ?? ''} पर मार्क इन कर चुके है।`,
      });
      Voice.speak(`आप पहले ही ${tad?.inTimeStr ?? ''} पर मार्क इन कर चुके है।`);
    }
    // 4 Check Within Shift Time
    else if (
      Times.isWithinShiftTime(
        employeeShift?.shiftStartTime ?? '',
        employeeShift?.shiftEndTime ?? '',
      )
    ) {
      // 7 Not Mark In-Out
      if (!tad?.inTime && !tad?.outTime) {
        goToMarkIn();
      } else if (tad?.inTime) {
        Common.showToast('Something went wrong');
      }
    } else {
      const msg = 'अभी आपकी शिफ्ट का टाइम शुरू नहीं हुआ है।';
      Voice.speak(msg);
      Common.alert({
        title: 'Shift Time Not Started',
        msg: `Shift Date Time ${employeeShift?.shiftTime}\n\n ${msg}`,
        onPress() {
          navigation.goBack();
        },
      });
    }
  };

  // --> MARK OUT
  const onMarkOutPress = () => {
    // Miss Punch
    if (isMissPunch()) {
      const msgInHindi = 'आपने अपनी ड्यूटी का पंच आउट मिस कर दिया है|';
      const msgInEnglish = 'You have missed your punch out.';
      Common.alert({
        title: 'Missed Punch Out',
        msg: `${msgInEnglish}\n\n${msgInHindi}`,
      });
      Voice.speak(msgInHindi);
    }
    // Not Mark In
    else if (tad?.inTimeStr === null) {
      Common.alert({
        title: 'Mark In First',
        msg: 'Please mark in first\n\nपहले नीचे मार्क इन करें',
      });
    }
    // Already Mark Out
    else if (tad?.isMarkOut && tad?.markOutDisable) {
      console.log({tad});
      Common.alert({
        title: 'Already Marked Out',
        msg: `You have already Marked Out at ${
          tad?.inTimeStr ?? ''
        }\n\nआप पहले ही ${tad?.outTimeStr ?? ''} पर मार्क आउट कर चुके है।`,
      });
      Voice.speak(
        `आप पहले ही ${tad?.outTimeStr ?? ''} पर मार्क आउट कर चुके है।`,
      );
    } else if (todayDuty?.status?.toLocaleLowerCase() === 'pi') {
      goToMarkOut();
    } else if (
      todayDuty?.status?.toLocaleLowerCase() === 'pl' ||
      todayDuty?.status?.toLocaleLowerCase() === 'sl'
    ) {
      Common.alert({
        title: 'Alert',
        msg: 'Due to Leave Mark Out Not Allowed',
      });
    } else {
      Common.showToast('Something went wrong in mark-out. Please try again!');
    }
  };

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'scroll'}
      // KEY: only block during calendar fetch; background calls won't overlap UI
      loading={blockingLoad}
      navBarColor={
        isDoubleDuty ? COLORS.BACKGROUND_PINK : COLORS.BACKGROUND_DEFAULT
      }>
      <BackHeader
        headerTitle={'Attendance Dashboard'}
        onBackPress={() => {
          navigation.goBack();
        }}
      />
      <View style={[styles.innerView]}>
        <AttendanceCalendar
          isDoubleDuty={false}
          presentDates={calenderAttData ?? []}
          currMonth={currMonth}
          onMonthChange={(date: DataType.DateProps) => {
            setCurrMonth(date.month);
          }}
        />
        <View style={styles.spacer} />
        {isViewAllow && (
          <CardButton
            isDD={false}
            title={'View Attendance Report'}
            icon={IMAGES.viewAttendance}
            onPress={() => navigation.navigate('ViewAttendanceReport')}
          />
        )}
        {tad !== null && isMarkAllow && (
          <View style={styles.attButtonsViewRow}>
            <MarkInOutButton
              shift={'single'}
              type={'in'}
              time={tad?.inTimeStr ?? '-'}
              disabled={tad?.isMarkIn ?? true}
              onPress={onMarkInPress}
            />
            <MarkInOutButton
              shift={'single'}
              type={'out'}
              time={
                Common.isEqualIgnoreCase(todayDuty?.status ?? '', 'mp')
                  ? 'Miss Punch'
                  : tad?.outTimeStr ?? '-'
              }
              disabled={tad?.markOutDisable ?? true}
              onPress={onMarkOutPress}
            />
          </View>
        )}
      </View>
    </Screen>
  );
};

const MapStateToProps = (state: RootState) => ({
  // This aggregate loading is intentionally NOT passed to <Screen loading={...}>
  // to avoid overlapping loaders from background requests.
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

export default connect(MapStateToProps)(AttendanceDashboard);

const styles = StyleSheet.create({
  innerView: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  spacer: {flex: 1},
  attButtonsViewRow: {
    flexDirection: 'row',
    paddingVertical: SIZE.MVS(20),
    marginHorizontal: SIZE.MVS(10),
  },
});

// {
//   "location": "My Address ",
//   "punchMode": "Mobile Device",
//   "deviceName": "string",
//   "deviceSerial": "string",
//   "direction": "in | out",
//   "imageData": "Base 64 String",
//   "imageExtention": "image ext",
//   "lat": "latitude",
//   "lon": "longitude",
//   "gpsAddress": "my Address",
//   "behalfOf": 0 | "Emp ID",
//   "nextShiftId": 0 | "id Got Next Shift ID",
//   "nextZoneId": 0 | "id Got Next Zone ID",
// }
