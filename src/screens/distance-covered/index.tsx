// DistanceCovered.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type FC,
} from 'react';
import {
  View,
  Text,
  FlatList,
  DeviceEventEmitter,
  StyleSheet,
  Platform,
} from 'react-native';
import Geocoder from 'react-native-geocoder-reborn';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import type {LatLng} from 'react-native-maps';
import {TRACK_EVENT} from '../../../src/components/atoms/MapComponent/index';
import {SIZE, COLORS} from '@res';
import {Screen} from '@organisms';
import {ScreenProps} from '@types';
import {BackHeader} from '@molecules';
type RootStackParamList = {};
// ------------ utils ------------
const distMeters = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
};
const kmFmt = (m: number) => (m / 1000).toFixed(2);
type TrackEvent =
  | {
      type: 'new_leg';
      startedAt: number;
      start: LatLng;
      address?: string;
    }
  | {
      type: 'point';
      coord: LatLng;
      address?: string;
      timestamp: number;
    };
type TrackPoint = {
  coord: LatLng;
  timestamp: number;
  address?: string;
  deltaM?: number;
};
const MIN_POINT_DISTANCE = 3;
const DistanceCovered: FC<ScreenProps.DistanceCoveredTask> = ({}) => {
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const pointsRef = useRef<TrackPoint[]>([]);
  const [loading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const ensureAddress = useCallback(async (p: TrackPoint) => {
    if (p.address) return p.address;
    try {
      const results = await Geocoder.geocodePosition({
        lat: p.coord.latitude,
        lng: p.coord.longitude,
      });
      const r: any = results?.[0];
      const street = [r?.streetNumber, r?.streetName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const city = r?.locality || r?.subAdminArea || '';
      const region = r?.adminArea || '';
      const country = r?.country || '';
      const postal = r?.postalCode || '';
      const formatted =
        r?.formattedAddress ||
        [street, city, region, country, postal].filter(Boolean).join(', ');
      return formatted || undefined;
    } catch {
      return undefined;
    }
  }, []);

  const onEvent = useCallback(
    async (evt: TrackEvent) => {
      if (evt.type === 'new_leg') {
        setPoints([]);
        return;
      }

      if (evt.type === 'point') {
        const current = [...pointsRef.current];
        const newPoint: TrackPoint = {
          coord: evt.coord,
          timestamp: evt.timestamp,
          address: evt.address,
        };
        // lazy address fill
        if (!newPoint.address) {
          ensureAddress(newPoint).then(addr => {
            if (!addr) return;
            setPoints(prev => {
              const cp = [...prev];
              const idx = cp.findIndex(
                pp => pp.timestamp === newPoint.timestamp,
              );
              if (idx >= 0) {
                cp[idx] = {...cp[idx], address: addr};
                return cp;
              }
              return prev;
            });
          });
        }
        // ALWAYS append the point so lat/long refresh even < 3 m
        const prevP = current[current.length - 1];
        if (prevP) {
          const d = distMeters(prevP.coord, newPoint.coord);
          newPoint.deltaM = d >= MIN_POINT_DISTANCE ? d : 0;
        }
        current.push(newPoint);
        setPoints(current);
      }
    },
    [ensureAddress],
  );
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(TRACK_EVENT, onEvent);
    return () => {
      try {
        // @ts-ignore
        sub?.remove?.();
      } catch {}
    };
  }, [onEvent]);
  const totalDistance = useMemo(
    () => points.reduce((sum, p) => sum + (p.deltaM || 0), 0),
    [points],
  );
  const renderPoint = useCallback((p: TrackPoint, index: number) => {
    const addr = p.address || 'Address resolving…';
    const lat = p.coord.latitude.toFixed(6);
    const lon = p.coord.longitude.toFixed(6);

    return (
      <View key={`${p.timestamp}-${index}`} style={styles.pointRow}>
        <Text style={styles.pointAddr} numberOfLines={2}>
          {addr}
        </Text>
        <Text style={styles.pointCoords}>
          Latitude : {lat} | Longitude : {lon}
        </Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback(
    (p: TrackPoint, i: number) => `${p.timestamp}-${i}`,
    [],
  );

  const listEmpty = useMemo(
    () => (
      <View style={{padding: 16, alignItems: 'center'}}>
        <Text style={{opacity: 0.6}}>
          No points yet. Tap START on the map to begin tracking.
        </Text>
      </View>
    ),
    [],
  );

  const screenProps = useMemo(
    () => ({
      statusBgColor: COLORS.PRIMARY,
      preset: 'scroll' as const,
      loading,
    }),
    [loading],
  );

  return (
    <Screen {...screenProps}>
      <BackHeader
        headerTitle={'Distance Covered'}
        onBackPress={handleBackPress}
      />

      {/* Total summary */}
      <View style={{paddingHorizontal: 12, paddingTop: 6}}>
        <Text style={{fontWeight: '700'}}>
          Total Distance:{' '}
          {totalDistance >= 1000
            ? `${kmFmt(totalDistance)} km`
            : `${Math.round(totalDistance)} m`}
        </Text>
      </View>

      <FlatList
        data={points}
        keyExtractor={keyExtractor}
        renderItem={({item, index}) => renderPoint(item, index)}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{padding: 12, paddingBottom: 100}}
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={9}
      />
    </Screen>
  );
};
export default DistanceCovered;
// ---------------- styles ----------------
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F8FA'},
  topBar: {
    paddingTop: Platform.select({ios: 12, android: 8}),
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  title: {fontSize: 18, fontWeight: '700'},
  total: {fontSize: 16, fontWeight: '600', color: '#111827'},
  pointRow: {
    flexDirection: 'column',
    backgroundColor: COLORS.WHITE,
    elevation: 5,
    marginTop: SIZE.MS(8),
    borderRadius: SIZE.MS(12),
    paddingVertical: SIZE.MS(12),
    paddingHorizontal: SIZE.MS(12),
  },
  pointTime: {fontSize: 12, color: '#6b7280', marginTop: 6},
  pointAddr: {fontSize: SIZE.MS(14), color: COLORS.BLACK, fontWeight: '500'},
  pointCoords: {fontSize: SIZE.MS(12), color: COLORS.PRIMARY, marginTop: 2},

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'transparent',
  },
  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {color: '#fff', fontWeight: '700', fontSize: 16},
});
