import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import {COLORS, SIZE} from '@res';
import {RootStackParamList} from '@navigation/navigator';
import {
  getEmpComplaintDetails,
  selectTicketDetailById,
  selectTicketDetailError,
  selectTicketDetailLoading,
} from '@slices/tickets.slice';
import type {StoreDispatch, RootState} from '@reducers';
import type {TicketDetailsData} from '../../types/ticket.types';
import {Common} from '@utils';
/** ---------------- Types ---------------- */
type TicketDetailsRouteProp = RouteProp<RootStackParamList, 'TicketDetails'>;
type TicketDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TicketDetails'
>;

type Priority = 'high' | 'medium' | 'low';

/** ---------------- Utils (robust key mapping) ---------------- */
const toNumOrNull = (v: any): number | null => {
  const n =
    typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

const pick = <K extends string>(
  obj: any,
  keys: readonly K[],
  fallback: any = '',
): any => {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  }
  return fallback;
};

/** Parse "lat,lng" into numbers */
const parseLatLng = (s?: string | null): {lat: number; lng: number} | null => {
  if (!s) return null;
  const [a, b] = String(s)
    .split(',')
    .map(t => t.trim());
  if (!a || !b) return null;
  const lat = parseFloat(a);
  const lng = parseFloat(b);
  return Number.isFinite(lat) && Number.isFinite(lng) ? {lat, lng} : null;
};
/** Normalize whatever the backend returns into our UI shape */
function normalizeApiItem(item: any): TicketDetailsData {
  const parsed = parseLatLng(item?.latLng ?? item?.cutLocation); // try both keys
  console.log('tciketDetailsDataAPiItem:', {item});
  return {
    id: item.id,
    LinkId: item.complaintCode,
    linkName: item.routeName,
    linkDescription: '',
    customerName: '',
    circuitId: '',
    circuitFrom: '',
    circuitTo: '',
    assignId: item.assignTaskId,
    natureOfFault: item.alarmType,
    nearestChamber: '',
    cutLocation: item.latLng ?? item.cutLocation ?? '', // source of truth for directions if coords missing
    cutLat: parsed?.lat ?? null,
    cutLng: parsed?.lng ?? null,
    totalDistanceKm: item.totalDistance,
    cutDistanceKm: item.cutDistance,
    address: item.address,
    status: item.complaintStatus,
    contactPersonName: '',
    contactPersonMobile: '',
    assignedTo: '',
    assignedBy: item.createdByName,
    createdDate: String(
      pick(
        item,
        ['createdDate', 'created_date', 'createdAt', 'created_at'],
        new Date().toISOString(),
      ),
    ),
    remark: pick(item, ['remark', 'remarks', 'nocRemark'], ''),
    nocRemark: pick(item, ['nocRemark', 'noc_remark'], ''),
    closureRemark: pick(item, ['closureRemark', 'closure_remark'], ''),
    rfo: pick(item, ['rfo', 'reason_of_outage'], ''),
    priority:
      (String(pick(item, ['priority'], 'medium')).toLowerCase() as Priority) ||
      'medium',
    company: pick(item, ['company', 'companyName'], ''),
    isStarted: !!pick(item, ['isStarted', 'is_started', 'started'], false),
    otdrLength: String(pick(item, ['otdrLength', 'otdr_length'], '')),
    modeOfComplaint: String(
      pick(item, ['modeOfComplaint', 'mode_of_complaint'], ''),
    ),
  };
}

