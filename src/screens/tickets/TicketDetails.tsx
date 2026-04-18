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
  acknowledgeApi,
  travelStartApi,
  travelStopApi,
} from '@slices/tickets.slice';
import type {StoreDispatch, RootState} from '@reducers';
import type {TicketDetailsData} from '../../types/ticket.types';
import {Common} from '@utils';
/* ---------------- Types ---------------- */
type TicketDetailsRouteProp = RouteProp<RootStackParamList, 'TicketDetails'>;
type TicketDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TicketDetails'
>;
type Priority = 'high' | 'medium' | 'low';
/* ---------------- Utils ---------------- */
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
function normalizeApiItem(item: any): TicketDetailsData {
  console.log('normalizeApiItem:', {item});
  const parsed = parseLatLng(item?.latLng ?? item?.cutLocation);
  return {
    id: item.id,
    LinkId: item.complaintCode,
    priorityType: item.priorityType,
    deviceName: item.deviceName,
    specificProblem: item.specificProblem,
    alarmDispName: item.alarmDispName,
    linkName: item.routeName,
    zoneCode: item.zoneCode,
    primaryLandmarkAfterName: item.primaryLandmarkAfterName,
    secondaryLandmarkAfterName: item.secondaryLandmarkAfterName,
    linkDescription: '',
    customerName: '',
    circuitId: '',
    circuitFrom: '',
    circuitTo: '',
    assignId: item.assignTaskId,
    natureOfFault: item.alarmType,
    nmsType: item.nmsType,
    popLocation: item.popLocation, //added
    nearestChamber: '',
    cutLocation: item.latLng ?? item.cutLocation ?? '',
    cutLat: parsed?.lat ?? null,
    cutLng: parsed?.lng ?? null,
    totalDistanceKm: item.totalDistance,
    cutDistanceKm: item.cutDistance,
    address: item.address,
    status: item.complaintStatus,
    contactPersonName: '',
    contactPersonMobile: '',
    assignedTo: '',
    assignedBy: item.assignedByName,
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
/* ---------------- Component ---------------- */
const TicketDetailsScreen: React.FC = () => {
  const dispatch = useDispatch<StoreDispatch>();
  const route = useRoute<TicketDetailsRouteProp>();
  const navigation = useNavigation<TicketDetailsNavigationProp>();
  const {ticketId} = route.params;
  // tabs
  const [activeTab, setActiveTab] = useState<
    'TICKET_DETAILS' | 'CONTACT_DETAILS'
  >('TICKET_DETAILS');
  const [address, setAddress] = useState<string>('Fetching address...');
  const addrCacheRef = useRef<Map<string, string>>(new Map());
  // redux selectors
  const reduxDetail = useSelector((s: RootState) =>
    selectTicketDetailById(s, ticketId),
  );
  const loading = useSelector(selectTicketDetailLoading);
  const error = useSelector(selectTicketDetailError);
  // local ticket state
  const [ticketDetails, setTicketDetails] = useState<TicketDetailsData | null>(
    null,
  );
  const [travelStartTime, setTravelStartTime] = useState<Date | null>(null);
  const [travelTimer, setTravelTimer] = useState('00:00:00');
  const [isTravelActive, setIsTravelActive] = useState(false);
  /* -------- Process Status List -------- */
  const processStatusList = (statusList: any[]) => {
    if (!statusList || !Array.isArray(statusList)) return;
    // Find "Start" status (Travel Start)
    const startStatus = statusList.find(s => {
      const st = s.status?.toLowerCase().trim();
      return st === 'start' || st === 'travel start';
    });
    // Find "Stop" status (Travel Stop)
    const stopStatus = statusList.find(s => s.status?.toLowerCase() === 'stop');
    if (startStatus?.statusUpdatedOn && !stopStatus) {
      // Travel started and not stopped yet
      console.log('⏳ Travel Start Time Found:', startStatus.statusUpdatedOn);
      setTravelStartTime(new Date(startStatus.statusUpdatedOn));
      setIsTravelActive(true);
    } else if (stopStatus) {
      // Travel has been stopped
      console.log('🛑 Travel Stopped');
      setIsTravelActive(false);
      setTravelStartTime(null);
    }
  };
  /* -------- Reverse Geocode Helper -------- */
  const getAddressFromLatLng = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        const cached = addrCacheRef.current.get(key);
        if (cached) return cached;
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=0`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'GigaTelApp/1.0 (support@gigatel.in)',
            Accept: 'application/json',
          },
        });
        if (!res.ok) {
          return 'Address not found';
        }
        const data: any = await res.json();
        const display = data?.display_name ?? null;
        const out = display || 'Address not found';
        addrCacheRef.current.set(key, out);
        return out;
      } catch {
        return 'Unable to fetch address';
      }
    },
    [],
  );
  /* ---------------- Refetch (API) ---------------- */
  const refetch = useCallback(() => {
    dispatch(getEmpComplaintDetails({id: ticketId, refresh: true}))
      .unwrap()
      .then((res: any) => {
        const formData = res?.item?.formData;
        const statusList = res?.item?.statusList;

        // Process status list for travel timer
        if (statusList && Array.isArray(statusList)) {
          processStatusList(statusList);
        }

        // normalize
        const normalized = normalizeApiItem(formData ?? {});
        setTicketDetails(normalized);
      })
      .catch(() => {});
  }, [dispatch, ticketId]);
  /* ---------------- Effects (ALWAYS before any return) ---------------- */
  // on mount / id change
  useEffect(() => {
    refetch();
  }, [refetch]);
  // Timer Logic - Only runs when travel is active
  useEffect(() => {
    let interval: any;
    if (travelStartTime && isTravelActive) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - travelStartTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTravelTimer(
          `${hours.toString().padStart(2, '0')}:` +
            `${minutes.toString().padStart(2, '0')}:` +
            `${seconds.toString().padStart(2, '0')}`,
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [travelStartTime, isTravelActive]);
  // redux detail से sync
  useEffect(() => {
    if (reduxDetail && typeof reduxDetail === 'object') {
      setTicketDetails(normalizeApiItem(reduxDetail));
    }
  }, [reduxDetail]);
  // address resolve
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!ticketDetails) {
        setAddress('No coordinates available');
        return;
      }
      let lat = ticketDetails.cutLat;
      let lng = ticketDetails.cutLng;

      if ((lat == null || lng == null) && ticketDetails.cutLocation) {
        const parsed = parseLatLng(ticketDetails.cutLocation);
        if (parsed) {
          lat = parsed.lat;
          lng = parsed.lng;
        }
      }
      if (
        lat != null &&
        lng != null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {
        setAddress('Fetching address...');
        const addr = await getAddressFromLatLng(lat, lng);
        if (!cancelled) setAddress(addr);
      } else {
        if (!cancelled) setAddress('No coordinates available');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [ticketDetails, getAddressFromLatLng]);
  const status = (ticketDetails?.status || '').toLowerCase().trim();
  // LATEST STATUS FROM STATUS LIST

  const latestStatus = useMemo(() => {
    const list = reduxDetail?.statusList;
    if (!list || !Array.isArray(list) || list.length === 0) return null;
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.statusUpdatedOn).getTime() -
        new Date(a.statusUpdatedOn).getTime(),
    );
    return sorted[0]?.status?.toLowerCase().trim() || null;
  }, [reduxDetail]);
  /* ---------------- Derived values (no hooks below this) ---------------- */
  const showAcknowledge = status === 'assigned';
  const showTravelStart = status === 'acknowledge';
  const showTravelStop = status === 'travel start' || status === 'start';
  const showActivityStartAndHold =
    status === 'travel stop' || status === 'stop';
  const showActivityStartAndClose = status === 'ticket hold';
  const showOnlyActivityCloseAndHold = status === 'in progress';
  const disableAllButtons =
    status === 'closed by system' ||
    status === 'closed by splicer' ||
    status === 'task complete';
  const coords = useMemo(() => {
    if (
      ticketDetails?.cutLat != null &&
      ticketDetails?.cutLng != null &&
      Number.isFinite(ticketDetails.cutLat) &&
      Number.isFinite(ticketDetails.cutLng)
    ) {
      return {
        lat: ticketDetails.cutLat as number,
        lng: ticketDetails.cutLng as number,
      };
    }
    return parseLatLng(ticketDetails?.cutLocation || null);
  }, [
    ticketDetails?.cutLat,
    ticketDetails?.cutLng,
    ticketDetails?.cutLocation,
  ]);
  const getStatusColor = (s: string = '') => {
    const status = s.toLowerCase().trim();

    if (status === 'initial') return COLORS.PRIMARY; // BLUE
    if (status === 'assigned') return COLORS.SUCCESS; // GREEN
    if (status === 'acknowledge') return COLORS.SUCCESS; // GREEN
    if (status === 'travel start' || status === 'start') return COLORS.SUCCESS; // GREEN
    if (status === 'travel stop' || status === 'stop')
      return COLORS.ACCENT_ORANGE; // ORANGE
    if (status === 'ticket hold') return COLORS.ACCENT_ORANGE; // VIOLET
    if (status === 'in progress') return COLORS.SUCCESS; // GREEN
    if (
      status === 'closed by system' ||
      status === 'closed by splicer' ||
      status === 'task complete'
    )
      return COLORS.ERROR; // RED
    return COLORS.TEXT_MEDIUM; // DEFAULT GREY
  };

  const getCutQuery = (): string => {
    const txt = (ticketDetails?.cutLocation || '').trim();
    if (txt && !parseLatLng(txt)) return txt;
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
  const openDirections = async () => {
    const label = getCutQuery();
    const p = coords;
    if (!p) {
      await safeOpen(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          label,
        )}`,
      );
      return;
    }
    await safeOpen(
      `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`,
    );
  };
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
  const handleAcknowledge = () => {
    if (!ticketDetails) return;
    dispatch(
      acknowledgeApi({
        assignTaskId: ticketDetails.assignId,
        status: 'Acknowledge',
      }),
    )
      .unwrap()
      .then(() => {
        Common.showToast('Ticket acknowledged successfully!');
        refetch();
      })
      .catch(err => Common.showToast(err?.message ?? 'Acknowledge failed!'));
  };
  const handleTravelStart = () => {
    if (!ticketDetails) return;
    dispatch(
      travelStartApi({
        assignTaskId: ticketDetails.assignId,
      }),
    )
      .unwrap()
      .then(() => {
        Common.showToast('Travel started!');
        setTravelStartTime(new Date());
        setIsTravelActive(true);
        refetch();
      })
      .catch(err => Common.showToast(err?.message ?? 'Travel start failed!'));
  };
  const handleTravelStop = () => {
    if (!ticketDetails) return;
    dispatch(
      travelStopApi({
        assignTaskId: ticketDetails.assignId,
      }),
    )
      .unwrap()
      .then(() => {
        Common.showToast('Travel stopped!');
        setIsTravelActive(false);
        refetch();
      })
      .catch(err => Common.showToast(err?.message ?? 'Travel start failed!'));
  };
  const handleActivityStart = () => {
    if (!ticketDetails) return;
    const payload = JSON.parse(JSON.stringify(ticketDetails));
    navigation.navigate('StartTicketScreen', {
      from: 'ticket-details',
      ticket: payload,
    });
  };
  const handleActivityClose = () => {
    if (!ticketDetails) return;
    const payload = JSON.parse(JSON.stringify(ticketDetails));
    navigation.navigate('CloseTicketScreen', {
      from: 'ticket-details',
      ticket: payload,
    });
  };
  const handleTicketHold = () => {
    if (!ticketDetails) return;
    const payload = JSON.parse(JSON.stringify(ticketDetails));
    navigation.navigate('HoldTicketScreen', {
      from: 'ticket-details',
      ticket: payload,
    });
  };
  /* ---------------- EARLY RETURNS (AFTER ALL HOOKS!) ---------------- */
  // 1. Show loader when initial loading
  if (loading && !ticketDetails) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Fetching ticket details...</Text>
      </SafeAreaView>
    );
  }
  // 2. Show error only when API fails AND we never got any data
  if (error && !ticketDetails) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.errorText}>
          {error || 'Unable to fetch ticket details'}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  // 3. Only if API returned empty or invalid data
  if (!loading && !ticketDetails) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Fetching data…</Text>
      </SafeAreaView>
    );
  }

  /* ---------------- Main Render ---------------- */
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
      {/* MAIN SCROLL */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Contact Section */}
        <View style={styles.contactSection}>
          <View style={styles.contactRow}>
            <View style={styles.contactLeft}>
              <Text style={styles.ticketLabel}>{ticketDetails.LinkId}</Text>
              <Text style={styles.contactDate}>
                {formatDate(ticketDetails.createdDate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: getStatusColor(ticketDetails.status)},
                ]}>
                <Text style={styles.statusText}>
                  {String(ticketDetails.status).toUpperCase()}
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
        {/* TAB CONTENT */}
        {activeTab === 'TICKET_DETAILS' ? (
          <View style={styles.tabContent}>
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Complaint ID</Text>
                <Text style={styles.detailValue}>{ticketDetails.LinkId}</Text>
              </View>
                <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Priority</Text>
                <Text style={[styles.detailValue, {color: 'red'}]}>
                  {ticketDetails.priorityType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Source Type</Text>
                <Text style={styles.detailValue}>{ticketDetails?.nmsType}</Text>
              </View>
               <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Specific Problem</Text>
                <Text style={styles.detailValue}>{ticketDetails.specificProblem}</Text>
              </View>
               <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Alarm Display Name</Text>
                <Text style={styles.detailValue}>{ticketDetails.alarmDispName}</Text>
              </View>
               <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Device Name</Text>
                <Text style={[styles.detailValue, {color: 'red'}]}>
                  {ticketDetails.deviceName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Grahm Panchayat</Text>
                <Text style={[styles.detailValue, ]}>
                  {ticketDetails?.popLocation}
                </Text>
              </View>
               <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>District</Text>
                <Text style={styles.detailValue}>{ticketDetails.secondaryLandmarkAfterName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Zone</Text>
                <Text style={[styles.detailValue, {color: 'red'}]}>
                  {ticketDetails.zoneCode}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Block</Text>
                <Text style={[styles.detailValue, {color: 'red'}]}>
                  {ticketDetails.primaryLandmarkAfterName}
                </Text>
              </View>


              {/* CUT LOCATION */}
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Address</Text>
                <View style={styles.valueBlock}>
                  <Text style={styles.detailValue}>
                    {ticketDetails.address || address}
                  </Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={openDirections}>
                      <Text style={styles.actionBtnText}>View on Map</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
             
              {/* <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Device Name</Text>
                <Text style={styles.detailValue}>
                  {Number(ticketDetails.totalDistanceKm).toFixed(3)} mtr
                </Text>
              </View> */}
              {/* <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Issue Type</Text>
                <Text style={styles.detailValue}>
                  {ticketDetails.cutDistanceKm} mtr
                </Text>
              </View> */}
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.contactDetailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Contact Name</Text>
                <Text style={styles.detailValue}>
                  {ticketDetails.contactPersonName || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Contact Mobile</Text>
                <Text style={styles.detailValue}>
                  {ticketDetails.contactPersonMobile || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        )}
        {/* STATUS SECTION */}
        <View style={styles.statusChangeSection}>
          <Text style={styles.statusChangeTitle}>
            Change ticket status below
          </Text>
          <View style={styles.statusButtons}>
            {/* 1. Acknowledge Button - Show when status is "Assigned" */}
            {showAcknowledge && !disableAllButtons && (
              <TouchableOpacity
                style={[styles.statusBtn, styles.acknowledgeBtn]}
                onPress={handleAcknowledge}>
                <Text style={styles.statusBtnText}>Acknowledge</Text>
              </TouchableOpacity>
            )}
            {/* 2. Travel Start Button - Show when status is "Acknowledge" */}
            {showTravelStart && !disableAllButtons && (
              <TouchableOpacity
                style={[styles.statusBtn, styles.travelStartBtn]}
                onPress={handleTravelStart}>
                <Text style={styles.statusBtnText}>Travel Start</Text>
              </TouchableOpacity>
            )}
            {/* 3. Travel Stop Button - Show when status is "Start" */}
            {showTravelStop && !disableAllButtons && (
              <TouchableOpacity
                style={[styles.statusBtn, styles.travelStopBtn]}
                onPress={handleTravelStop}>
                <Text style={styles.statusBtnText}>Travel Stop</Text>
              </TouchableOpacity>
            )}
            {/* 4. Activity Start & Close - Show when status is "Stop" */}
            {showActivityStartAndHold && !disableAllButtons && (
              <>
                <TouchableOpacity
                  style={[styles.statusBtn, styles.activityStartBtn]}
                  onPress={handleActivityStart}>
                  <Text style={styles.statusBtnText}>Activity Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, styles.activityHoldBtn]}
                  onPress={handleTicketHold}>
                  <Text style={styles.statusBtnText}>Ticket Hold</Text>
                </TouchableOpacity>
              </>
            )}
            {showActivityStartAndClose && !disableAllButtons && (
              <>
                <TouchableOpacity
                  style={[styles.statusBtn, styles.activityStartBtn]}
                  onPress={handleActivityStart}>
                  <Text style={styles.statusBtnText}>Activity Restart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, styles.activityCloseBtn]}
                  onPress={handleActivityClose}>
                  <Text style={styles.statusBtnText}>Activity Close</Text>
                </TouchableOpacity>
              </>
            )}
            {showOnlyActivityCloseAndHold && !disableAllButtons && (
              <>
                <TouchableOpacity
                  style={[styles.statusBtn, styles.activityCloseBtn]}
                  onPress={handleActivityClose}>
                  <Text style={styles.statusBtnText}>Activity Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, styles.activityHoldBtn]}
                  onPress={handleTicketHold}>
                  <Text style={styles.statusBtnText}>Ticket Hold</Text>
                </TouchableOpacity>
              </>
            )}
            {disableAllButtons && (
              <View style={styles.disabledMessage}>
                <Text style={styles.disabledMessageText}>✓ Ticket Closed</Text>
              </View>
            )}
            {/* Show disabled message if ticket is closed */}
          </View>
        </View>
        {/* {(status === 'travel start' || status === 'start') &&
          (latestStatus === 'travel start' || latestStatus === 'start') && (
            <View style={styles.timerCard}>
              <Text style={styles.timerTitle}>🚗 Travel SLA Time</Text>
              <Text style={styles.timerValue}>{travelTimer}</Text>
            </View>
          )} */}
        {/* Show timer only when status AND latestStatus are Travel Start */}
        {(status === 'travel start' || status === 'start') &&
          (latestStatus === 'travel start' || latestStatus === 'start') && (
            <View style={styles.timerCard}>
              <Text style={styles.timerTitle}>🚗 Travel SLA Time</Text>
              {travelTimer === '00:00:00' ? (
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              ) : (
                <Text style={styles.timerValue}>{travelTimer}</Text>
              )}
            </View>
          )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};
