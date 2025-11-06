/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕖𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {APIs} from '@apis';
import {DropdownInput} from '@atoms';
import {BackHeader, OptionPickerSheet, UserNameDesigRow} from '@molecules';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, CONSTANT, FONTS, IMAGES, SIZE, STYLES} from '@res';
import {markAttendanceApi} from '@slices/attendance.slice';
import {checkCameraPermission} from '@slices/permission.slice';
import {DataType, ScreenProps} from '@types';
import {Common, Location, Preferences, Times, Voice} from '@utils';
import React, {FC, useEffect, useMemo, useRef, useState} from 'react';
import {Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import DeviceInfo from 'react-native-device-info';
import {connect, useDispatch} from 'react-redux';
import {IconTitleRow} from '../components/icon-title-row';
import {MarkInOutButton} from '../components/mark-inout-button';
import {clearChamberTaskData} from '@slices/task.slice';
import {log} from 'src/utils/common';
const TimeText = ({title, value}: {title: string; value: string}) => {
  return (
    <View style={styles.timeTextView}>
      <Text style={styles.inTimeText}>{title}</Text>
      <Text style={styles.timeText}>{value}</Text>
    </View>
  );
};
//!============== AttendanceInOut //!==============
const AttendanceInOut: FC<ScreenProps.AttendanceInOut> = ({
  loading, // redux-wide loading (kept but no longer drives the spinner)
  route,
  navigation,
  todayAttData: tad,
  todayDoubleDuty: tdd,
  empData,
  todayWorkingOnBehalfData,
  allowedShifts,
}) => {
  const {from: comeFrom, shiftType} = route.params;
  const [behalfOfData, setBehalfOfData] =
    useState<DataType.TodayBehalfOf | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [prevAttData, setPrevAttData] = useState<
    DataType.MarkAttendanceRequest[] | null
  >([]);
  const [isLoading, setisLoading] = useState<boolean>(false); // address/camera init
  const [submitting, setSubmitting] = useState<boolean>(false); // CHANGE: local submit loader
  const submitLockRef = useRef(false); // CHANGE: double-tap guard

  const [address, setAddress] = useState<DataType.GeoAddress | null>(null);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const dispatch = useDispatch<StoreDispatch>();
  const cameraRef = useRef<any>(null);
  //! Get Current Address
  const getAddressLocation = async () => {
    setDate(Common.formatDate(new Date(), 'DD-MM-YYYY'));
    setTime(Common.formatDate(new Date(), 'HH:mm'));
    setisLoading(true);
    try {
      const data = await Location.getAddressFromLatLong();
      Common.log('Address:::', data);
      setAddress(data);
      Preferences.setData('LAST_GEO_ADDRESS', data); // CHANGE: ensure fallback always exists
    } catch (e) {
      Common.error('Address fetch failed', e);
    } finally {
      setisLoading(false);
    }
  };
  useEffect(() => {
    setPrevAttData(Preferences.getData('OFFLINE_ATTENDANCE') ?? null);
    getAddressLocation();
    dispatch(checkCameraPermission());
    Voice.speak(CONSTANT.MARK_IN_FACE_MESSAGE);
  }, [dispatch]);
  const captureImage = async () => {
    try {
      const image = await cameraRef.current?.capture();
      const base64Image = await Common.convertImageToBase64(image.uri);
      if (base64Image) {
        Common.log('Base64 Image', base64Image?.slice(0, 64) + '...');
        return {
          ...image,
          base64: base64Image,
        };
      }
    } catch (error) {
      Common.error('Error capturing image:', error);
    }
    return null;
  };
  const confirmMarkOut = () => {
    Common.yesNoAlert(
      'Alert',
      'Are you sure you want to mark out ? \n\n क्या आप वाकई मार्क आउट करना चाहते हैं?',
      () => {
        callMarkInOutApi();
      },
    );
  };

  const callMarkInOutApi = async () => {
    // CHANGE: double-tap guard
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const faceImageBase64 = await captureImage();
      const deviceName = await DeviceInfo.getDeviceName();
      const deviceSerial = await DeviceInfo.getUniqueId();

      if (!faceImageBase64) {
        Common.showToast('Unable to capture image. Please try again.');
        return;
      }

      const lastaddress = address ?? Preferences.getData('LAST_GEO_ADDRESS'); // CHANGE
      const params = {
        imageData: faceImageBase64?.base64 ?? '',
        punchMode: 'Mobile Device',
        deviceName: Platform.OS + ' : ' + deviceName,
        deviceSerial: deviceSerial,
        direction: comeFrom,
        imageExtention: faceImageBase64?.uri?.split('.').pop() ?? 'png',
        location: lastaddress?.address,
        lat: `${lastaddress?.lat}`,
        lon: `${lastaddress?.long}`,
        gpsAddress: lastaddress?.address,
        behalfOf:
          shiftType === 'double'
            ? tdd?.empId !== 0
              ? tdd?.empId
              : behalfOfData != null
              ? behalfOfData?.id
              : 0
            : 0,
        nextShiftId: empData?.nextShiftId ?? 0,
        nextZoneId: empData?.nextZoneId ?? 0,
      };
      console.log('paramsDatacallMarkaOutApi', params);
      const isNet = await APIs.checkNetworkBeforeRequest();

      if (isNet) {
        // CHANGE: await and always end spinner
        try {
          // If you use RTK, prefer unwrap()
          await dispatch<any>(markAttendanceApi(params));
        } catch (err) {
          Common.error('markAttendanceApi failed', err);
          Common.alert({
            title: 'Failed',
            msg: 'Unable to mark attendance right now. Please try again.',
          });
        }
      } else {
        const isWithin5Minute =
          shiftType === 'double'
            ? Times.isBefore5Minute(tdd?.date + ' ' + tdd?.inTime)
            : Times.isBefore5Minute(tad?.date + ' ' + tad?.inTimeStr);
        if (isWithin5Minute) {
          const msg = 'आप लॉगिन के 5 मिनट बाद ही लॉग आउट कर सकते हैं।';
          Common.alert({title: 'Alert', msg});
          Voice.speak(msg);
          return;
        }

        const fallbackAddr = Preferences.getData('LAST_GEO_ADDRESS');
        setAddress(fallbackAddr);
        const markdate = Common.getFormatedDate('YYYY-MM-DD');
        const markTime = Times.getFormatedTime('HH:mm:ss');

        const offParams = {
          params: {
            ...params,
            location: fallbackAddr?.address,
            lat: `${fallbackAddr?.lat}`,
            lon: `${fallbackAddr?.long}`,
            gpsAddress: fallbackAddr?.address,
            punchTime: `${markdate}T${markTime}`,
            direction: comeFrom,
          },
          date: markdate,
          time: markTime,
          direction: comeFrom,
          shiftType,
          behalfName: behalfOfData?.name,
          employeeCode: behalfOfData?.employeeCode,
        };
        if (comeFrom === 'in') {
          dispatch(clearChamberTaskData());
        }
        if (prevAttData) {
          Preferences.setData('OFFLINE_ATTENDANCE', [
            ...prevAttData,
            offParams,
          ]);
        } else {
          Preferences.setData('OFFLINE_ATTENDANCE', [offParams]);
        }

        Common.alert({
          title: 'Message',
          msg: `MARK STATUS: ${comeFrom.toUpperCase()}\n\nAttendance has been saved offline successfully. Once get proper connectivity it will be submitted to server.`,
          onPress: () => {
            navigation.goBack();
          },
        });
      }
    } finally {
      // CHANGE: always release loader/lock
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  //! Mark In Press
  const onMarkInOutPress = (from: 'in' | 'out') => {
    if (submitLockRef.current) return; // CHANGE: extra guard
    if (shiftType === 'single') {
      if (from === 'in') {
        callMarkInOutApi();
      } else {
        confirmMarkOut();
      }
    } else {
      if (from === 'in') {
        markInDD();
      } else {
        confirmMarkOut();
      }
    }
  };
  const markInDD = () => {
    if (behalfOfData === null) {
      Common.alert({
        title: 'Alert',
        msg: 'Please Select Behalf of Patroller! \n\n जिस पेट्रोलर कि लिए अपको ड्यूटी करना है उसे सेलेक्ट करें।',
      });
      return;
    }
    if (!allowedShifts || allowedShifts.length === 0) {
      Common.alert({
        title: 'Not Shift Allowed',
        msg: 'आपके पास कोई भी डबल ड्यूटी शिफ्ट नहीं है।',
      });
      return;
    }
    const fsTime = allowedShifts?.[0]?.shiftStartTime;
    const feTime = allowedShifts?.[0]?.shiftEndTime;
    const ssTime = allowedShifts?.[1]?.shiftStartTime ?? null;
    const seTime = allowedShifts?.[1]?.shiftEndTime ?? null;
    // Check If Try to Mark in Before 2 Hour of Shift Time
    if (
      Times.canLoginBefore2Hours(fsTime ?? '') ||
      Times.canLoginBefore2Hours(ssTime ?? '')
    ) {
      if (tad?.isShiftTimingRestrictions) {
        callMarkInOutApi();
      } else {
        const msg =
          'अभी आपकी शिफ्ट का टाइम शुरू नहीं हुआ है आप अपनी शिफ्ट के टाइम से 2 घंटे पहले पंच इन कर सकते हैं';
        Common.alert({
          title: 'Not in Shift Time',
          msg,
          onPress() {
            navigation.goBack();
          },
        });
        Voice.speak(msg);
      }
      return;
    }

    // Within Shift Time
    if (
      Times.isWithinShiftTime(fsTime, feTime) ||
      Times.isWithinShiftTime(ssTime, seTime)
    ) {
      if (
        Times.isSelectedShiftSameAsAllowedShift(
          {
            shiftStartTime: behalfOfData?.shiftStartTime,
            shiftEndTime: behalfOfData?.shiftEndTime,
          },
          {shiftStartTime: fsTime, shiftEndTime: feTime},
        ) ||
        Times.isSelectedShiftSameAsAllowedShift(
          {
            shiftStartTime: behalfOfData?.shiftStartTime,
            shiftEndTime: behalfOfData?.shiftEndTime,
          },
          {shiftStartTime: ssTime, shiftEndTime: seTime},
        )
      ) {
        callMarkInOutApi();
      } else {
        Common.alert({
          title: 'Shift Not Same',
          msg: 'आपने जो पेट्रोलर सेलेक्ट किया है आप उसकी डबल ड्यूटी नहीं कर सकते है।',
        });
      }
    } else {
      const secondShift =
        allowedShifts?.length >= 2 ? allowedShifts?.[1]?.shiftTime : '';
      const msg = `Allowed Shift Time: \n${allowedShifts?.[0]?.shiftTime} \n${secondShift}\n\nअभी आपकी शिफ्ट का टाइम नहीं हुआ है।`;
      Common.alert({title: 'Not in Shift Time', msg});
      Voice.speak(msg);
    }
  };

  let offlineIn = null;
  let offlineOut = null;
  let offlineInDD = null;
  let offlineOutDD = null;

  if (
    prevAttData !== null &&
    prevAttData?.length > 0 &&
    shiftType === 'single'
  ) {
    offlineIn =
      prevAttData?.find(
        (item: any) => item.direction === 'in' && item.shiftType === 'single',
      ) ?? null;
    offlineOut =
      prevAttData?.find(
        (item: any) => item.direction === 'out' && item.shiftType === 'single',
      ) ?? null;
  } else if (
    prevAttData !== null &&
    prevAttData?.length > 0 &&
    shiftType === 'double'
  ) {
    offlineInDD =
      prevAttData?.find(
        (item: any) => item.direction === 'in' && item.shiftType === 'double',
      ) ?? null;
    offlineOutDD =
      prevAttData?.find(
        (item: any) => item.direction === 'out' && item.shiftType === 'double',
      ) ?? null;
  }

  const inTimeText = useMemo(() => {
    return shiftType === 'double'
      ? {
          title: `In Time (${offlineIn !== null ? 'Offline' : 'Online'})`,
          value:
            offlineInDD !== null
              ? `${offlineInDD?.date ?? ''} ${offlineInDD?.time ?? ''}`
              : tdd?.inTime ?? '',
        }
      : {
          title: `In Time (${offlineIn !== null ? 'Offline' : 'Online'})`,
          value:
            offlineIn !== null
              ? `${offlineIn?.date ?? ''} ${offlineIn?.time ?? ''}`
              : tad?.inTimeStr ?? '',
        };
  }, [offlineIn, offlineInDD, shiftType, tad?.inTimeStr, tdd?.inTime]);

  const outTimeText = useMemo(() => {
    return shiftType === 'double'
      ? {
          title: `Out Time (${offlineOutDD !== null ? 'Offline' : 'Online'})`,
          value:
            offlineOutDD !== null
              ? `${offlineOutDD?.date ?? ''} ${offlineOutDD?.time ?? ''}`
              : tdd?.outTime ?? '',
        }
      : {
          title: `Out Time (${offlineOut !== null ? 'Offline' : 'Online'})`,
          value:
            offlineOut !== null
              ? `${offlineOut?.date ?? ''} ${offlineOut?.time ?? ''}`
              : tad?.outTimeStr ?? '',
        };
  }, [offlineOut, offlineOutDD, shiftType, tad?.outTimeStr, tdd?.outTime]);

  const behalfName = useMemo(() => {
    console.log('behalfName', {behalfOfData});

    return (
      offlineInDD?.behalfName ?? tdd?.empName ?? behalfOfData?.name ?? null
    );
  }, [behalfOfData?.name, offlineInDD?.behalfName, tdd?.empName]);

  const behalfOfDataValue = useMemo(() => {
    Common.log('behalfOfDataValue', {todayWorkingOnBehalfData});
    if (offlineInDD !== null) {
      const dd = todayWorkingOnBehalfData?.find(
        (item: any) => item?.employeeCode === offlineInDD?.employeeCode,
      );
      return dd;
    } else {
      return behalfOfData;
    }
  }, [behalfOfData, offlineInDD, todayWorkingOnBehalfData]);

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'fixed'}
      loading={isLoading || submitting} // CHANGE: only local loaders control the spinner
    >
      <BackHeader
        headerTitle={
          shiftType === 'double' ? 'Mark Double Duty' : 'Mark Attendance'
        }
        onBackPress={() => {
          if (comeFrom === 'in' && !tad?.inTimeStr && !offlineIn?.time) {
            Common.yesNoAlert(
              'Alert',
              'आपने अभी तक पंच इन नहीं किया है। क्या आप पंच इन करना चाहते हैं',
              () => {},
              () => {
                navigation.goBack();
              },
            );
            return;
          }
          navigation.goBack();
        }}
      />
      <ScrollView bounces={false}>
        <UserNameDesigRow
          name={(empData?.firstName ?? '') + ' ' + (empData?.lastName ?? '')}
          designation={empData?.designationName ?? ''}
        />
        <View style={styles.cameraContainer}>
          <View style={styles.outerCameraView}>
            <Camera
              ref={cameraRef}
              cameraType={CameraType.Front}
              flashMode="auto"
              style={styles.cameraStyle}
              resizeMode={'contain'}
              maxPhotoQualityPrioritization={'balanced'}
              shutterPhotoSound={true}
            />
          </View>
        </View>
        <IconTitleRow icon={IMAGES.calendarClock} title={`${date} ${time}`} />
        <IconTitleRow
          icon={IMAGES.location}
          title={address?.address ?? 'Fetching Address...'}
        />
        {shiftType === 'single' && (
          <IconTitleRow icon={IMAGES.shift} title={empData?.shiftTime ?? ''} />
        )}

        {shiftType === 'double' && (
          <View style={styles.ddView}>
            {behalfName != null && (
              <Text style={styles.timeText}>
                {`आप अभी डबल ड्यूटी पर है आप अभी ${
                  behalfName ?? ''
                } की ड्यूटी कर रहे है।`}
              </Text>
            )}
            <DropdownInput
              disabled={
                behalfName != null &&
                (tdd?.inTime != null || offlineInDD?.time != null)
              }
              value={
                behalfName ?? behalfOfDataValue?.name ?? 'Select Patroller'
              }
              placeholder={'Select Patroller'}
              onPress={() => {
                setShowPicker(true);
              }}
            />
          </View>
        )}
        <Text style={styles.clearFaceText}>
          {CONSTANT.MARK_IN_FACE_MESSAGE}
        </Text>

        <View style={styles.devider} />

        <View style={styles.timeOuterView}>
          <TimeText title={inTimeText.title} value={inTimeText.value} />
          <TimeText title={outTimeText.title} value={outTimeText.value} />
        </View>

        <View style={styles.spacer} />
        {shiftType === 'single' && tad?.isMarkIn && (
          <Text style={styles.attRegText}>
            {`Attendance Mark-In has been registered (${Times.getTimeAgo(
              tad?.inTimeStr ?? '',
            )}ago)\nमार्क इन उपस्थिति दर्ज कर ली गई (${Times.getTimeAgo(
              tad?.inTimeStr ?? '',
            )}पहले)`}
          </Text>
        )}
        {shiftType === 'double' && tdd?.inTime && (
          <Text style={styles.attRegText}>
            {`Attendance Mark-In has been registered (${Times.getTimeAgo(
              tdd?.inTime ?? '',
            )}ago)\nमार्क इन उपस्थिति दर्ज कर ली गई (${Times.getTimeAgo(
              tdd?.inTime ?? '',
            )}पहले)`}
          </Text>
        )}
      </ScrollView>
      <>
        {shiftType === 'double' ? (
          <View style={styles.attButtonsViewRow}>
            {!offlineInDD?.time && !tdd?.inTime && (
              <MarkInOutButton
                title={'Start Double Duty'}
                shift={'double'}
                type={'in'}
                time={''}
                disabled={submitting} // CHANGE: disable while submitting
                onPress={() => onMarkInOutPress('in')}
              />
            )}

            {!offlineOutDD?.time &&
              tdd?.inTime !== null &&
              tdd?.outTime === null && (
                <MarkInOutButton
                  title={'End Double Duty'}
                  shift={'double'}
                  type={'out'}
                  time={''}
                  disabled={submitting} // CHANGE
                  onPress={() => onMarkInOutPress('out')}
                />
              )}
          </View>
        ) : (
          <View style={styles.attButtonsViewRow}>
            {!offlineIn?.time && !tad?.inTime && (
              <MarkInOutButton
                shift={'single'}
                type={'in'}
                time={''}
                disabled={submitting} // CHANGE
                onPress={() => onMarkInOutPress('in')}
              />
            )}

            {!offlineOut?.time &&
              tad?.inTimeStr !== null &&
              tad?.outTimeStr === null && (
                <MarkInOutButton
                  shift={'single'}
                  type={'out'}
                  time={''}
                  disabled={submitting} // CHANGE
                  onPress={() => onMarkInOutPress('out')}
                />
              )}
          </View>
        )}
      </>
      <OptionPickerSheet
        rowType={'behalfOf'}
        show={showPicker}
        value={behalfOfData !== null ? [behalfOfData] : behalfOfData}
        type={'single'}
        title={'Select Patroller'}
        data={todayWorkingOnBehalfData ?? []}
        rowUniqueKey={'id'}
        searchKeys={['name', 'employeeCode']}
        onClose={() => {
          setShowPicker(false);
        }}
        onDone={item => {
          Common.log('Select::', item);
          setBehalfOfData(item?.[0]);
          setShowPicker(false);
        }}
      />
    </Screen>
  );
};

