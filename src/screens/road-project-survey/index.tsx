import React, {FC, useCallback, useMemo, useRef, useState, memo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  StyleSheet,
  Alert,
  InteractionManager,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import MapView, {Marker} from 'react-native-maps';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {COLORS, IMAGES, SIZE} from '@res';
import {ScreenProps} from '@types';
import MapComponent from '../../components/atoms/MapComponent';
import {projectListApi, PostLocationApi} from '@slices/attendance.slice';
import {useDispatch, useSelector} from 'react-redux';
import {StoreDispatch, RootState} from '@reducers';
import ProjectPickerButton, {
  ProjectItem,
} from '../../components/molecules/ProjectPickerButton';
import {Project} from 'src/types/data-types';
import {Preferences, Common} from '@utils';

// Location & permissions
import Geolocation from '@react-native-community/geolocation';
import {check, request, RESULTS, PERMISSIONS} from 'react-native-permissions';
import {useBatteryLevel} from 'react-native-device-info';
type RootStackParamList = {};
const EMPLOYEE_ID_PREF = 'EMPLOYEE_ID' as const;
const AUTH_TOKEN_PREF = 'API_AUTH_TOKEN' as const; // <- matches Preferences key union

/** Range chips list — EXACT meters, no "All" */
const RANGE_PRESETS: Array<{label: string; m: number}> = [
  {label: '200 m', m: 200},
  {label: '500 m', m: 500},
  {label: '1 km', m: 1000},
  {label: '5 km', m: 5000},
];

const PositionMarker = memo(({pos}: any) => (
  <Marker
    title="Starting Point"
    description=""
    coordinate={{
      latitude: pos?.latitude ?? 0,
      longitude: pos?.longitude ?? 0,
    }}>
    <Image
      source={IMAGES.mapLocation}
      resizeMode="contain"
      tintColor={COLORS.PRIMARY}
      style={{height: SIZE.MS(35), width: SIZE.MS(35)}}
    />
  </Marker>
));

const ChamberMarker = memo(
  ({
    chamberIdStr,
    distance,
    chamberName,
    lat,
    long,
    tintColor,
    onSelect,
  }: any) => (
    <Marker
      title={`${chamberIdStr} (${distance}m)`}
      description={`${chamberName}`}
      coordinate={{
        latitude: parseFloat(lat),
        longitude: parseFloat(long),
      }}
      onPress={onSelect}
      onSelect={onSelect}
      anchor={{x: 0.5, y: 1}}>
      <Image
        source={IMAGES.mapChamber}
        resizeMode="contain"
        tintColor={tintColor ?? COLORS.SUCCESS}
        style={{height: SIZE.MS(35), width: SIZE.MS(35)}}
      />
    </Marker>
  ),
);

/** ---------- Selected Project SP/EP panel --------- */
type SelectedProjectPanelProps = {
  project: ProjectItem | null;
  top?: number;
  onPressSP?: () => void;
  onPressEP?: () => void;
};

const SelectedProjectPanel: React.FC<SelectedProjectPanelProps> = ({
  project,
  top = 0,
  onPressSP,
  onPressEP,
}) => {
  if (!project) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, {zIndex: 1200, elevation: 12}]}>
      <View
        style={{
          position: 'absolute',
          left: SIZE.MS(12),
          right: SIZE.MS(12),
          top,
        }}>
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: SIZE.MS(14),
            overflow: 'hidden',
            ...Platform.select({
              android: {elevation: 6},
              ios: {
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 8,
                shadowOffset: {width: 0, height: 4},
              },
            }),
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e5f0ff',
              paddingHorizontal: SIZE.MS(12),
              paddingVertical: SIZE.MVS(10),
            }}>
            <View
              style={{
                height: SIZE.MS(28),
                width: SIZE.MS(28),
                borderRadius: SIZE.MS(14),
                backgroundColor: '#fff7cc',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: SIZE.MS(8),
              }}>
              <Text style={{fontSize: SIZE.MS(16)}}>💡</Text>
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: SIZE.MS(15),
                fontWeight: '700',
                color: '#1f2937',
              }}
              numberOfLines={1}>
              {project.name}
            </Text>
            <View
              style={{
                height: SIZE.MS(22),
                width: SIZE.MS(22),
                borderRadius: SIZE.MS(11),
                backgroundColor: '#fee089',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{fontSize: SIZE.MS(14), color: '#b7791f'}}>✓</Text>
            </View>
          </View>

          {/* SP Row */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPressSP}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingHorizontal: SIZE.MS(12),
              paddingVertical: SIZE.MVS(12),
            }}>
            <View
              style={{
                width: SIZE.MS(28),
                height: SIZE.MS(28),
                borderRadius: SIZE.MS(14),
                backgroundColor: '#65c3ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: SIZE.MS(10),
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: SIZE.MS(12),
                }}>
                SP
              </Text>
            </View>

            <View style={{flex: 1}}>
              <Text
                style={{fontSize: SIZE.MS(13), color: '#111827'}}
                numberOfLines={2}>
                {project.startAddress || '—'}
              </Text>
            </View>

            <View style={{alignItems: 'flex-end', marginLeft: SIZE.MS(8)}}>
              {typeof (project as any).spDistanceM === 'number' && (
                <Text style={{fontSize: SIZE.MS(12), color: '#111827'}}>
                  {(project as any).spDistanceM.toFixed(1)}m
                </Text>
              )}
              <View
                style={{
                  marginTop: SIZE.MS(6),
                  width: SIZE.MS(8),
                  height: SIZE.MS(8),
                  borderRadius: SIZE.MS(4),
                  backgroundColor: '#22c55e',
                }}
              />
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: '#e5e7eb',
              marginHorizontal: SIZE.MS(12),
            }}
          />

          {/* EP Row */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPressEP}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingHorizontal: SIZE.MS(12),
              paddingVertical: SIZE.MVS(12),
            }}>
            <View
              style={{
                width: SIZE.MS(28),
                height: SIZE.MS(28),
                borderRadius: SIZE.MS(14),
                backgroundColor: '#f06292',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: SIZE.MS(10),
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: SIZE.MS(12),
                }}>
                EP
              </Text>
            </View>

            <View style={{flex: 1}}>
              <Text
                style={{fontSize: SIZE.MS(13), color: '#111827'}}
                numberOfLines={2}>
                {project.endAddress || '—'}
              </Text>
            </View>
            <View style={{alignItems: 'flex-end', marginLeft: SIZE.MS(8)}}>
              {typeof (project as any).epDistanceM === 'number' && (
                <Text style={{fontSize: SIZE.MS(12), color: '#111827'}}>
                  {(project as any).epDistanceM.toFixed(1)}m
                </Text>
              )}
              <View
                style={{
                  marginTop: SIZE.MS(6),
                  width: SIZE.MS(8),
                  height: SIZE.MS(8),
                  borderRadius: SIZE.MS(4),
                  backgroundColor: '#22c55e',
                }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const RoadProjectSurvey: FC<ScreenProps.RoadProjectTask> = ({empData}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<StoreDispatch>();
  const mapRef = useRef<MapView | null>(null);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef<null | Promise<any>>(null);
  const rangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selected, setSelected] = useState<ProjectItem | null>(null);

  // Keep current lat/lng separately too
  const [currentLatLng, setCurrentLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const level = useBatteryLevel(); // number | null

  const pct =
    typeof level === 'number' && level >= 0 ? Math.round(level * 100) : null;
  const projectListLoading = useSelector(
    (s: RootState) => s.attendance.projectListLoading,
  );
  const postLocationLoading =
    useSelector((s: RootState) => s.attendance.postLocationLoading) ===
    'pending';

  const [projectListData, setProjectListData] = useState<Project[]>([]);
  const [isDoubleDuty] = useState(false);
  const loading = projectListLoading === 'pending';

  // ✅ Range state — default to 200 m for speed (MOVED inside component)
  const [rangeM, setRangeM] = useState<number>(200);
  const pickerTop = Platform.OS === 'ios' ? SIZE.MS(-30) : SIZE.MS(10);
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onCameraPress = useCallback(() => {}, []);

  const screenProps = useMemo(
    () => ({
      statusBgColor: COLORS.PRIMARY,
      preset: 'scroll' as const,
      loading,
      navBarColor: isDoubleDuty
        ? COLORS.BACKGROUND_PINK
        : COLORS.BACKGROUND_DEFAULT,
    }),
    [loading, isDoubleDuty],
  );

  // Permissions
  const ensurePermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const fine = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (fine === RESULTS.GRANTED || fine === RESULTS.LIMITED) return true;
        if (fine === RESULTS.DENIED) {
          const rf = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
          if (rf === RESULTS.GRANTED || rf === RESULTS.LIMITED) return true;
        }
        const coarse = await check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
        if (coarse === RESULTS.GRANTED || coarse === RESULTS.LIMITED)
          return true;
        if (coarse === RESULTS.DENIED) {
          const rc = await request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
          if (rc === RESULTS.GRANTED || rc === RESULTS.LIMITED) return true;
        }
        return false;
      } else {
        const when = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (when === RESULTS.GRANTED || when === RESULTS.LIMITED) return true;
        const r = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return r === RESULTS.GRANTED || r === RESULTS.LIMITED;
      }
    } catch {
      return false;
    }
  }, []);

  // One-shot current position (fast cached first, then accurate)
  const getCurrentLatLng = useCallback(
    (): Promise<{lat: number; lng: number} | null> =>
      new Promise(async resolve => {
        const ok = await ensurePermission();
        if (!ok) {
          Common.alert({
            title: 'Location permission',
            msg: 'Please allow location access to fetch nearby projects.',
          });
          return resolve(null);
        }
        let settled = false;
        const fallback = setTimeout(() => {
          if (settled) return;
          Geolocation.getCurrentPosition(
            pos => {
              settled = true;
              resolve({lat: pos.coords.latitude, lng: pos.coords.longitude});
            },
            () => resolve(null),
            {enableHighAccuracy: true, timeout: 6000, maximumAge: 0},
          );
        }, 800);

        // Try quick cached (1.2s)
        Geolocation.getCurrentPosition(
          pos => {
            if (settled) return;
            clearTimeout(fallback);
            settled = true;
            resolve({lat: pos.coords.latitude, lng: pos.coords.longitude});
          },
          () => {
            // fallback runs
          },
          {enableHighAccuracy: false, timeout: 1200, maximumAge: 5 * 60 * 1000},
        );
      }),
    [ensurePermission],
  );

  // Fetch with explicit range + latLong "lat,lng"
  const fetchProjects = useCallback(
    async (opts?: {range?: number; immediate?: boolean}) => {
      if (inFlightRef.current) {
        try {
          await inFlightRef.current;
        } catch {}
      }

      const doFetch = async () => {
        let coord = currentLatLng;
        if (!coord) {
          coord = await getCurrentLatLng();
          if (coord && isMountedRef.current) setCurrentLatLng(coord);
        }

        const latLongStr = coord ? `${coord.lat},${coord.lng}` : '';

        const prefEmpId = Preferences.getData(EMPLOYEE_ID_PREF) as
          | number
          | string
          | null;
        const empId = Number(prefEmpId ?? empData?.id ?? 0);

        const effectiveRange = opts?.range ?? rangeM ?? 200;
        console.log('data==>', {effectiveRange}, {latLongStr});
        const action = projectListApi({
          params: {
            projectName: 'Road Project',
            status: 'Active',
            empId,
          },
          body: {
            page: 1,
            size: 100,
            search: '',
            masterProjectId: '',
            stateProjectId: '',
            cityProjectId: '',
            areaProjectId: '',
            raodProjectId: '',
            range: effectiveRange, // 200 | 500 | 1000 | 5000
            latLong: latLongStr, // "lat,lng"
          },
        });

        try {
          const data = await dispatch(action).unwrap();
          if (isMountedRef.current) setProjectListData(data ?? []);
        } catch (e) {
          if (__DEV__) console.log('[projectListApi] ERROR ->', e);
        }
      };

      if (opts?.immediate) {
        inFlightRef.current = doFetch();
        await inFlightRef.current;
        inFlightRef.current = null;
      } else {
        if (rangeTimerRef.current) clearTimeout(rangeTimerRef.current);
        rangeTimerRef.current = setTimeout(async () => {
          inFlightRef.current = doFetch();
          await inFlightRef.current;
          inFlightRef.current = null;
        }, 150);
      }
    },
    [currentLatLng, dispatch, empData?.id, getCurrentLatLng, rangeM],
  );

  const postLocationNow = useCallback(async () => {
    try {
      let coord = currentLatLng;
      if (!coord) {
        coord = await getCurrentLatLng();
        if (coord && isMountedRef.current) setCurrentLatLng(coord);
      }
      if (!coord) {
        Common.alert({
          title: 'Location',
          msg: 'Unable to get current location.',
        });
        return;
      }

      // Read Preferences with correct keys
      const apiAuthToken = Preferences.getData(AUTH_TOKEN_PREF) as
        | string
        | null;
      const employeeID = Preferences.getData(EMPLOYEE_ID_PREF) as number | null;

      const body = {
        token: apiAuthToken ?? '',
        employeeID: Number(employeeID ?? 0),
        address: selected?.startAddress ?? selected?.endAddress ?? '',
        batteryStatus: pct?.toString() ?? 0, // send a number; fallback to 0
        delay: '0',
        dateTime: new Date().toISOString(),
        distance: 0,
        dutyStatus: '',
        latitude: String(coord.lat),
        longitude: String(coord.lng),
        companyId: 11,
      };

      await dispatch(PostLocationApi({body})).unwrap();
      Common.alert({
        title: 'Success',
        msg: 'Location posted successfully.',
      });
    } catch (e: any) {
      Common.alert({
        title: 'Post Location Failed',
        msg: e?.message ?? 'Unknown error',
      });
    }
    // 👇 include pct so the latest percentage is used
  }, [currentLatLng, getCurrentLatLng, dispatch, selected, pct]);

  // Initial load — call with 200 m explicitly so API sees it
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      const task = InteractionManager.runAfterInteractions(() => {
        fetchProjects({range: 200, immediate: true});
      });
      return () => {
        isMountedRef.current = false;
        task.cancel?.();
        if (rangeTimerRef.current) clearTimeout(rangeTimerRef.current);
      };
    }, [fetchProjects]),
  );

  // Chip tap handler — immediate fetch with exact meters
  const onSelectRange = useCallback(
    (m: number) => {
      setRangeM(m);
      fetchProjects({range: m, immediate: true});
    },
    [fetchProjects],
  );

  const projectItems = useMemo<ProjectItem[]>(() => {
    return (projectListData || []).map(project => ({
      id: project?.id?.toString() || '0',
      code: project?.projectCode?.toString() || 'N/A',
      name: project?.name || 'N/A',
      startAddress: project?.startAddress || 'N/A',
      endAddress: project?.endAddress || 'N/A',
      distanceKm: 0,
    }));
  }, [projectListData]);

  return (
    <Screen {...screenProps}>
      <BackHeader
        headerTitle="Road Project Survey"
        onBackPress={handleBackPress}
      />
      <View
        style={{
          paddingHorizontal: SIZE.MS(12),
          marginTop: SIZE.MS(8),
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: SIZE.MS(8),
        }}>
        {/* {RANGE_PRESETS.map(p => {
          const active = rangeM === p.m;
          return (
            <TouchableOpacity
              key={p.label}
              onPress={() => onSelectRange(p.m)}
              style={{
                paddingHorizontal: SIZE.MS(10),
                paddingVertical: SIZE.MVS(6),
                borderRadius: SIZE.MS(16),
                backgroundColor: active ? COLORS.PRIMARY : '#eef2ff',
              }}>
              <Text
                style={{color: active ? '#fff' : '#1f2937', fontWeight: '600'}}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })} */}
      </View>

      <ProjectPickerButton
        value={selected}
        variant="floating"
        projects={projectItems}
        onSelect={setSelected}
        onReload={range => fetchProjects({range, immediate: true})}
        top={pickerTop} // 👈 updated here
      />

      <SelectedProjectPanel
        project={selected}
        top={insets.top + SIZE.MS(70)}
        onPressSP={() => {}}
        onPressEP={() => {}}
      />

      <MapComponent
        markers={[]}
        onMarkerPress={() => {}}
        showUserLocation
        userMarkerImage={IMAGES.mapLocation}
        userMarkerSize={SIZE.MS(35)}
      />

      {/* Floating Post Location button */}
      {/* <TouchableOpacity
        onPress={postLocationNow}
        disabled={postLocationLoading}
        style={[styles.postFab, {opacity: postLocationLoading ? 0.6 : 1}]}>
        <Text style={{color: '#fff', fontWeight: '700'}}>
          {postLocationLoading ? 'Posting…' : 'Post Location'}
        </Text>
      </TouchableOpacity> */}
    </Screen>
  );
};

export default RoadProjectSurvey;

const styles = StyleSheet.create({
  container: {flex: 1},
  mapView: {flex: 1},
  cameraFab: {
    position: 'absolute',
    marginTop: SIZE.MS(360),
    left: SIZE.MS(15),
    height: SIZE.MS(54),
    width: SIZE.MS(54),
    borderRadius: SIZE.MS(27),
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: {elevation: 6},
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: SIZE.MVS(6),
        shadowOffset: {width: 0, height: 4},
      },
    }),
  },
  cameraIcon: {height: SIZE.MS(24), width: SIZE.MS(24), tintColor: '#FFFFFF'},
  distanceFab: {
    position: 'absolute',
    marginTop: SIZE.MS(420),
    left: SIZE.MS(15),
    height: SIZE.MS(54),
    width: SIZE.MS(54),
    borderRadius: SIZE.MS(27),
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: {elevation: 6},
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 4},
      },
    }),
  },
  postFab: {
    position: 'absolute',
    right: SIZE.MS(16),
    bottom: SIZE.MS(24),
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(24),
    backgroundColor: COLORS.PRIMARY,
    ...Platform.select({
      android: {elevation: 6},
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 4},
      },
    }),
  },
});