const TicketDetailsScreen: React.FC = () => {
  const dispatch = useDispatch<StoreDispatch>();
  const route = useRoute<TicketDetailsRouteProp>();
  const navigation = useNavigation<TicketDetailsNavigationProp>();
  const {ticketId} = route.params;

  // address state
  const [address, setAddress] = useState<string>('Fetching address...');

  const reduxDetail = useSelector((s: RootState) =>
    selectTicketDetailById(s, ticketId),
  );

  const loading = useSelector(selectTicketDetailLoading);
  const error = useSelector(selectTicketDetailError);

  // Local state fed from API res.item (normalized)
  const [ticketDetails, setTicketDetails] = useState<TicketDetailsData | null>(
    null,
  );

  // simple in-memory cache to avoid duplicate lookups within app session
  const addrCacheRef = useRef<Map<string, string>>(new Map());

  /**
   * Robust reverse-geocode via OpenStreetMap Nominatim (free)
   * IMPORTANT: Nominatim requires identifying your app/user-agent.
   * Replace the contact/email with your real support email if you want.
   */
  const getAddressFromLatLng = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        const cached = addrCacheRef.current.get(key);
        if (cached) {
          return cached;
        }

        // Build URL with addressdetails=0 to keep response smaller; you can set addressdetails=1 if you want components.
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
          String(lat),
        )}&lon=${encodeURIComponent(String(lng))}&format=json&addressdetails=0`;

        const headers: Record<string, string> = {
          // Nominatim requires a valid user-agent; include contact if you have one
          'User-Agent': 'GigaTelApp/1.0 (support@gigatel.in)',
          Accept: 'application/json',
        };

        const res = await fetch(url, {headers});
        if (!res.ok) {
          console.warn(
            '[Nominatim] non-ok response',
            res.status,
            await res.text().catch(() => '<no-body>'),
          );
          return 'Address not found';
        }
        const data: any = await res.json();
        const display = data?.display_name ?? null;
        const out = display || 'Address not found';
        addrCacheRef.current.set(key, out);
        return out;
      } catch (err) {
        console.error('Error fetching address (nominatim):', err);
        return 'Unable to fetch address';
      }
    },
    [],
  );

  const [activeTab, setActiveTab] = useState<
    'TICKET_DETAILS' | 'CONTACT_DETAILS'
  >('TICKET_DETAILS');

  const refetch = useCallback(() => {
    if (!ticketId) return;
    dispatch(getEmpComplaintDetails({id: ticketId, refresh: true}))
      .unwrap()
      .then((res: any) => {
        // IMPORTANT: take data from res.item
        const normalized = normalizeApiItem(res?.item ?? {});
        setTicketDetails(normalized);
      })
      .catch(() => {
        // leave error to redux selector
      });
  }, [dispatch, ticketId]);

  // Fetch on mount / id change
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Also accept redux detail updates (e.g., from cache or another screen)
  useEffect(() => {
    if (reduxDetail && typeof reduxDetail === 'object') {
      setTicketDetails(normalizeApiItem(reduxDetail));
    }
  }, [reduxDetail]);

  // When coordinates available, fetch address
  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      const lat = ticketDetails?.cutLat;
      const lng = ticketDetails?.cutLng;

      // If direct numeric coords not available, try parsing cutLocation
      let finalLat = lat;
      let finalLng = lng;
      if (
        (finalLat == null || finalLng == null) &&
        ticketDetails?.cutLocation
      ) {
        const parsed = parseLatLng(ticketDetails.cutLocation);
        if (parsed) {
          finalLat = parsed.lat;
          finalLng = parsed.lng;
        }
      }

      // guard: need finite numbers (allow 0)
      if (
        finalLat != null &&
        finalLng != null &&
        Number.isFinite(finalLat) &&
        Number.isFinite(finalLng)
      ) {
        setAddress('Fetching address...');
        try {
          const addr = await getAddressFromLatLng(finalLat, finalLng);
          if (!cancelled) setAddress(addr);
        } catch {
          if (!cancelled) setAddress('Unable to fetch address');
        }
      } else {
        setAddress('No coordinates available');
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [
    ticketDetails?.cutLat,
    ticketDetails?.cutLng,
    ticketDetails?.cutLocation,
    getAddressFromLatLng,
  ]);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = months[date.getMonth()];
      const hh = String(date.getHours()).padStart(2, '0');
      const mi = String(date.getMinutes()).padStart(2, '0');
      return `${dd}-${mm}  ${hh}:${mi}`;
    } catch {
      return dateStr;
    }
  };

  // TicketDetailsScreen.tsx
  const handleStart = () => {
    if (!ticketDetails) {
      console.warn('[handleStart] no ticketDetails yet');
      return;
    }

    // strip any non-serializable stuff just in case
    const payload = JSON.parse(JSON.stringify(ticketDetails));

    console.log('[TicketDetails -> navigate] sending:', {
      LinkId: payload.LinkId,
      linkName: payload.linkName,
      cutLocation: payload.cutLocation,
      cutLat: payload.cutLat,
      cutLng: payload.cutLng,
      assignID: payload.assignId,
    });

    navigation.navigate('StartTicketScreen', {
      from: 'ticket-details',
      ticket: payload,
    });
  };
  const handleUpdate = () => {};
  const handleClose = () => {
    if (!ticketDetails) {
      console.warn('[handleStart] no ticketDetails yet');
      return;
    }

    // strip any non-serializable stuff just in case
    const payload = JSON.parse(JSON.stringify(ticketDetails));

    console.log('[TicketDetails -> navigate] sending:', {
      LinkId: payload.LinkId,
      linkName: payload.linkName,
      cutLocation: payload.cutLocation,
      cutLat: payload.cutLat,
      cutLng: payload.cutLng,
      assignID: payload.assignId,
    });

    navigation.navigate('CloseTicketScreen', {
      from: 'ticket-details',
      ticket: payload,
    });
  };
  const getPriorityColor = (p: string) =>
    ({high: COLORS.ERROR, medium: COLORS.WARNING, low: COLORS.SUCCESS}[
      p?.toLowerCase()
    ] ?? COLORS.TEXT_MEDIUM);
  const getStatusColor = (s: string) =>
    ({
      assigned: COLORS.WARNING,
      started: COLORS.PRIMARY,
      completed: COLORS.SUCCESS,
    }[s?.toLowerCase()] ?? COLORS.TEXT_MEDIUM);

  /** ====== MAP HELPERS ======
   * Derive coords from cutLat/cutLng, else fallback to item.latLng
   */
  const coords = useMemo(() => {
    if (
      Number.isFinite(ticketDetails?.cutLat as any) &&
      Number.isFinite(ticketDetails?.cutLng as any)
    ) {
      return {
        lat: ticketDetails!.cutLat as number,
        lng: ticketDetails!.cutLng as number,
      };
    }
    return parseLatLng(ticketDetails?.cutLocation || null);
  }, [
    ticketDetails?.cutLat,
    ticketDetails?.cutLng,
    ticketDetails?.cutLocation,
  ]);

  const hasCoords = !!coords;

  // Return a reasonable search label when only text is available
  const getCutQuery = (): string => {
    const txt = (ticketDetails?.cutLocation || '').trim();
    if (txt && !parseLatLng(txt)) return txt; // not a pure "lat,lng" -> good as query
    return ticketDetails?.linkName || 'Location';
  };

  const safeOpen = async (url: string) => {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  };

  const openMapCenter = async (
    lat?: number | null,
    lng?: number | null,
    label?: string,
  ) => {
    const name = label || 'Location';
    if (Platform.OS === 'ios') {
      const canOpenGoogle = await Linking.canOpenURL('comgooglemaps://');
      if (lat != null && lng != null) {
        if (canOpenGoogle) {
          if (
            await safeOpen(
              `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=16`,
            )
          )
            return;
        }
        if (
          await safeOpen(
            `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(
              name,
            )}`,
          )
        )
          return;
        await safeOpen(
          `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=16`,
        );
        return;
      }
      if (canOpenGoogle) {
        if (await safeOpen(`comgooglemaps://?q=${encodeURIComponent(name)}`))
          return;
      }
      if (
        await safeOpen(`http://maps.apple.com/?q=${encodeURIComponent(name)}`)
      )
        return;
      await safeOpen(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          name,
        )}`,
      );
      return;
    }

    if (lat != null && lng != null) {
      await safeOpen(
        `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=16`,
      );
    } else {
      await safeOpen(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          name,
        )}`,
      );
    }
  };
  const openDirections = async (
    lat?: number | null,
    lng?: number | null,
    label?: string,
  ) => {
    const name = label || 'Destination';
    if (Platform.OS === 'ios') {
      const canOpenGoogle = await Linking.canOpenURL('comgooglemaps://');
      if (lat != null && lng != null) {
        if (canOpenGoogle) {
          if (
            await safeOpen(
              `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
            )
          )
            return;
        }
        if (
          await safeOpen(`http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`)
        )
          return;
        await safeOpen(
          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
        );
        return;
      }
      if (canOpenGoogle) {
        if (
          await safeOpen(
            `comgooglemaps://?daddr=${encodeURIComponent(
              name,
            )}&directionsmode=driving`,
          )
        )
          return;
      }
      if (
        await safeOpen(
          `http://maps.apple.com/?daddr=${encodeURIComponent(name)}&dirflg=d`,
        )
      )
        return;
      await safeOpen(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          name,
        )}&travelmode=driving`,
      );
      return;
    }

    if (lat != null && lng != null) {
      await safeOpen(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      );
    } else {
      await safeOpen(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          name,
        )}&travelmode=driving`,
      );
    }
  };
  const isStartDisabled =
    !!ticketDetails?.isStarted ||
    (ticketDetails?.status || '').trim().toLowerCase() === 'in progress';

  const handleViewOnMap = () =>
    openMapCenter(coords?.lat ?? null, coords?.lng ?? null, getCutQuery());
  const handleDirections = () => {
    const p = parseLatLng(ticketDetails?.cutLocation);
    const lat = p?.lat ?? coords?.lat ?? null;
    const lng = p?.lng ?? coords?.lng ?? null;
    openDirections(lat, lng, getCutQuery());
  };

  /** ---------------- Render ---------------- */
  if (loading && !ticketDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>G</Text>
            </View>
            <Text style={styles.headerTitle}>Ticket Details</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.networkIndicator} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if ((error && !ticketDetails) || !ticketDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>G</Text>
            </View>
            <Text style={styles.headerTitle}>Ticket Details</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.networkIndicator} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Ticket details not found'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={styles.headerTitle}>Ticket Details</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.networkIndicator} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Contact & Assignment Info */}
        <View style={styles.contactSection}>
          <View style={styles.contactRow}>
            <View style={styles.contactLeft}>
              <Text style={styles.ticketLabel}>
                {ticketDetails.LinkId || '—'}
              </Text>
              <Text style={styles.contactDate}>
                {formatDate(ticketDetails.createdDate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: getStatusColor(ticketDetails.status || '')},
                ]}>
                <Text style={styles.statusText}>
                  {(ticketDetails.status || '').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.contactRight}>
              <Text style={styles.assignedLabel}>Assigned by</Text>
              <Text style={styles.assignedName}>
                {ticketDetails.assignedBy}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsHeader}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'TICKET_DETAILS' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('TICKET_DETAILS')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'TICKET_DETAILS' && styles.activeTabText,
              ]}>
              Ticket Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'CONTACT_DETAILS' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('CONTACT_DETAILS')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'CONTACT_DETAILS' && styles.activeTabText,
              ]}>
              Contact Details
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'TICKET_DETAILS' ? (
          <View style={styles.tabContent}>
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Link ID</Text>
                <Text style={styles.detailValue}>{ticketDetails.LinkId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Link Name</Text>
                <Text style={styles.detailValue}>{ticketDetails.linkName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Fault Type</Text>
                <Text style={[styles.detailValue, {color: 'red'}]}>
                  {ticketDetails.natureOfFault}
                </Text>
              </View>

              {/* Cut Location + actions */}
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Cut Location</Text>
                <View style={styles.valueBlock}>
                  <Text style={styles.detailValue}>
                    {ticketDetails.address}
                  </Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={handleDirections}>
                      <Text style={styles.actionBtnText}>View on Map</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Total Distance</Text>
                <Text style={styles.detailValue}>
                  {Number(ticketDetails.totalDistanceKm).toFixed(3)} mtr
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Cut Distance</Text>
                <Text style={styles.detailValue}>
                  {ticketDetails.cutDistanceKm} mtr
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.contactDetailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Contact Name</Text>
                <Text style={styles.detailValue}>
                  {ticketDetails.contactPersonName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Contact Mobile</Text>
                <Text style={styles.detailValue}>
                  {ticketDetails.contactPersonMobile}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Status Change Section */}
        {/* Status Change Section */}
        {/* 🟩 Status Change Section */}
        {/* 🟩 Status Change Section */}
        {/* 🟩 Status Change Section */}
        <View style={styles.statusChangeSection}>
          <Text style={styles.statusChangeTitle}>
            Change ticket status below
          </Text>
          <View style={styles.statusButtons}>
            {(() => {
              const lowerStatus = (ticketDetails?.status || '')
                .trim()
                .toLowerCase();

              // 🟥 START button disabled for these statuses
              const isStartDisabled = [
                'closed by system',
                'task complete',
                'closed',
                'closed by splicer',
                'in progress',
              ].includes(lowerStatus);

              // 🟥 CLOSE button disabled for these statuses
              const isCloseDisabled = [
                'closed by system',
                'task complete',
                'closed',
                'closed by splicer',
              ].includes(lowerStatus);

              // 🟩 Change START label if status is "In Progress"
              const startButtonLabel =
                lowerStatus === 'in progress' ? 'START' : 'START';

              return (
                <>
                  {/* START / FOLLOWUP Button */}
                  <TouchableOpacity
                    style={[
                      styles.statusBtn,
                      styles.startBtn,
                      isStartDisabled && styles.disabledBtn,
                    ]}
                    onPress={handleStart}
                    disabled={isStartDisabled}>
                    <Text style={styles.statusBtnText}>{startButtonLabel}</Text>
                  </TouchableOpacity>

                  {/* CLOSE Button */}
                  <TouchableOpacity
                    style={[
                      styles.statusBtn,
                      styles.closeBtn,
                      isCloseDisabled && styles.disabledBtn,
                    ]}
                    onPress={handleClose}
                    disabled={isCloseDisabled}>
                    <Text style={styles.statusBtnText}>CLOSE</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>

        {/* Info Card */}
        {/* <View style={styles.contactDetailsCard}>
          <View style={styles.contactCardHeader}>
            <Text style={styles.contactCardTitle}>
              By: {ticketDetails.assignedBy || 'NOC'}
            </Text>
          </View>
          <View style={styles.contactCardContent}>
            <Text style={styles.contactCardLabel}>Location</Text>
            <Text style={styles.contactCardValue}>
              {ticketDetails.nearestChamber}
            </Text>

            <Text style={styles.contactCardLabel}>Remark</Text>
            <Text style={styles.contactCardValue}>{ticketDetails.remark}</Text>
          </View>
        </View> */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

/** ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.BACKGROUND_DEFAULT},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(20),
    elevation: 4,
  },
  ticketLabel: {color: COLORS.BLACK, fontSize: SIZE.MS(16)},
  backButton: {padding: SIZE.MS(8)},
  backText: {color: COLORS.WHITE, fontSize: SIZE.MS(20), fontWeight: 'bold'},
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SIZE.MS(28),
    height: SIZE.MS(28),
    borderRadius: SIZE.MS(14),
    backgroundColor: COLORS.WARNING,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZE.MS(8),
  },
  logoText: {
    color: COLORS.TEXT_DARKER,
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
  },
  headerTitle: {color: COLORS.WHITE, fontSize: SIZE.MS(18), fontWeight: 'bold'},
  headerRight: {width: SIZE.MS(32), alignItems: 'flex-end'},
  networkIndicator: {
    width: SIZE.MS(8),
    height: SIZE.MS(8),
    borderRadius: SIZE.MS(4),
    backgroundColor: COLORS.SUCCESS,
  },

  scrollView: {flex: 1},

  contactSection: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
    justifyContent: 'space-between',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactLeft: {alignItems: 'flex-start'},
  contactDate: {fontSize: SIZE.MS(12), color: COLORS.TEXT_DARK},
  contactRight: {alignItems: 'flex-end'},
  assignedLabel: {
    fontSize: SIZE.MS(10),
    color: COLORS.TEXT_MEDIUM,
    marginBottom: SIZE.MVS(2),
  },
  assignedName: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_DARK,
    fontWeight: 'bold',
  },

  purpleLabel: {
    width: SIZE.MS(110),
    fontSize: SIZE.MS(12),
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginRight: SIZE.MS(6),
  },
  tabsHeader: {flexDirection: 'row', backgroundColor: COLORS.PRIMARY},
  tab: {
    flex: 1,
    paddingVertical: SIZE.MVS(12),
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomWidth: 3,
    borderBottomColor: '#FFB300',
  },
  tabText: {color: COLORS.WHITE, fontSize: SIZE.MS(14), fontWeight: '500'},
  activeTabText: {color: COLORS.WHITE, fontWeight: 'bold'},

  tabContent: {backgroundColor: COLORS.WHITE, minHeight: SIZE.MVS(200)},
  detailsSection: {
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(16),
  },
  contactDetailsSection: {
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(40),
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZE.MVS(12),
    minHeight: SIZE.MVS(24),
  },
  detailValue: {
    flex: 1,
    fontSize: SIZE.MS(13),
    color: COLORS.TEXT_DARKER,
    fontWeight: '500',
    letterSpacing: 0.2,
    paddingVertical: SIZE.MVS(2),
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: SIZE.MS(4),
    borderLeftWidth: 2,
    borderLeftColor: COLORS.PRIMARY + '33',
    paddingLeft: SIZE.MS(7),
  },
  valueBlock: {flex: 1},

  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZE.MS(8),
    marginTop: SIZE.MVS(8),
  },
  actionBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(10),
    paddingVertical: SIZE.MVS(6),
    borderRadius: SIZE.MS(6),
  },
  actionBtnText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(11),
    fontWeight: '700',
  },

  statusBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: SIZE.MS(8),
    paddingVertical: SIZE.MVS(4),
    borderRadius: SIZE.MS(4),
  },
  statusText: {color: COLORS.WHITE, fontSize: SIZE.MS(10), fontWeight: 'bold'},

  statusChangeSection: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(16),
    marginTop: SIZE.MVS(8),
  },
  statusChangeTitle: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARKER,
    fontWeight: 'bold',
    marginBottom: SIZE.MVS(16),
  },
  statusButtons: {flexDirection: 'row', gap: SIZE.MS(12)},
  statusBtn: {
    flex: 1,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
  },
  startBtn: {backgroundColor: COLORS.SUCCESS},
  updateBtn: {backgroundColor: COLORS.WARNING},
  closeBtn: {backgroundColor: COLORS.ERROR},
  disabledBtn: {backgroundColor: COLORS.DISABLED},
  statusBtnText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },

  contactDetailsCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SIZE.MS(16),
    marginTop: SIZE.MVS(16),
    borderRadius: SIZE.MS(8),
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    elevation: 2,
  },
  contactCardHeader: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(8),
    borderTopLeftRadius: SIZE.MS(6),
    borderTopRightRadius: SIZE.MS(6),
  },
  contactCardTitle: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },
  contactCardContent: {padding: SIZE.MS(16)},
  contactCardLabel: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_MEDIUM,
    fontWeight: 'bold',
    marginBottom: SIZE.MVS(4),
    marginTop: SIZE.MVS(8),
  },
  contactCardValue: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_DARK,
    lineHeight: SIZE.MS(16),
  },

  bottomSpacing: {height: SIZE.MVS(32)},

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  loadingText: {
    marginTop: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
    fontSize: SIZE.MS(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
    paddingHorizontal: SIZE.MS(32),
  },
  errorText: {
    color: COLORS.TEXT_MEDIUM,
    fontSize: SIZE.MS(16),
    textAlign: 'center',
    marginBottom: SIZE.MVS(16),
  },
  retryBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(24),
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(8),
  },
  retryText: {color: COLORS.WHITE, fontSize: SIZE.MS(14), fontWeight: 'bold'},
});

export default TicketDetailsScreen;