const MapStateToProps = (state: RootState) => ({
  loading: state.attendance.markAttLoading === 'pending', // kept for compatibility
  todayAttData: state.attendance.todayAttendanceData ?? null,
  empData: state.dashboard.dashboardList?.employeeDetails ?? null,
  attData: state.dashboard.dashboardList?.attendance ?? null,
  todayDoubleDuty: state.attendance.todayDoubleDuty,
  todayWorkingOnBehalfData: state.attendance.todayWorkingOnBehalfData,
  allowedShifts: state.attendance.allowedShifts ?? [],
  chambers: state.attendance.zoneChambersData,
});
export default connect(MapStateToProps)(AttendanceInOut);
const styles = StyleSheet.create({
  ddView: {marginHorizontal: SIZE.MS(20)},
  devider: {
    height: SIZE.MVS(1),
    backgroundColor: COLORS.BORDER_DEFAULT,
    marginVertical: SIZE.MVS(10),
    marginHorizontal: SIZE.MS(20),
  },
  timeOuterView: {
    flexDirection: 'row',
    marginHorizontal: SIZE.MS(20),
    marginVertical: SIZE.MVS(10),
  },
  timeTextView: {flex: 1},
  timeText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(14),
    color: COLORS.SUCCESS,
    marginTop: SIZE.MVS(5),
  },
  attRegText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(14),
    color: COLORS.SUCCESS,
    marginTop: SIZE.MVS(5),
    marginHorizontal: SIZE.MS(20),
  },
  inTimeText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(14),
    color: COLORS.PRIMARY,
  },
  clearFaceText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(14),
    color: COLORS.ERROR,
    marginTop: SIZE.MVS(10),
    marginHorizontal: SIZE.MS(20),
  },
  spacer: {flex: 1},
  cameraContainer: {
    alignSelf: 'center',
    marginVertical: SIZE.MVS(20),
    ...STYLES.SHADOW_PRIMARY_3,
  },
  outerCameraView: {
    width: SIZE.MVS(150),
    borderRadius: SIZE.MS(6),
    height: SIZE.MVS(200),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  cameraStyle: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  attButtonsViewRow: {
    flexDirection: 'row',
    paddingVertical: SIZE.MVS(20),
    marginHorizontal: SIZE.MVS(10),
  },
  outerView: {marginVertical: SIZE.MVS(10)},
});
