// MapComponent.tsx
import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  AppState,
  DeviceEventEmitter,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, {
  Marker,
  Region,
  LatLng,
  Circle,
  Camera,
  Polyline,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {check, request, RESULTS, PERMISSIONS} from 'react-native-permissions';
import Geocoder from 'react-native-geocoder-reborn';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import styles from './styles';
import {IMAGES, SIZE, COLORS} from '@res';
import {Timer} from '../../../utils/TimerBus';
import {Common} from '@utils';
import {useDispatch, useSelector} from 'react-redux';
import {
  insertUpdateProjectPathByVendorApi,
  getprojectPathApi,
} from '@slices/attendance.slice';
import RNFS from 'react-native-fs';
/** Events */
export const TRACK_EVENT = 'DISTANCE_TRACK_EVENT';
const EVENT_SHOW_PROJECT_POINTS = 'SHOW_PROJECT_POINTS';
const EVENT_VIDEO_READY = 'VIDEO_READY_EVENT';
const EVENT_REQUEST_PROJECT_PICK = 'REQUEST_PROJECT_PICK';
/** sampling / smoothing / timing */
const SMOOTH_ALPHA = 0.2;
const HIGH_ACCURACY_TIMEOUT_MS = 6000;
const QUICK_CACHED_TIMEOUT_MS = 1500;
const MAX_AGE_MS = 5 * 60 * 1000;

const MAX_GEOCODE_RETRIES = 3;
const GEOCODE_PER_TRY_TIMEOUT_MS = 2000;
const GEOCODE_RETRY_GAP_MS = 300;

const MIN_DISTANCE_FOR_GEOCODE = 20;
const MIN_INTERVAL_MS = 8000;

const RETRY_MS = 4000;
const MIN_POINT_DISTANCE = 5;
const MAX_POINT_GAP_METERS = 800;
const MIN_SAMPLE_MS = 700;
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;
const MIN_SURVEY_MS = 60000;

/** helpers */
const toRad = (d: number) => (d * Math.PI) / 180;
const distMeters = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
};
const formatHMS = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};
const toWktLineString = (pts: LatLng[]) =>
  `LINESTRING (${pts.map(p => `${p.longitude} ${p.latitude}`).join(', ')})`;

const kmFmt = (m: number) =>
  m >= 1000 ? (m / 1000).toFixed(2) + ' km' : `${Math.round(m)} m`;
const shortMeters = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;

