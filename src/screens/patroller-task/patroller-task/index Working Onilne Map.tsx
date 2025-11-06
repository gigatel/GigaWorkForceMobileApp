/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons} from '@atoms';
import {GEO_CODING_API} from '@env';
import {AlertView, ModalSheet, OptionPickerSheet} from '@molecules';
import {Screen} from '@organisms';
import Geolocation from '@react-native-community/geolocation';
import {useFocusEffect} from '@react-navigation/native';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE, STYLES} from '@res';
import {checkCameraPermission} from '@slices/permission.slice';
import {
  getChamberIssueListApi,
  getPatrollerTaskAssinmentApi,
  updateChamberTaskListDistance,
  updateCompletedChamberStatus,
} from '@slices/task.slice';
import {DataType, ScreenProps} from '@types';
import {Common, Location, Permissions, Preferences} from '@utils';
import React, {FC, memo, useCallback, useEffect, useRef, useState} from 'react';
import {Image, Platform, StyleSheet, Text, View} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {connect, useDispatch} from 'react-redux';

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

const TopOverlayView = memo(
  ({
    taskName,
    chamberCount,
    successCount,
    taskCount,
    distance,
    name,
    onBack,
    offlineCount,
    showDetails,
    onDown,
    top,
    behalfName,
  }: any) => {
    return (
      <>
        <View
          style={[
            styles.topDetailsContainer,
            {top: Platform.OS === 'android' ? top + 15 : top},
          ]}>
          <View style={styles.backViewRow}>
            <Buttons
              type={'icon'}
              icon={IMAGES.back}
              iconStyle={styles.backIcon}
              viewStyle={styles.backButton}
              onPress={onBack}
            />
            <Text style={styles.taskHeadingText}>
              {'Details: ' + taskName}
              {behalfName && '\nBehalf on: ' + behalfName}
            </Text>
            <Buttons
              type={'icon'}
              icon={showDetails ? IMAGES.up : IMAGES.down}
              iconStyle={styles.backIcon}
              viewStyle={styles.downButton}
              onPress={onDown}
            />
          </View>
          <View style={styles.devider} />
          <Text style={styles.totalChamberTitle}>
            {'Total Chambers: ' + chamberCount}
          </Text>
          <View style={styles.topOverlayCheckedRowView}>
            <Text style={styles.taskText}>
              {'Checked:'}
              <Text style={styles.checkedText}>{` ${successCount}`}</Text>
            </Text>
            <Text style={styles.taskText}>
              {'Pending:'}
              <Text style={styles.pendingText}>{` ${taskCount}`}</Text>
            </Text>
            <Text style={styles.taskText}>
              {'Offline:'}
              <Text style={styles.offlineText}>{offlineCount}</Text>
            </Text>
          </View>
          {showDetails && (
            <>
              <View style={styles.devider} />
              <ImageTitleRowView
                tint={COLORS.PRIMARY}
                title={'Starting Point'}
                icon={IMAGES.mapLocation}
              />
              <ImageTitleRowView
                tint={COLORS.TEXT_LINK}
                title={'You are now'}
                icon={IMAGES.mapMyPostion}
                desc={`${distance}m away`}
              />
              <ImageTitleRowView
                tint={COLORS.SUCCESS}
                title={name}
                icon={IMAGES.mapChamber}
              />
            </>
          )}
        </View>
      </>
    );
  },
);

