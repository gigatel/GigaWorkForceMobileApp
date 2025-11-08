/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons, InputField, RadioButton} from '@atoms';
import {BackHeader, CaptureChamberPicture} from '@molecules';
import {Screen} from '@organisms';
import Geolocation from '@react-native-community/geolocation';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE, STYLES} from '@res';
import {ChamberIssueListActionSheet} from '@sheets';
import {checkCameraPermission} from '@slices/permission.slice';
import {
  submitPatrollerTaskApi,
  updateChamberTaskListDistance,
  updateSubmitPatrollerTask,
} from '@slices/task.slice';
import {DataType, ScreenProps} from '@types';
import {Common, Location, Permissions, Preferences, Times} from '@utils';
import React, {FC, useEffect, useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {connect, useDispatch} from 'react-redux';

const RadioButtonRow = ({value, setValue, type}: any) => {
  return (
    <TouchableOpacity
      onPress={() => {
        setValue(type);
      }}
      style={styles.submitRadioButtonRow}>
      <RadioButton
        active={value === type}
        viewStyle={{}}
        onPress={() => {
          setValue(type);
        }}
      />
      <Text style={styles.submitRatioTitle}>
        {type === 'yes' ? 'Yes' : 'No'}
      </Text>
    </TouchableOpacity>
  );
};

const ImageTitleRowView = ({
  tint,
  icon,
  title,
  desc,
}: {
  tint: string;
  icon: number;
  title: string;
  desc?: string;
}) => {
  return (
    <View style={styles.imageTitleRowView}>
      <Image
        source={icon}
        style={[styles.imageTitleRowIcon, {tintColor: tint}]}
      />
      <Text style={styles.imageTitleRowTitle}>{title}</Text>
      {desc && <Text style={styles.imageTitleRowDesc}>{desc}</Text>}
    </View>
  );
};

//! ***************** Submit Patroller Task ***************

const PatrollerTask: FC<ScreenProps.SubmitPatrollerTask> = ({
  loading,
  navigation,
  route,
  taskData,
}) => {
  const dispatch = useDispatch<StoreDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [empID] = useState(route.params.empID);
  const [selectedChamber] = useState(route.params.selectedChamber);
  const [currentPosition, setCurrentPosition] = useState(
    route.params?.currentPosition,
  );
  const [distance, setDistance] = useState(
    route.params.selectedChamber?.distance,
  );
  console.log(
    'Submit Task Prev Distance::',
    route.params.selectedChamber?.distance,
  );
  const [isIssueFound, setIsIssueFound] = useState<'yes' | 'no' | ''>('');
  const [pic1, setPic1] = useState<DataType.ImagePickerResponse | null>(null);
  const [pic2, setPic2] = useState<DataType.ImagePickerResponse | null>(null);
  const [chamberIssue, setChamberIssue] = useState<null | DataType.IdName>(
    null,
  );
  const [remark, setRemark] = useState('');

  useEffect(() => {
    dispatch(checkCameraPermission());
    Permissions.requestPermission();
  }, [dispatch]);

  // Watch Position
  useEffect(() => {
    let watchId;

    if (watchId) {
      Geolocation.clearWatch(watchId);
    }
    watchId = Geolocation.watchPosition(
      res => {
        const coords = res.coords;
        Common.success('Watch Position Start in Submit', coords);
        setCurrentPosition(coords as DataType.Coords);
        const lat = coords?.latitude;
        const lng = coords?.longitude;
        const lastAdd = Preferences.getData(
          'LAST_GEO_ADDRESS',
        ) as DataType.GeoAddress;
        // Always update latest lat/lng
        const updatedAddress = {
          address: lastAdd?.address ?? '',
          lat,
          long: lng,
        };
        // Preferences.setData('LAST_GEO_ADDRESS', updatedAddress);
        if (selectedChamber) {
          const dis = Location.calculateDistance(
            parseFloat(selectedChamber.chamberLat),
            parseFloat(selectedChamber.chamberLong),
            lat,
            lng,
            'm',
          );
          setDistance(dis);
        }
      },
      err => {
        Common.error('❌ Error in Watch Position::', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        distanceFilter: 20,
        interval: 10000,
        fastestInterval: 10000,
      },
    );

    // Cleanup on screen blur
    return () => {
      if (watchId) {
        Common.error('Watch Position Cleared in Submit');
        Geolocation.clearWatch(watchId);
      }
    };
  }, [selectedChamber]);

  const saveOfflineTask = (params: any) => {
    Common.alert({
      title: 'Offline Task',
      msg: 'Task saved as offline, data will be sync to server when internet available.',
      onPress: () => navigation.goBack(),
    });
    const prevData = Preferences.getData('SUBMIT_TASK_DATA');
    console.log('prevData', prevData);
    if (prevData && prevData?.length > 0) {
      Preferences.setData('SUBMIT_TASK_DATA', [...prevData, ...params]);
    } else {
      Preferences.setData('SUBMIT_TASK_DATA', params);
    }
  };

  const callApi = async (id: string) => {
    dispatch(updateSubmitPatrollerTask({chamberId: id}));
    dispatch(
      updateChamberTaskListDistance({
        lat: currentPosition?.latitude,
        lng: currentPosition?.longitude,
      }),
    );
  };
  const checkValidation = async () => {
    // guard double taps during async submit
    if (isLoading) return;

    if (!pic1) {
      Common.alert({title: 'Alert', msg: 'Please add first image of Chamber!'});
      return; // <- stop here
    }
    if (!pic2) {
      Common.alert({
        title: 'Alert',
        msg: 'Please add second image of Chamber!',
      });
      return; // <- stop here
    }
    if (isIssueFound === '') {
      Common.alert({title: 'Alert', msg: 'Please select issue found or not!'});
      return; // <- stop here
    }
    if (isIssueFound === 'yes' && !chamberIssue) {
      Common.alert({
        title: 'Alert',
        msg: 'You have selected yes on chamber issue found but not selected any issue from the given list.',
      });
      return; // <- stop here
    }

    if (!selectedChamber) {
      Common.showToast('No Chamber Data Found!');
      return;
    }

    // ---------- STRICT 100 m GEOFENCE CHECK ----------
    // prefer live `distance` from state; if missing/NaN, compute a fresh one
    let dist = Number(distance);
    if (!Number.isFinite(dist)) {
      const lat = currentPosition?.latitude ?? 0;
      const lng = currentPosition?.longitude ?? 0;
      const cLat = parseFloat(String(selectedChamber?.chamberLat ?? '0'));
      const cLng = parseFloat(String(selectedChamber?.chamberLong ?? '0'));
      dist = Location.calculateDistance(cLat, cLng, lat, lng, 'm');
      setDistance(dist); // cache for UI
    }
    if (Number.isFinite(dist) && dist > 100) {
      console.log('dist11', dist);
      Common.alert({
        title: 'Not in Range',
        msg:
          `You are not within 100 metre radius. (${dist.toFixed(1)} m)\n\n` +
          'चेंबर का लेट/लॉन्ग अपडेट करवाएं। \nआप 100 मीटर के दायरे में नहीं हैं।',
      });
      return; // ✅ DO NOT CONTINUE WHEN OUT OF RANGE
    }
    // ---------------------------------------------------

    try {
      setIsLoading(true);

      let currentAddress = await Location.getAddressWithLatLong(
        currentPosition?.latitude ?? 0,
        currentPosition?.longitude ?? 0,
      );
      if (!currentAddress?.address) {
        currentAddress = Preferences.getData('LAST_GEO_ADDRESS');
      }
      // Preferences.setData('LAST_GEO_ADDRESS', currentAddress);

      // chamberAddress is already present in selectedChamber per your comment
      let chamberAddress = selectedChamber.chamberAddress;

      const markdate = Common.getFormatedDate('YYYY-MM-DD');
      const markTime = Times.getFormatedTime('HH:mm:ss');

      const params = [
        {
          reportingImage: [
            {
              imageUrl: pic1?.data ?? '',
              imageExtention: pic1?.filename?.split('.').pop() ?? 'png',
            },
            {
              imageUrl: pic2?.data ?? '',
              imageExtention: pic2?.filename?.split('.').pop() ?? 'png',
            },
          ],
          remarks: '',
          alerts: [{alert_id: 0, group_id: 0, is_alert: false}],
          gigatelOldNearestChamberID: selectedChamber.chamberId,
          isSubmitWithAlert: false,
          isChamberComplaint: false,
          lat: `${currentPosition?.latitude}`,
          lon: `${currentPosition?.longitude}`,
          chamberLat: selectedChamber?.chamberLat,
          chamberLon: selectedChamber?.chamberLong,
          gpsAddress: currentAddress?.address ?? '',
          chamberGPSAddress: chamberAddress,
          priority: '2', // 1 Critical , 2 High, 3 Medium
          taskType: '',
          taskId: taskData?.taskId ?? 0,
          isOffline: true, // For Offline
          companyCode: 'gtpl',
          createdOn: `${markdate}T${markTime}`,
          employeeId: empID,
          status: '1',
          updateStatusAlso: true,
          isIssueExist: isIssueFound === 'yes',
          issueTypId: chamberIssue?.id ?? 0,
          issueRemark: remark,
        },
      ];

      const res = await dispatch(submitPatrollerTaskApi(params));
      if (res.payload.status === 200 && res.payload.success) {
        callApi(selectedChamber.chamberId);
        Common.alert({
          title: 'Success',
          msg: 'Task Submitted Successfully!',
          onPress: () => navigation.goBack(),
        });
      } else if (res.payload.status === 202 && !res.payload.success) {
        saveOfflineTask(params);
        callApi(selectedChamber.chamberId);
      } else if (res?.payload?.status !== 200 && !res.payload?.success) {
        saveOfflineTask(params);
        callApi(selectedChamber.chamberId);
      }
    } catch (error) {
      Common.error('Submit Task failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  // console.log(taskData);
  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'scroll'}
      statusBarStyle={'light'}
      loading={loading || isLoading}
      // loaderMessage={''}
      fixedComponent={
        <BackHeader
          headerTitle={'Submit Task'}
          onBackPress={() => navigation.goBack()}
        />
      }
      fixedBottomComponent={
        <Buttons
          type={'primary'}
          title={'Submit'}
          onPress={() => checkValidation()}
          viewStyle={styles.submitButton}
        />
      }>
      <View style={styles.container}>
        <Text style={styles.chamberNameText}>{'Chamber'}</Text>
        <Text style={styles.submitTaskChmaberNameText}>{`${
          selectedChamber?.chamberIdStr ?? ''
        } - ${selectedChamber?.chamberName ?? ''}`}</Text>
        <Text style={styles.chamberNameText}>{'Chamber Pictures'}</Text>
        <View style={styles.submitTaskPicRow}>
          <CaptureChamberPicture
            title={'PIC 1'}
            pic={pic1}
            setPic={(e: any) => setPic1(e)}
            lat={currentPosition?.latitude ?? 0}
            long={currentPosition?.longitude ?? 0}
          />
          <CaptureChamberPicture
            title={'PIC 2'}
            pic={pic2}
            setPic={(e: any) => setPic2(e)}
            lat={currentPosition?.latitude ?? 0}
            long={currentPosition?.longitude ?? 0}
          />
        </View>

        <View style={styles.infoShadowView}>
          <ImageTitleRowView
            tint={COLORS.PRIMARY}
            title={'अभी चैम्बर से आपकी दूरी है:'}
            icon={IMAGES.mapLocation}
            desc={` ${(distance ?? 0).toFixed(1)}m`}
          />
          {distance && distance > 100 && (
            <ImageTitleRowView
              tint={COLORS.PRIMARY}
              title={
                'चेंबर का स्थान अपडेट करवाएं । आप 100 मीटर के दायरे में नहीं है।'
              }
              icon={IMAGES.warning}
            />
          )}
        </View>
        <Text style={[styles.chamberNameText, {marginVertical: SIZE.MVS(20)}]}>
          {'Chamber Issue Found'}
        </Text>
        <View style={styles.submitRadioViewContainer}>
          <RadioButtonRow
            value={isIssueFound}
            setValue={setIsIssueFound}
            type={'yes'}
          />
          <RadioButtonRow
            value={isIssueFound}
            setValue={setIsIssueFound}
            type={'no'}
          />
        </View>
        {isIssueFound === 'yes' && (
          <>
            <ChamberIssueListActionSheet
              value={chamberIssue}
              setValue={setChamberIssue}
            />
            <InputField
              title={'Remark'}
              value={remark}
              placeholder={'Add issue remark'}
              onChangeText={txt => setRemark(txt)}
              viewStyle={styles.remarkView}
              multiline={true}
              numberOfLines={3}
              inputStyle={{height: SIZE.MVS(45)}}
            />
          </>
        )}
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.task.submitTaskLoading === 'pending',
  taskData: state.task.taskListData,
});
export default connect(MapStateToProps)(PatrollerTask);

const styles = StyleSheet.create({
  infoShadowView: {
    backgroundColor: COLORS.WHITE,
    marginTop: SIZE.MVS(15),
    padding: SIZE.MS(10),
    borderRadius: SIZE.MS(6),
    ...STYLES.SHADOW_BLACK_6,
  },
  submitButton: {
    marginHorizontal: SIZE.MS(25),
    marginBottom: SIZE.MVS(15),
  },
  remarkView: {marginHorizontal: 0},
  submitRadioViewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitRatioTitle: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_DARKER,
    marginLeft: SIZE.MS(10),
  },
  submitRadioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZE.MS(20),
  },
  submitTaskPicRow: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    marginTop: SIZE.MVS(10),
    padding: SIZE.MS(10),
    paddingBottom: SIZE.MVS(20),
    flexDirection: 'row',
    ...STYLES.SHADOW_BLACK_6,
  },
  submitTaskChmaberNameText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_DARKER,
    marginTop: SIZE.MVS(5),
    marginBottom: SIZE.MVS(10),
  },
  topOverlayCheckedRowView: {flexDirection: 'row'},
  imageTitleRowIcon: {
    height: SIZE.MS(20),
    width: SIZE.MS(20),
  },
  imageTitleRowTitle: {
    marginLeft: SIZE.MS(5),
    marginRight: SIZE.MS(10),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
    fontSize: SIZE.MS(14),
  },
  imageTitleRowDesc: {
    marginLeft: SIZE.MS(5),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.ACCENT_ORANGE,
    fontSize: SIZE.MS(14),
  },
  imageTitleRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZE.MS(15),
  },
  chamberNameText: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY_DARK,
    marginVertical: SIZE.MS(2),
  },
  container: {
    flex: 1,
    padding: SIZE.MS(15),
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
});