type RootState = any; // replace with your actual RootState
const useApprovedPathFromStore = (projectId: string | null) => {
  return useSelector((state: RootState) => {
    if (!projectId) return undefined;
    return state?.attendance?.projectPathById?.[projectId];
  });
};
const MapComponent: React.FC<{
  markers?: Array<{
    id: string;
    coordinate: LatLng;
    title?: string;
    description?: string;
  }>;
  onMarkerPress?: (marker: any) => void;
  showUserLocation?: boolean;
  userMarkerImage?: any;
  userMarkerSize?: number;
}> = ({
  markers = [],
  onMarkerPress,
  showUserLocation = true,
  userMarkerImage,
  userMarkerSize = 35,
}) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const mapRef = useRef<MapView>(null);
  const dispatch = useDispatch();

  /** map/loc state */
  const [initialRegion, setInitialRegion] = useState<Region>({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const lastFixTsRef = useRef<number>(0);
  const userSmoothRef = useRef<LatLng | null>(null);
  const [userAddress, setUserAddress] = useState<string>('Fetching address…');
  const [accuracy, setAccuracy] = useState<number>(0);
  const [iconReady, setIconReady] = useState(true);
  const [followUser, setFollowUser] = useState(false);

  const lastGeocodeCoordRef = useRef<LatLng | null>(null);
  const lastGeocodeTsRef = useRef<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [booting, setBooting] = useState(true);
  const firstFixRef = useRef(false);
  const firstAddressDoneRef = useRef(false);
  const mountedRef = useRef(true);

  const [trackState, setTrackState] = useState<
    'idle' | 'active' | 'paused' | 'ended'
  >('idle');
  const trackStateRef = useRef<typeof trackState>('idle');
  useEffect(() => {
    trackStateRef.current = trackState;
  }, [trackState]);

  /** recorded path (LIVE TRACK) */
  const [path, setPath] = useState<LatLng[]>([]);
  const pathRef = useRef<LatLng[]>([]);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  /** throttle samples */
  const lastSampleTsRef = useRef(0);

  /** distance */
  const totalDistanceRef = useRef(0);
  const [totalDistanceM, setTotalDistanceM] = useState(0);

  /** project gating */
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [projectPoints, setProjectPoints] = useState<{
    name?: string;
    sp?: LatLng | null;
    ep?: LatLng | null;
  } | null>(null);
  const [nearestInfo, setNearestInfo] = useState<{
    which: 'Start' | 'End' | null;
    meters: number;
  } | null>(null);

  /** ⬇️ NEW: Approved path state (server path) */
  const [approvedPathCoords, setApprovedPathCoords] = useState<LatLng[]>([]);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [approvedError, setApprovedError] = useState<string | null>(null);

  // ⬇️ NEW: read latest approved path for this project from Redux store
  const approvedPathInStore = useApprovedPathFromStore(selectedProjectId);

  /** timer */
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalElapsedMs, setFinalElapsedMs] = useState<number | null>(null);
  useEffect(() => Timer.subscribe(ms => setElapsedMs(ms)), []);

  /** track history */
  const [trackData, setTrackData] = useState<
    Array<{
      duration: string;
      distance: string;
      speed: string;
      path: LatLng[];
      locations: string[];
    }>
  >([]);
  const [showTrackHistory, setShowTrackHistory] = useState(false);
  const [currentLocations, setCurrentLocations] = useState<string[]>([]);

  /** pending video & upload state */
  const [pendingVideo, setPendingVideo] = useState<{
    uri: string;
    sizeBytes?: number;
    durationSec?: number;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadSent, setUploadSent] = useState(0);
  const [uploadTotal, setUploadTotal] = useState<number | null>(null);
  const percent =
    uploadTotal && uploadTotal > 0
      ? Math.min(100, (uploadSent / uploadTotal) * 100)
      : 0;

  /** helpers */
  const smoothCoord = (prev: LatLng | null, next: LatLng): LatLng =>
    !prev
      ? next
      : {
          latitude:
            prev.latitude + SMOOTH_ALPHA * (next.latitude - prev.latitude),
          longitude:
            prev.longitude + SMOOTH_ALPHA * (next.longitude - prev.longitude),
        };

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

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        const results = await Geocoder.geocodePosition({lat, lng});
        if (!results?.length) return 'Unknown location';
        const r = results[0] as any;
        const street =
          r.streetName ||
          r.thoroughfare ||
          [r.streetNumber, r.streetName].filter(Boolean).join(' ').trim();
        const city = r.locality || r.subAdminArea || '';
        const region = r.adminArea || '';
        const formatted =
          r.formattedAddress ||
          [street, city, region].filter(Boolean).join(', ');
        setUserAddress(formatted || 'Unknown area');
        return formatted || 'Unknown location';
      } catch {
        return 'Unknown location';
      }
    },
    [],
  );

  const maybeGeocode = useCallback(
    async (coord: LatLng) => {
      const now = Date.now();
      const lastC = lastGeocodeCoordRef.current;
      const lastT = lastGeocodeTsRef.current;
      const movedEnough =
        !lastC || distMeters(lastC, coord) >= MIN_DISTANCE_FOR_GEOCODE;
      const timeEnough = now - lastT >= MIN_INTERVAL_MS;

      if (movedEnough || timeEnough) {
        lastGeocodeCoordRef.current = coord;
        lastGeocodeTsRef.current = now;
        const address = await reverseGeocode(coord.latitude, coord.longitude);

        if (
          trackStateRef.current === 'active' &&
          address !== 'Unknown location'
        ) {
          setCurrentLocations(prev => {
            if (prev.length === 0 || prev[prev.length - 1] !== address) {
              return [...prev, address];
            }
            return prev;
          });
        }
      }
    },
    [reverseGeocode],
  );

  const animateTo = (coord: LatLng) => {
    if (!mapRef.current) return;
    const cam: Partial<Camera> = {
      center: coord,
      zoom: 17,
      pitch: 0,
      heading: 0,
    };
    mapRef.current.animateCamera(cam as Camera, {duration: 600});
  };

  const addPointToPath = useCallback((coord: LatLng) => {
    setPath(prev => {
      if (prev.length === 0) return [coord];
      const last = prev[prev.length - 1];
      const d = distMeters(last, coord);
      if (d < MIN_POINT_DISTANCE || d > MAX_POINT_GAP_METERS) return prev;
      const next = [...prev, coord];
      totalDistanceRef.current += d;
      setTotalDistanceM(totalDistanceRef.current);
      return next;
    });
  }, []);

  const addPointToPathForce = useCallback((coord: LatLng) => {
    setPath(prev => {
      if (prev.length === 0) return [coord];
      const last = prev[prev.length - 1];
      const d = distMeters(last, coord);
      if (d <= 0) return prev;
      const next = [...prev, coord];
      totalDistanceRef.current += d;
      setTotalDistanceM(totalDistanceRef.current);
      return next;
    });
  }, []);

  /* ---------- iOS config ---------- */
  useEffect(() => {
    if (Platform.OS === 'ios') {
      try {
        Geolocation.setRNConfiguration?.({
          skipPermissionRequests: true,
          authorizationLevel: 'whenInUse',
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') start();
    });
    return () => sub.remove();
  }, []);

  const geocodeOnceWithTimeout = useCallback(
    async (coord: LatLng): Promise<string | 'timeout' | null> =>
      await Promise.race([
        (async () => {
          try {
            const res = await Geocoder.geocodePosition({
              lat: coord.latitude,
              lng: coord.longitude,
            });
            return res?.[0]?.formattedAddress || null;
          } catch {
            return null;
          }
        })(),
        new Promise<'timeout'>(res =>
          setTimeout(() => res('timeout'), GEOCODE_PER_TRY_TIMEOUT_MS),
        ),
      ]),
    [],
  );

  const resolveFirstAddress = useCallback(
    async (coord: LatLng) => {
      if (firstAddressDoneRef.current) return;
      for (let i = 0; i < MAX_GEOCODE_RETRIES; i++) {
        const r = await geocodeOnceWithTimeout(coord);
        if (r && r !== 'timeout') {
          if (!mountedRef.current) return;
          setUserAddress(r);
          firstAddressDoneRef.current = true;
          setBooting(false);
          return;
        }
        await new Promise(res => setTimeout(res, GEOCODE_RETRY_GAP_MS));
      }
      if (!mountedRef.current) return;
      setUserAddress(
        `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`,
      );
      firstAddressDoneRef.current = true;
      setBooting(false);
      reverseGeocode(coord.latitude, coord.longitude);
    },
    [geocodeOnceWithTimeout, reverseGeocode],
  );

  const onFirstFix = useCallback(
    (coord: LatLng, acc?: number) => {
      if (firstFixRef.current) return;
      firstFixRef.current = true;
      setAccuracy(acc || 0);
      userSmoothRef.current = coord;
      setUserLocation(coord);
      setInitialRegion({
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      resolveFirstAddress(coord);
    },
    [resolveFirstAddress],
  );

  const start = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    firstFixRef.current = false;
    firstAddressDoneRef.current = false;
    setBooting(true);

    const ok = await ensurePermission();
    if (!ok) {
      setBooting(false);
      Common.alert({
        title: 'Location permission',
        msg: 'Please allow location access to show your current position.',
      });
      return;
    }
    // quick cached
    Geolocation.getCurrentPosition(
      pos => {
        const {latitude, longitude, accuracy} = pos.coords;
        const ts = pos.timestamp || Date.now();
        lastFixTsRef.current = ts;
        onFirstFix({latitude, longitude}, accuracy);
      },
      () => {},
      {
        enableHighAccuracy: false,
        timeout: QUICK_CACHED_TIMEOUT_MS,
        maximumAge: LAST_KNOWN_MAX_AGE_MS,
      },
    );

    // high-accuracy watch
    if (watchIdRef.current != null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    watchIdRef.current = Geolocation.watchPosition(
      async pos => {
        const {latitude, longitude, accuracy} = pos.coords;
        const ts = pos.timestamp || Date.now();

        if (ts <= lastFixTsRef.current) return;
        lastFixTsRef.current = ts;

        const raw = {latitude, longitude};
        setAccuracy(accuracy || 0);

        const prev = userSmoothRef.current;
        const smooth = smoothCoord(prev, raw);
        userSmoothRef.current = smooth;
        setUserLocation(smooth);

        if (!firstFixRef.current) onFirstFix(smooth, accuracy);

        const now = Date.now();
        if (
          trackStateRef.current === 'active' &&
          now - lastSampleTsRef.current >= MIN_SAMPLE_MS
        ) {
          lastSampleTsRef.current = now;
          addPointToPath(smooth);
          DeviceEventEmitter.emit(TRACK_EVENT, {
            type: 'point',
            coord: smooth,
            timestamp: now,
            // address is optional; DistanceCovered will lazy-resolve it
          });
        }
        if (followUser && smooth) animateTo(smooth);
        await maybeGeocode(raw);
        // nearest SP/EP hint
        if (projectPoints?.sp || projectPoints?.ep) {
          const spD = projectPoints?.sp
            ? distMeters(smooth, projectPoints.sp)
            : Number.POSITIVE_INFINITY;
          const epD = projectPoints?.ep
            ? distMeters(smooth, projectPoints.ep)
            : Number.POSITIVE_INFINITY;
          if (
            spD === Number.POSITIVE_INFINITY &&
            epD === Number.POSITIVE_INFINITY
          ) {
            setNearestInfo(null);
          } else if (spD <= epD) {
            setNearestInfo({which: 'Start', meters: spD});
          } else {
            setNearestInfo({which: 'End', meters: epD});
          }
        } else {
          setNearestInfo(null);
        }
      },
      () => {
        retryTimerRef.current = setTimeout(start, RETRY_MS);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 600,
        maximumAge: 0,
        useSignificantChanges: false,
      },
    );
  }, [
    ensurePermission,
    onFirstFix,
    addPointToPath,
    followUser,
    maybeGeocode,
    projectPoints?.ep,
    projectPoints?.sp,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    start();
    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (watchIdRef.current != null)
        Geolocation.clearWatch(watchIdRef.current);
      Geolocation.stopObserving();
    };
  }, [start]);

  const centerOnUser = () => {
    if (userSmoothRef.current) {
      setFollowUser(true);
      animateTo(userSmoothRef.current);
    }
  };

  const fitToPath = () => {
    if (!mapRef.current || pathRef.current.length < 2) return;
    mapRef.current.fitToCoordinates(pathRef.current, {
      edgePadding: {top: 60, right: 60, bottom: 60, left: 60},
      animated: true,
    });
  };

  const onPressResumePause = () => {
    if (!userSmoothRef.current) {
      start();
      return;
    }

    const isTryingToStart =
      trackState === 'idle' ||
      trackState === 'paused' ||
      trackState === 'ended';

    if (isTryingToStart && !selectedProjectId) {
      Common.alert({
        title: 'Select a project',
        msg: 'First select a project from the list to start tracking.',
      });
      return;
    }
    if (trackState === 'active') {
      Timer.pause();
      setTrackState('paused');
      return;
    }

    if (trackState === 'paused') {
      if (typeof (Timer as any).resume === 'function') {
        (Timer as any).resume();
      } else {
        try {
          (Timer as any).start?.(true);
        } catch {}
      }
      setTrackState('active');
      return;
    }

    // START NEW LEG
    setPath(userSmoothRef.current ? [userSmoothRef.current] : []);
    totalDistanceRef.current = 0;
    setTotalDistanceM(0);
    setCurrentLocations([]);

    DeviceEventEmitter.emit(TRACK_EVENT, {
      type: 'new_leg',
      startedAt: Date.now(),
      start: userSmoothRef.current || null,
      address: userAddress || '',
      projectId: selectedProjectId || undefined,
      projectName: selectedProjectName || undefined,
    });

    Timer.stop();
    Timer.start();
    setFinalElapsedMs(null);
    setTrackState('active');
  };

  /** receive saved video from VideoRecorder */
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      EVENT_VIDEO_READY,
      (payload: {uri: string; sizeBytes?: number; durationSec?: number}) => {
        setPendingVideo(payload);
        Common.showToast('Video ready, tap END to upload.');
      },
    );
    return () => sub.remove();
  }, []);
  /** open camera */
  const openCamera = () => {
    const surveyActive = trackState === 'active';
    if (!surveyActive) {
      Common.alert({
        title: 'Start survey',
        msg: 'You have not started the survey yet.',
      });
      return;
    }
    if (!selectedProjectId) {
      Common.alert({
        title: 'Select a project',
        msg: 'First select a project from the list to start tracking.',
      });
      return;
    }
    navigation.navigate('VideoRecorder', {
      projectId: selectedProjectId,
    } as any);
  };

  /** let user reselect project anytime */
  const pickProject = () => {
    const canNavigate = typeof (navigation as any)?.navigate === 'function';
    try {
      if (canNavigate) {
        (navigation as any).navigate?.('ProjectPicker');
      } else {
        DeviceEventEmitter.emit(EVENT_REQUEST_PROJECT_PICK);
      }
    } catch {
      DeviceEventEmitter.emit(EVENT_REQUEST_PROJECT_PICK);
    }
  };

  /** END: stop tracking and UPLOAD here (with or without video) */
  const onPressEnd = async () => {
    if (userSmoothRef.current) addPointToPathForce(userSmoothRef.current);

    /** ⛔ MIN-SURVEY GUARD — block upload if < 1 minute */
    const snapshot = Timer.getElapsedMs();
    if (snapshot < MIN_SURVEY_MS) {
      const remainingSec = Math.max(
        0,
        Math.ceil((MIN_SURVEY_MS - snapshot) / 1000),
      );
      Common.alert({
        title: 'Minimum survey time',
        msg: `Please continue for at least ${remainingSec} more second${
          remainingSec === 1 ? '' : 's'
        } before ending.`,
      });
      return; // keep active
    }

    setFinalElapsedMs(snapshot);

    // Calculate speed in km/h
    const hours = snapshot / 3600000;
    const speed = hours > 0 ? totalDistanceRef.current / 1000 / hours : 0;

    // Final address
    let finalAddress = userAddress;
    if (userSmoothRef.current) {
      finalAddress = await reverseGeocode(
        userSmoothRef.current.latitude,
        userSmoothRef.current.longitude,
      );
    }

    // Save track summary
    const newTrackData = {
      duration: formatHMS(snapshot),
      distance: (totalDistanceRef.current / 1000).toFixed(2) + ' km',
      speed: speed.toFixed(2),
      path: [...pathRef.current],
      locations: [...currentLocations, finalAddress].filter(
        (loc, index, arr) => loc && arr.indexOf(loc) === index,
      ),
    };
    setTrackData(prev => [...prev, newTrackData]);

    if (!selectedProjectId) {
      Common.alert({
        title: 'Select a project',
        msg: 'Please select a project before ending.',
      });
      return;
    }

    // Optional: size guard ONLY if we have a video
    if (pendingVideo?.uri) {
      try {
        const stat = await RNFS.stat(pendingVideo.uri.replace('file://', ''));
        const size = Number(stat.size ?? 0);
        if (size > 30 * 1024 * 1024) {
          Common.alert({
            title: 'Video too large',
            msg: 'Please record a shorter video (max ~30MB).',
          });
          return;
        }
      } catch {}
    }

    const wkt = toWktLineString(pathRef.current);

    setUploading(true);
    setUploadSent(0);
    setUploadTotal(null);

    // Build payload: include video only if present
    const payload: any = {
      projectId: selectedProjectId,
      latLng: wkt,
      directionResult: '',
      onProgress: (sent: number, total?: number | null) => {
        setUploadSent(sent || 0);
        if (total && total > 0) setUploadTotal(total);
      },
    };
    if (pendingVideo?.uri) {
      payload.video = {
        uri: pendingVideo.uri,
        name: 'video.mp4',
        type: 'video/mp4',
      } as any;
    }
    try {
      const action: any = await dispatch(
        insertUpdateProjectPathByVendorApi(payload) as any,
      );
      setUploading(false);
      if (action?.meta?.requestStatus === 'fulfilled') {
        Common.alert({
          title: 'Uploaded',
          msg: pendingVideo?.uri
            ? 'Video & path uploaded successfully.'
            : 'Path uploaded successfully.',
        });
        if (pendingVideo?.uri) setPendingVideo(null);
      } else {
        const msg =
          (action?.payload && (action.payload.message || action.payload.msg)) ||
          'Upload failed';
        Common.alert({title: 'Upload failed', msg: String(msg)});
      }
    } catch (e: any) {
      setUploading(false);
      Common.alert({title: 'Upload error', msg: String(e?.message || e)});
    }
    Timer.stop();
    setTrackState('ended');
    setFollowUser(false);
    fitToPath();
  };

  /** Show project points from picker (selection result) */
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      EVENT_SHOW_PROJECT_POINTS,
      (payload: {
        projectId: string;
        name?: string;
        sp?: LatLng | null;
        ep?: LatLng | null;
      }) => {
        setSelectedProjectId(payload.projectId || null);
        setSelectedProjectName(payload.name || '');
        setProjectPoints({
          name: payload.name,
          sp: payload.sp ?? null,
          ep: payload.ep ?? null,
        });
        if (payload.projectId) {
          setApprovedLoading(true);
          setApprovedError(null);
          dispatch(getprojectPathApi({projectId: payload.projectId}) as any)
            .unwrap?.()
            .then((res: {coords: LatLng[]}) => {
              setApprovedPathCoords(res?.coords || []);
              setApprovedLoading(false);

              // Fit to approved path + current user for context
              if (mapRef.current && (res?.coords?.length ?? 0) > 1) {
                const coords = [...res.coords];
                if (userSmoothRef.current) coords.push(userSmoothRef.current);
                mapRef.current.fitToCoordinates(coords, {
                  edgePadding: {top: 80, right: 80, bottom: 120, left: 80},
                  animated: true,
                });
                setFollowUser(false);
              }
            })
            .catch((e: any) => {
              setApprovedLoading(false);
              setApprovedError(e?.message || 'Failed to load approved path');
              setApprovedPathCoords([]);
            });
        }
        setTimeout(() => {
          if (!mapRef.current) return;
          const coords: LatLng[] = [];
          if (payload.sp) coords.push(payload.sp);
          if (payload.ep) coords.push(payload.ep);
          if (userSmoothRef.current) coords.push(userSmoothRef.current);
          if (coords.length > 0) {
            mapRef.current.fitToCoordinates(coords, {
              edgePadding: {top: 80, right: 80, bottom: 120, left: 80},
              animated: true,
            });
            setFollowUser(false);
          }
        }, 120);
      },
    );
    return () => sub.remove();
  }, [dispatch]);

  // ⬇️ NEW: if store updates (e.g., offline cache), reflect it
  useEffect(() => {
    if (!selectedProjectId) return;
    if (approvedPathInStore?.coords?.length) {
      setApprovedPathCoords(approvedPathInStore.coords);
    }
  }, [approvedPathInStore, selectedProjectId]);

  const UserLocationMarker = () => {
    if (!userLocation) return null;
    const accuracyRadius = Math.max(accuracy || 0, 0);
    return (
      <>
        {accuracyRadius > 0 && (
          <Circle
            center={userLocation}
            radius={accuracyRadius}
            strokeColor="rgba(0,122,255,0.3)"
            fillColor="rgba(0,0,0,0.1)"
            zIndex={1}
          />
        )}
        <Marker
          coordinate={userLocation}
          title="Your location"
          description={userAddress}
          anchor={{x: 0.5, y: 0.5}}
          tracksViewChanges={iconReady}
          onPress={() => {
            Common.alert({
              title: 'Location',
              msg: `Lat: ${userLocation.latitude.toFixed(
                6,
              )}\nLng: ${userLocation.longitude.toFixed(6)}\nAccuracy: ±${(
                accuracy || 0
              ).toFixed(1)}m\n\n${userAddress}`,
            });
          }}>
          {userMarkerImage ? (
            <Image
              source={userMarkerImage}
              resizeMode="contain"
              style={{
                height: userMarkerSize,
                width: userMarkerSize,
                tintColor: COLORS.PRIMARY,
              }}
              onLoadEnd={() => setIconReady(false)}
              onLoad={() => setIconReady(false)}
            />
          ) : (
            <View
              style={{
                height: userMarkerSize,
                width: userMarkerSize,
                borderRadius: userMarkerSize / 2,
                backgroundColor: '#007AFF',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onLayout={() => setIconReady(false)}>
              <View
                style={{
                  height: userMarkerSize * 0.45,
                  width: userMarkerSize * 0.45,
                  borderRadius: (userMarkerSize * 0.45) / 2,
                  backgroundColor: '#fff',
                }}
              />
            </View>
          )}
        </Marker>
      </>
    );
  };

  const surveyActive = trackState === 'active';

  return (
    <View style={styles.screen}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass
          zoomControlEnabled
          showsBuildings
          onTouchStart={() => setFollowUser(false)}>
          {showUserLocation && <UserLocationMarker />}

          {/* ⬇️ NEW: Approved path (server) — BLUE UNDERLAY */}
          {approvedPathCoords.length >= 2 && (
            <>
              <Polyline
                coordinates={approvedPathCoords}
                geodesic={false}
                strokeWidth={8}
                strokeColor="rgba(30,144,255,0.35)" // soft blue shadow
              />
              <Polyline
                coordinates={approvedPathCoords}
                geodesic={false}
                strokeWidth={5}
                strokeColor="#1E90FF" // DodgerBlue
              />
            </>
          )}

          {/* LIVE tracking path — RED (unchanged) */}
          {path.length >= 2 && (
            <>
              <Polyline
                coordinates={path}
                geodesic={false}
                strokeWidth={7}
                strokeColor="rgba(0,0,0,0.25)"
              />
              <Polyline
                coordinates={path}
                geodesic={false}
                strokeWidth={5}
                strokeColor="#D32F2F"
              />
            </>
          )}

          {/* Start / End markers for live track */}
          {path.length >= 1 && (
            <Marker
              coordinate={path[0]}
              title="Start"
              description="Tracking started here"
              pinColor="green"
            />
          )}
          {trackState === 'ended' && path.length >= 1 && (
            <Marker
              coordinate={path[path.length - 1]}
              title="End"
              description="Tracking ended here"
              pinColor="red"
            />
          )}

          {/* Optional SP / EP */}
          {!!projectPoints?.sp && (
            <Marker
              coordinate={projectPoints.sp}
              title="Start Point (SP)"
              description={
                projectPoints?.name
                  ? `Project: ${projectPoints.name}`
                  : undefined
              }
              pinColor="#65c3ff"
            />
          )}
          {!!projectPoints?.ep && (
            <Marker
              coordinate={projectPoints.ep}
              title="End Point (EP)"
              description={
                projectPoints?.name
                  ? `Project: ${projectPoints.name}`
                  : undefined
              }
              pinColor="#f06292"
            />
          )}

          {markers.map(m => (
            <Marker
              key={m.id}
              coordinate={m.coordinate}
              title={m.title}
              description={m.description}
              onPress={() => onMarkerPress?.(m)}
              tracksViewChanges={false}
            />
          ))}
        </MapView>

        {/* ⬇️ NEW: small badge for approved path loading/error */}
        {(approvedLoading || approvedError) && (
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              alignSelf: 'center',
              backgroundColor: approvedError ? '#7f1d1d' : 'rgba(0,0,0,0.6)',
              padding: 8,
              borderRadius: 8,
            }}>
            <Text
              style={{color: '#fff', textAlign: 'center', fontWeight: '600'}}>
              {approvedLoading
                ? 'Loading approved path…'
                : `Approved path: ${approvedError}`}
            </Text>
          </View>
        )}

        {booting && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.25)',
            }}>
            <ActivityIndicator size="large" />
            <Text style={{marginTop: 10, fontWeight: '600'}}>
              Getting your location…
            </Text>
            <Text style={{marginTop: 4}}>
              Please ensure GPS/Location is enabled
            </Text>
          </View>
        )}

        <View style={styles.controlsContainer}>
          {(userLocation || markers.length > 0) && (
            <TouchableOpacity onPress={centerOnUser}>
              <Image style={styles.precisionIcon} source={IMAGES.precision} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={openCamera}
            accessibilityLabel="Open Camera">
            <Image style={styles.cameraIcon} source={IMAGES.camera} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('DistanceCovered' as never)}>
            <View style={styles.fab}>
              <Text style={{fontSize: 18}}>📊</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pending video badge */}
        {pendingVideo?.uri && (
          <View
            style={{
              position: 'absolute',
              bottom: 160,
              left: 12,
              right: 12,
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: 8,
              borderRadius: 8,
            }}>
            <Text style={{color: '#fff', textAlign: 'center'}}>
              📹 Video attached
              {pendingVideo.sizeBytes
                ? ` • ${(pendingVideo.sizeBytes / 1024 / 1024).toFixed(1)} MB`
                : ''}{' '}
              • Tap END to upload
            </Text>
          </View>
        )}

        {/* Upload progress */}
        {uploading && (
          <View
            style={{
              position: 'absolute',
              bottom: 120,
              left: 12,
              right: 12,
              backgroundColor: '#0f0f0f',
              padding: 12,
              borderRadius: 10,
            }}>
            <Text style={{color: '#fff', fontWeight: '700', marginBottom: 6}}>
              Uploading…
            </Text>
            <View
              style={{
                height: 6,
                backgroundColor: '#333',
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 6,
              }}>
              <View
                style={{
                  height: '100%',
                  width: `${percent || 1}%`,
                  backgroundColor: '#e11d48',
                }}
              />
            </View>
            <Text style={{color: '#ddd', fontSize: 12}}>
              {(uploadSent / 1024 / 1024).toFixed(2)} MB
              {uploadTotal
                ? ` / ${(uploadTotal / 1024 / 1024).toFixed(2)} MB`
                : ''}{' '}
              ({Math.floor(percent)}%)
            </Text>
          </View>
        )}
      </View>

      {/* Bottom info panel */}
      <View style={styles.locationInfoContainer}>
        {/* Project chip (no separate Change button) */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {/* 🟡 CHANGE: removed the dedicated "Change" button */}
        </View>

        {showTrackHistory && trackData.length > 0 ? (
          <ScrollView style={{maxHeight: 200}}>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 16,
                marginBottom: 10,
                textAlign: 'center',
              }}>
              Track History
            </Text>
            {trackData.map((track, index) => (
              <View
                key={index}
                style={{
                  marginBottom: 15,
                  padding: 10,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 8,
                }}>
                <Text
                  style={{fontWeight: '600', fontSize: 16, marginBottom: 5}}>
                  Track #{index + 1}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                  }}>
                  <Text>Duration: {track.duration}</Text>
                  <Text>Distance: {track.distance}</Text>
                  <Text>Speed: {track.speed} km/h</Text>
                </View>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: '#ddd',
                    marginVertical: 5,
                  }}
                />
                {track.locations.map((location, locIndex) => (
                  <Text key={locIndex} style={{marginVertical: 2}}>
                    • {location}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <>
            <View style={styles.locationInfoBox}>
              <View style={{flexDirection: 'row'}}>
                <Image style={styles.mapIcon} source={IMAGES.mapLocation} />
                <Text
                  style={[styles.locationInfoTitle, {marginLeft: SIZE.MS(5)}]}>
                  You are here
                </Text>
              </View>
              <View>
                <Text style={styles.distanceCss}>
                  {totalDistanceM >= 1000
                    ? (totalDistanceM / 1000).toFixed(2) + ' km'
                    : `${Math.round(totalDistanceM)} m`}
                </Text>
              </View>
            </View>
            <View>
              <Text
                style={[
                  styles.locationInfoText,
                  {
                    color: '#0a5fff',
                    textAlign: 'center',
                  },
                ]}>
                {userAddress || 'Tap to select project'}
              </Text>
            </View>
            {!selectedProjectId && (
              <Text
                style={{
                  textAlign: 'center',
                  marginTop: 6,
                  fontWeight: '600',
                  color: '#ef4444',
                }}>
                Select a project to start
              </Text>
            )}

            {nearestInfo && (
              <Text
                style={{textAlign: 'center', marginTop: 6, fontWeight: '600'}}>
                Nearest: {nearestInfo.which} • {shortMeters(nearestInfo.meters)}
              </Text>
            )}

            <View style={styles.bottomRow}>
              <TouchableOpacity
                style={[
                  styles.mediumButton,
                  {backgroundColor: '#FFA500'},
                  !(!!selectedProjectId || trackState === 'active')
                    ? {opacity: 0.6}
                    : null,
                ]}
                onPress={onPressResumePause}
                disabled={uploading}>
                <Text style={styles.btnTxt}>
                  {trackState === 'active'
                    ? 'PAUSE'
                    : trackState === 'idle'
                    ? 'START'
                    : 'RESUME'}
                </Text>
              </TouchableOpacity>

              <Text style={{fontWeight: '600'}}>
                {formatHMS(
                  trackState === 'ended' && finalElapsedMs != null
                    ? finalElapsedMs
                    : elapsedMs,
                )}
              </Text>
              <TouchableOpacity
                style={[styles.mediumButton, {backgroundColor: '#FF0000'}]}
                onPress={onPressEnd}
                disabled={uploading}>
                <Text style={styles.btnTxt}>END</Text>
              </TouchableOpacity>
            </View>
            {trackState === 'ended' && (
              <View
                style={{
                  marginTop: SIZE.MS(4),
                  padding: 10,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 8,
                }}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    marginBottom: 5,
                  }}>
                  Trip Summary
                </Text>
                <Text style={{textAlign: 'center'}}>
                  Time Taken: {formatHMS(finalElapsedMs ?? 0)}
                </Text>
                <Text style={{textAlign: 'center'}}>
                  Distance Covered: {kmFmt(totalDistanceM)}
                </Text>
                <Text style={{textAlign: 'center'}}>
                  Average Speed:{' '}
                  {(
                    totalDistanceM /
                    1000 /
                    ((finalElapsedMs ?? 1) / 3600000)
                  ).toFixed(2)}{' '}
                  km/h
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default MapComponent;