/* ---------------- Styles ---------------- */
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
  ticketLabel: {color: COLORS.BLACK, fontSize: SIZE.MS(16), fontWeight: 'bold'},
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

  timerCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SIZE.MS(16),
    marginTop: SIZE.MVS(12),
    paddingVertical: SIZE.MVS(16),
    paddingHorizontal: SIZE.MS(20),
    borderRadius: SIZE.MS(8),
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    alignItems: 'center',
    elevation: 3,
  },
  timerTitle: {
    fontSize: SIZE.MS(16),
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SIZE.MVS(8),
  },
  timerValue: {
    fontSize: SIZE.MS(32),
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    marginTop: SIZE.MVS(8),
  },
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
  activityHoldBtn: {
    backgroundColor: '#FF9800', // Orange (Hold Button Theme)
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
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZE.MS(12),
  },
  statusBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
    elevation: 2,
  },
  acknowledgeBtn: {backgroundColor: '#2196F3'},
  travelStartBtn: {backgroundColor: '#4CAF50'},
  travelStopBtn: {backgroundColor: '#FF9800'},
  activityStartBtn: {backgroundColor: '#9C27B0'},
  activityCloseBtn: {backgroundColor: COLORS.ERROR},
  statusBtnText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },
  disabledMessage: {
    flex: 1,
    paddingVertical: SIZE.MVS(16),
    alignItems: 'center',
  },
  disabledMessageText: {
    color: COLORS.SUCCESS,
    fontSize: SIZE.MS(14),
    fontWeight: 'bold',
  },
  bottomSpacing: {height: SIZE.MVS(32)},
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.TEXT_MEDIUM,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
});
export default TicketDetailsScreen;