const FloatingButtonView = memo(
  ({
    onDirection,
    onCamera,
    onInfo,
    onTaskList,
    onRefresh,
    onMyPosition,
  }: any) => {
    return (
      <>
        <View style={styles.bottomButtonContainer}>
          <View style={styles.buttonViewRow}>
            <Buttons
              type={'icon'}
              icon={IMAGES.refresh}
              iconStyle={styles.buttonIcons}
              viewStyle={styles.directionButon}
              onPress={onRefresh}
            />
            <Buttons
              type={'icon'}
              icon={IMAGES.mapMyPostion}
              iconStyle={styles.buttonIcons}
              viewStyle={styles.directionButon}
              onPress={onMyPosition}
            />
          </View>
          <View style={styles.buttonViewRow}>
            <Buttons
              type={'icon'}
              icon={IMAGES.mapDirection}
              iconStyle={styles.buttonIcons}
              viewStyle={styles.directionButon}
              onPress={onDirection}
            />
            <Buttons
              type={'icon'}
              icon={IMAGES.camera}
              iconStyle={styles.buttonIcons}
              viewStyle={styles.directionButon}
              onPress={onCamera}
            />
          </View>
          <View style={styles.buttonViewRow}>
            <Buttons
              type={'icon'}
              icon={IMAGES.info}
              iconStyle={styles.buttonIcons}
              viewStyle={styles.directionButon}
              onPress={onInfo}
            />
            <Buttons
              type={'icon'}
              icon={IMAGES.taskList}
              iconStyle={styles.buttonIcons}
              viewStyle={styles.directionButon}
              onPress={onTaskList}
            />
          </View>
        </View>
      </>
    );
  },
);

const InfoModalSheet = memo(
  ({data, distance, show, position, onClose}: any) => {
    return (
      <ModalSheet
        title={'Distance Calculated'}
        show={show}
        onClose={onClose}
        onClosePress={onClose}>
        <View>
          <Text style={styles.chamberNameText}>
            {`${data?.chamberIdStr ?? ''} - ${data?.chamberName ?? ''}`}
          </Text>
          <View style={styles.latLongViewRow}>
            <View style={styles.latlongView}>
              <Text style={styles.latLongTextTitle}>{'Current Latitude'}</Text>
              <Text
                style={styles.latLongTextValue}>{`${position?.latitude?.toFixed(
                6,
              )}`}</Text>
            </View>
            <View style={styles.latlongView}>
              <Text style={styles.latLongTextTitle}>{'Current Longitude'}</Text>
              <Text
                style={
                  styles.latLongTextValue
                }>{`${position?.longitude?.toFixed(6)}`}</Text>
            </View>
          </View>
          <Text style={styles.distanceText}>
            {'Distance:'}
            <Text style={styles.awayText}>{` ${distance?.toFixed(2)}m`}</Text>
            {' away'}
          </Text>
          <Text style={styles.noteTextGreen}>
            {
              'कुछ मामलों में सामान्यतः लगभग 10 से 20 मीटर की दूरी का अंतर देखा जा सकता है। दूरी में अधिक अंतर होने पर कृपया 10 सेकंड प्रतीक्षा करें ताकि नवीनतम स्थान प्राप्त किया जा सके। '
            }
          </Text>
          <Text style={styles.noteTextRed}>
            {
              'कृपया स्क्रीनशॉट भेजें यदि दूरी 100 मीटर से ज़्यादा दिख रही है और आप ठीक चैम्बर पर खड़े हैं'
            }
          </Text>
        </View>
      </ModalSheet>
    );
  },
);

const TaskModalSheet = memo(({value, data, show, onClose, onDone}: any) => {
  return (
    <OptionPickerSheet
      rowType={'chamber'}
      show={show}
      value={value != null ? [value] : value}
      type={'single'}
      title={`Chambers (${data?.length ?? 0})`}
      data={data}
      rowUniqueKey={'chamberIdStr'}
      enableSearch={false}
      onClose={onClose}
      onDone={onDone}
    />
  );
});

const PositionMarker = memo(({pos}: any) => {
  return (
    <Marker
      title={'Starting Point'}
      description={''}
      coordinate={{
        latitude: pos?.latitude ?? 0,
        longitude: pos?.longitude ?? 0,
      }}>
      <Image
        source={IMAGES.mapLocation}
        resizeMode={'contain'}
        tintColor={COLORS.PRIMARY}
        style={{
          height: SIZE.MS(35),
          width: SIZE.MS(35),
        }}
      />
    </Marker>
  );
});

const ChamberMarker = memo(
  ({
    chamberIdStr,
    distance,
    chamberName,
    lat,
    long,
    tintColor,
    onSelect,
  }: any) => {
    return (
      <Marker
        title={`${chamberIdStr} (${distance}m)`}
        description={`${chamberName}`}
        coordinate={{
          latitude: parseFloat(lat),
          longitude: parseFloat(long),
        }}
        onPress={onSelect}
        onSelect={onSelect}
        anchor={{x: 0.5, y: 1}} // x: center, y: bottom
      >
        <Image
          source={IMAGES.mapChamber}
          resizeMode={'contain'}
          tintColor={tintColor ?? COLORS.SUCCESS}
          style={{
            height: SIZE.MS(35),
            width: SIZE.MS(35),
          }}
        />
      </Marker>
    );
  },
);

let top = 0;
let isFocused = false;
//! ***************** Patroller Task ***************
const PatrollerTask: FC<ScreenProps.PatrollerTask> = ({
  loading,
  navigation,
  taskData,
  empData,
  isAllTaskSubmitted,
  tdd,
}) => {
  top = useSafeAreaInsets().top;

  const dispatch = useDispatch<StoreDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [isPositionFailed, setIsPositionFailed] = useState(false);
  const [empID, setEmpId] = useState(0);
  const [distance, setDistance] = useState(0);
  const [selectedChamber, setSelectedChamber] =
    useState<DataType.Chamber | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showTaskListSheet, setShowTaskListSheet] = useState(false);
  const [currentPosition, setCurrentPosition] =
    useState<DataType.Coords | null>(null);
  const [googleMapKey, setGoogleMapKey] = useState<string | null>(null);

  const [initPosition, setInitPosition] = useState<DataType.Coords | null>(
    null,
  );
  // NEW
  const [positionReady, setPositionReady] = useState(false);

  const selectedChamberRef = useRef<DataType.Chamber | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const callDataApi = useCallback(
    ({lat, lng, id, isRefresh}: any) => {
      dispatch(
        getPatrollerTaskAssinmentApi({
          param: {
            lat: `${lat}`,
            lng: `${lng}`,
            employeeId: id,
            companyCode: 'gtpl',
          },
          isRefresh: taskData?.chamberCount === 0 ? true : isRefresh,
        }),
      );
    },
    [dispatch, taskData?.chamberCount],
  );

  const getTaskList = useCallback(
    async ({id, isRefresh}: any) => {
      try {
        setIsLoading(true);

        // 🔒 fail-safe: if GPS stalls, we still stop loading
        const guard = setTimeout(async () => {
          const lastLoc = Preferences.getData(
            'LAST_GEO_ADDRESS',
          ) as DataType.GeoAddress | null;
          if (lastLoc?.lat && lastLoc?.long) {
            // ✅ use last known coords so UI can render
            const coords = {
              latitude: lastLoc.lat,
              longitude: lastLoc.long,
            } as DataType.Coords;
            setCurrentPosition(coords);
            setInitPosition(coords);
          }
          setPositionReady(true);
          setIsLoading(false);
        }, 12000); // 12s guard

        Geolocation.getCurrentPosition(
          async info => {
            clearTimeout(guard);
            const coords = info.coords as DataType.Coords;
            setCurrentPosition(coords);
            setInitPosition(coords);
            setPositionReady(true);
            setIsLoading(false);

            try {
              const data = await Location.getAddressWithLatLong(
                coords.latitude,
                coords.longitude,
              );
              Preferences.setData('LAST_GEO_ADDRESS', data);
            } catch {}

            callDataApi({
              lat: coords.latitude,
              lng: coords.longitude,
              id,
              isRefresh,
            });
          },
          err => {
            clearTimeout(guard);
            Common.error('❌ Error fetching location: ', err);

            const lastLoc = Preferences.getData(
              'LAST_GEO_ADDRESS',
            ) as DataType.GeoAddress | null;

            if (lastLoc?.lat && lastLoc?.long) {
              // ✅ set fallback coords so loader can end
              const coords = {
                latitude: lastLoc.lat,
                longitude: lastLoc.long,
              } as DataType.Coords;
              setCurrentPosition(coords);
              setInitPosition(coords);

              callDataApi({
                lat: lastLoc.lat,
                lng: lastLoc.long,
                id,
                isRefresh,
              });
            } else {
              Common.alert({
                title: 'Location Not Found',
                msg: 'Unable to fetch your location. Please try again later.',
              });
            }

            setIsLoading(false);
            setIsPositionFailed(true);
            setPositionReady(true); // ✅ crucial: we’re “ready” (with or without map) so stop loader
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      } catch {
        setIsLoading(false);
        setPositionReady(true);
        Common.error('❌ Error In Get Task Data');
      }
    },
    [callDataApi],
  );

  // Call Totay Attendance API
  useEffect(() => {
    const fetchAttendance = async () => {
      let offlineIn = null;
      let offlineInDD = null;
      const prevAttData = Preferences.getData('OFFLINE_ATTENDANCE') ?? null;
      if (prevAttData !== null && prevAttData?.length > 0) {
        offlineIn =
          prevAttData?.find(
            (item: any) =>
              item.direction === 'in' && item.shiftType === 'single',
          ) ?? null;

        offlineInDD =
          prevAttData?.find(
            (item: any) =>
              item.direction === 'in' && item.shiftType === 'double',
          ) ?? null;
      }

      // res.payload?.todayDuty?.status | res?.payload?.todayDoubleDuty?.status
      const res = Preferences.getData('MARK_ATTENDANCE_STATUS');
      console.log(res);
      if (
        res &&
        !Common.isEqualIgnoreCase(res?.status ?? '', 'pi') &&
        !Common.isEqualIgnoreCase(res?.ddStatus ?? '', 'pi') &&
        !offlineIn &&
        !offlineInDD
      ) {
        Common.alert({
          title: 'Not Marked In Attendance',
          msg: 'You have not marked your attendance today. Please mark your attendance first.\n\nआपने आज की उपस्थिति दर्ज नहीं की है। कृपया पहले उपस्थिति दर्ज करें।',
          onPress: () => {
            navigation.goBack();
          },
        });
      }

      // Check If DD Doing
      //res?.payload && res?.payload?.todayDoubleDuty?.empId
      if (res?.isDD) {
        setEmpId(res?.ddEmpId);
        getTaskList({
          id: res?.ddEmpId,
          isRefresh: true,
        });
      } else if (offlineInDD) {
        setEmpId(offlineInDD.behalfOf ?? 0);
        getTaskList({
          id: offlineInDD.behalfOf,
          isRefresh: true,
        });
      } else {
        setEmpId(empData?.id ?? 0);
        getTaskList({id: empData?.id, isRefresh: false});
      }
    };

    fetchAttendance();
  }, [dispatch, empData?.companyId, empData?.id, getTaskList, navigation]);

  // Watch Position
  useFocusEffect(
    useCallback(() => {
      let localWatchId: number | null = null;
      let isMounted = true;

      Common.log('📍 Starting Geolocation Watch');

      localWatchId = Geolocation.watchPosition(
        async res => {
          if (!isMounted) {
            return;
          }

          const coords = res.coords;
          Common.success('📍 Watch Position:', coords);
          setCurrentPosition(coords as DataType.Coords);

          const lat = coords.latitude;
          const lng = coords.longitude;

          const chamber = selectedChamberRef.current;

          // 🔁 API call if needed
          if (chamber && isPositionFailed) {
            Common.warn(
              '**** Position Falied Call API in Watch POsition********',
            );
            setIsPositionFailed(false);
            callDataApi({
              lat,
              lng,
              id: empID,
              isRefresh: true,
            });
          }

          // 📏 Distance calculation
          if (chamber) {
            const dis = Location.calculateDistance(
              parseFloat(chamber.chamberLat),
              parseFloat(chamber.chamberLong),
              lat,
              lng,
              'm',
            );
            setDistance(dis);
          }

          // 🌐 Update cached geo address
          const lastAdd = Preferences.getData(
            'LAST_GEO_ADDRESS',
          ) as DataType.GeoAddress;

          // Fetch address only if it's missing
          if (lastAdd && !lastAdd.address) {
            Common.warn('🔍 Getting Address in Watch');
            try {
              const data = await Location.getAddressWithLatLong(lat, lng);
              Preferences.setData('LAST_GEO_ADDRESS', data);
            } catch (err) {
              Common.error('❌ Failed to get address from lat/lng', err);
            }
          }

          // Always update latest lat/lng
          const updatedAddress = {
            address: lastAdd?.address ?? '',
            lat,
            long: lng,
          };
          Preferences.setData('LAST_GEO_ADDRESS', updatedAddress);
        },
        err => {
          Common.error('❌ Error in Geolocation Watch:', err);
          Common.alert({
            title: 'Location Error',
            msg: `${err?.message}\nPlease turn on GPS`,
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          distanceFilter: 10,
          interval: 10000,
          fastestInterval: 10000,
        },
      );

      // 🧹 Cleanup on blur/unmount
      return () => {
        isMounted = false;
        if (localWatchId !== null) {
          Geolocation.clearWatch(localWatchId);
          Common.log('🧹 Cleared Geolocation Watch:', localWatchId);
        }
      };
    }, [isPositionFailed, callDataApi, empID]),
  );
  useEffect(() => {
    const key = Preferences.getData('GOOGLE_MAPS_API_KEY');
    if (typeof key === 'string' && key.trim().length > 0) {
      setGoogleMapKey(key.trim());
    } else {
      setGoogleMapKey(null);
      Common.warn('No GOOGLE_MAPS_API_KEY found in Preferences');
    }
  }, []);

  useEffect(() => {
    const list = taskData?.taskChamberList;
    if (list && list.length > 0) {
      selectedChamberRef.current = list[0] ?? null;
      setSelectedChamber(list[0] ?? null);
      setDistance(list[0]?.distance ?? 0);

      const init = Preferences.getData(
        'LAST_GEO_ADDRESS',
      ) as DataType.GeoAddress;
      if (init) {
        setInitPosition({latitude: init.lat, longitude: init.long});
      }
    }
  }, [taskData?.taskChamberList]);

  useEffect(() => {
    dispatch(getChamberIssueListApi({params: '?id=1', isRefresh: false}));
    dispatch(checkCameraPermission());
    Permissions.requestPermission();
  }, [dispatch]);

  // ✅ Function to update distance from stored location
  useEffect(() => {
    let intervalId;
    const updateDistance = () => {
      const lastAdd = Preferences.getData(
        'LAST_GEO_ADDRESS',
      ) as DataType.GeoAddress;
      if (lastAdd?.lat && lastAdd?.long) {
        dispatch(
          updateChamberTaskListDistance({
            lat: lastAdd.lat,
            lng: lastAdd.long,
          }),
        );
        Common.warn('Task List Distance Updated from GeoAddress');
      } else {
        Common.warn('GeoAddress not available');
      }
    };

    // ✅ Immediate call on mount (screen open)
    updateDistance();

    // ✅ Start interval
    if (intervalId) {
      Common.warn('Task List Refresh Interval Already Started');
    } else {
      Common.success('Task List Refresh Interval Started');
      intervalId = setInterval(updateDistance, 30000); // every 2 min
    }

    // ✅ Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      Common.error('Task List Refresh Interval Stopped');
    };
  }, [dispatch]);

  // Memoize onClose
  const onTaskListClose = useCallback(() => {
    setShowTaskListSheet(false);
  }, []);

  // Memoize onDone
  const onTaskListDone = useCallback((task: DataType.Chamber[]) => {
    setShowTaskListSheet(false);
    setSelectedChamber(task?.[0]);
    selectedChamberRef.current = task?.[0];
    setDistance(task?.[0]?.distance ?? 0);
  }, []);
  const origin = currentPosition ?? initPosition;

  return (
    <Screen
      statusBgColor={COLORS.WHITE}
      preset={'fixed'}
      statusBarStyle={'dark'}
      isSafeArea={false}
      isNavSafeArea={false}
      // loading={loading || isLoading || currentPosition === null}
      loading={loading || isLoading || !positionReady}
      loaderMessage={
        'Fetching Current Location\n\n कृपया प्रतीक्षा करें ... आपके वर्तमान स्थान का विवरण प्राप्त हो रहा है।'
      }>
      <View style={styles.container}>
        {positionReady && initPosition && (
          <MapView
            ref={mapRef}
            style={styles.mapView}
            showsUserLocation
            userLocationPriority="high"
            userLocationUpdateInterval={10000}
            userLocationFastestInterval={10000}
            userLocationAnnotationTitle="My Location"
            userInterfaceStyle="light"
            showsCompass={false}
            toolbarEnabled={false}
            loadingEnabled
            loadingIndicatorColor={COLORS.PRIMARY_DARK}
            initialRegion={{
              latitude: initPosition.latitude,
              longitude: initPosition.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            }}>
            <PositionMarker pos={initPosition} />
            {taskData?.taskChamberList &&
              taskData.taskChamberList.map((item, index) => {
                const key = index + '-' + item.chamberIdStr;
                return (
                  <>
                    {selectedChamber?.chamberId === item.chamberId ? (
                      <View key={key} />
                    ) : (
                      <ChamberMarker
                        key={key}
                        chamberIdStr={item?.chamberIdStr}
                        chamberName={item?.chamberName}
                        lat={item?.chamberLat}
                        long={item?.chamberLong}
                        tintColor={COLORS.ACCENT_ORANGE}
                        distance={item.distance}
                        onSelect={() => onTaskListDone([item])}
                      />
                    )}
                  </>
                );
              })}

            {taskData?.successTaskChamberList &&
              taskData.successTaskChamberList.map((item, index) => {
                return (
                  <ChamberMarker
                    key={index + ' - ' + item.chamberIdStr}
                    chamberIdStr={item?.chamberIdStr}
                    chamberName={item?.chamberName}
                    lat={item?.chamberLat}
                    long={item?.chamberLong}
                    tintColor={COLORS.SUCCESS}
                  />
                );
              })}

            <ChamberMarker
              key={`selected ${selectedChamber?.chamberIdStr} `}
              chamberIdStr={selectedChamber?.chamberIdStr}
              chamberName={selectedChamber?.chamberName}
              lat={selectedChamber?.chamberLat}
              long={selectedChamber?.chamberLong}
              distance={selectedChamber?.distance}
              tintColor={COLORS.ERROR}
            />

            {/*
             // This Polyline removed as discussed with Bhutani Sir, on 06 Jul 2025
             selectedChamber !== null && (
               <Polyline
                 strokeColor={COLORS.PRIMARY_DARK}
                 strokeWidth={3}
                 coordinates={[
                   {
                     latitude: parseFloat(selectedChamber?.chamberLat),
                     longitude: parseFloat(selectedChamber?.chamberLong),
                   },
                   {...initPosition},
                 ]}
               />
             )*/}
            {/* {selectedChamber && currentPosition && googleMapKey && (
              <MapViewDirections
                precision={'low'}
                timePrecision={'now'}
                mode={'DRIVING'}
                resetOnChange={false}
                strokeWidth={5}
                strokeColor={COLORS.BLACK}
                optimizeWaypoints={false}
                origin={{
                  latitude: currentPosition?.latitude,
                  longitude: currentPosition?.longitude,
                }}
                destination={{
                  latitude: parseFloat(selectedChamber?.chamberLat),
                  longitude: parseFloat(selectedChamber?.chamberLong),
                }}
                apikey={googleMapKey}
                // onStart={params => {
                //   console.log(
                //     `Started routing between "${params.origin}" and "${params.destination}"`,
                //   );
                // }}
                // onReady={result => {
                //   console.log(`Distance: ${result.distance} km`);
                //   console.log(`Duration: ${result.duration} min.`);
                // }}
              />
            )} */}
            {selectedChamber && origin && googleMapKey && (
              <MapViewDirections
                origin={{
                  latitude: origin.latitude,
                  longitude: origin.longitude,
                }}
                destination={{
                  latitude: parseFloat(selectedChamber.chamberLat),
                  longitude: parseFloat(selectedChamber.chamberLong),
                }}
                apikey={googleMapKey}
                precision="low"
                timePrecision="now"
                mode="DRIVING"
                resetOnChange={false}
                strokeWidth={5}
                strokeColor={COLORS.BLACK}
              />
            )}
          </MapView>
        )}
      </View>

      {selectedChamber && (
        <TopOverlayView
          top={top}
          taskName={`${selectedChamber?.taskName ?? '-'}`}
          chamberCount={`${taskData?.chamberCount ?? 0}`}
          successCount={`${taskData?.successTaskChamberList?.length ?? 0}`}
          taskCount={`${taskData?.taskChamberList?.length ?? 0}`}
          distance={`${(distance ?? 0).toFixed(0)}`}
          name={`${selectedChamber?.chamberIdStr ?? ''} - ${
            selectedChamber?.chamberName ?? ''
          }`}
          offlineCount={
            ' ' + (Preferences.getData('SUBMIT_TASK_DATA')?.length ?? '0')
          }
          onBack={() => navigation.goBack()}
          showDetails={showDetails}
          onDown={() => setShowDetails(!showDetails)}
          behalfName={tdd?.empName}
        />
      )}
      <FloatingButtonView
        onMyPosition={() => {
          if (currentPosition) {
            mapRef.current?.animateToRegion({
              latitude: currentPosition?.latitude ?? 0,
              longitude: currentPosition?.longitude ?? 0,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            });
          }
        }}
        onRefresh={() => {
          dispatch(getChamberIssueListApi({params: '?id=1', isRefresh: true}));
          getTaskList({id: empID, isRefresh: true});
        }}
        onDirection={() => {
          if (selectedChamber) {
            Common.openMaps(
              parseFloat(selectedChamber?.chamberLat ?? '0'),
              parseFloat(selectedChamber?.chamberLong ?? '0'),
            );
          } else {
            Common.showToast('No Task Selected!');
          }
        }}
        onCamera={() => {
          // setShowTaskSubmitSheet(true);
          if (selectedChamber) {
            navigation.navigate('SubmitPatrollerTask', {
              empID,
              selectedChamber: {...selectedChamber, distance},
              currentPosition,
            });
          } else {
            Common.showToast('No Task Selected!');
          }
        }}
        onInfo={() => {
          setShowInfoSheet(true);
        }}
        onTaskList={() => {
          setShowTaskListSheet(true);
        }}
      />
      <InfoModalSheet
        data={selectedChamber}
        distance={distance}
        show={showInfoSheet}
        position={currentPosition}
        onClose={() => setShowInfoSheet(false)}
      />
      <TaskModalSheet
        value={selectedChamber}
        data={taskData?.taskChamberList ?? []}
        show={showTaskListSheet}
        onClose={onTaskListClose}
        onDone={onTaskListDone}
      />
      <AlertView
        show={isAllTaskSubmitted && isFocused}
        onDonePress={() => {
          dispatch(updateCompletedChamberStatus());
          // navigation.goBack();
        }}
        title={'Task Completed'}
        message={
          'You have successfully submitted all chambers task.\nआपने सभी चैम्बर कार्य सफलतापूर्वक जमा कर दिए हैं।'
        }
        icon={IMAGES.complete}
        iconTintColor={COLORS.SUCCESS}
      />
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading:
    state.task.taskListLoading === 'pending' ||
    state.attendance.todayAttendanceLoading === 'pending',
  taskData: state.task.taskListData,
  empData: state.dashboard.dashboardList?.employeeDetails ?? null,
  isAllTaskSubmitted: state.task.isAllTaskSubmitted,
  tdd: state.attendance.todayDoubleDuty,
});
export default connect(MapStateToProps)(PatrollerTask);

const styles = StyleSheet.create({
  devider: {
    height: 1,
    backgroundColor: COLORS.BORDER_DEFAULT,
    width: '100%',
    marginVertical: SIZE.MVS(10),
  },
  mapMarkerImage: {
    tintColor: COLORS.SUCCESS,
    resizeMode: 'contain',
    height: SIZE.MS(50),
    width: SIZE.MS(50),
  },
  notFoundView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: SIZE.MS(20),
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_DARK,
  },
  remarkView: {marginHorizontal: 0},
  topOverlayCheckedRowView: {flexDirection: 'row'},
  imageTitleRowIcon: {
    height: SIZE.MS(25),
    width: SIZE.MS(25),
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
  cameraPicButton: {
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.PRIMARY,
  },
  noteTextGreen: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.SUCCESS,
    marginTop: SIZE.MVS(15),
  },
  noteTextRed: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.ERROR,
    marginTop: SIZE.MVS(15),
  },
  awayText: {
    fontSize: SIZE.MS(20),
    fontFamily: FONTS.BLACK,
    color: COLORS.ERROR,
  },
  distanceText: {
    fontSize: SIZE.MS(20),
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_DARKER,
    marginTop: SIZE.MVS(15),
  },
  latLongTextTitle: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
    marginBottom: SIZE.MS(8),
  },
  latLongTextValue: {
    fontSize: SIZE.MS(13),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
    padding: SIZE.MS(5),
    paddingVertical: SIZE.MS(10),
    borderRadius: SIZE.MS(5),
  },
  latlongView: {
    flex: 1,
    marginRight: SIZE.MS(5),
    ...STYLES.SHADOW_BLACK_3,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(6),
    padding: SIZE.MS(8),
  },
  latLongViewRow: {
    flexDirection: 'row',
    marginTop: SIZE.MVS(10),
  },
  chamberNameText: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY_DARK,
    marginVertical: SIZE.MS(2),
  },
  buttonIcons: {
    height: SIZE.MS(30),
    width: SIZE.MS(30),
    tintColor: COLORS.ACCENT_ORANGE,
  },
  directionButon: {
    height: SIZE.MS(55),
    width: SIZE.MS(55),
    borderRadius: SIZE.MS(45),
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    ...STYLES.SHADOW_BLACK_6,
  },
  checkedText: {
    color: COLORS.SUCCESS,
  },
  pendingText: {
    color: COLORS.ACCENT_ORANGE,
  },
  offlineText: {
    color: COLORS.TEXT_DARK,
  },
  mapView: {flex: 1},
  taskText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
    marginVertical: SIZE.MS(2),
    flex: 1,
  },
  taskHeadingText: {
    fontSize: SIZE.MS(16),
    fontFamily: FONTS.BLACK,
    color: COLORS.TEXT_DARK,
    marginVertical: SIZE.MS(2),
    flex: 1,
  },
  totalChamberTitle: {
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_DARK,
    marginVertical: SIZE.MS(2),
    marginBottom: SIZE.MS(5),
    flex: 1,
  },
  buttonViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZE.MS(15),
  },
  backViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    height: SIZE.MS(35),
    width: SIZE.MS(35),
    alignItems: 'flex-start',
  },
  downButton: {
    height: SIZE.MS(35),
    width: SIZE.MS(35),
    alignItems: 'flex-end',
  },
  backIcon: {
    width: SIZE.MS(20),
    height: SIZE.MS(20),
    tintColor: COLORS.TEXT_DARK,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 15,
    right: 15,
    paddingBottom: SIZE.MS(15),
    paddingTop: SIZE.MS(5),
  },
  topDetailsContainer: {
    opacity: 0.9,
    position: 'absolute',
    left: 15,
    right: 15,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    paddingHorizontal: SIZE.MS(15),
    paddingBottom: SIZE.MS(15),
    paddingTop: SIZE.MS(5),
    ...STYLES.SHADOW_BLACK_6,
  },
  container: {flex: 1},
});
