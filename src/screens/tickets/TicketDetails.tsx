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
  const parsed = parseLatLng(item?.latLng ?? item?.cutLocation);
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

  const [travelElapsed, setTravelElapsed] = useState('00:00:00');
  /* -------- reverse geocode helper (no hooks inside conditions) -------- */
  // Call this function after API success
  const processStatusList = (statusList: any[]) => {
    if (!statusList) return;

    const startStatus = statusList.find(s => s.status === 'Start');

    if (startStatus?.statusUpdatedOn) {
      console.log('⏳ Travel Start Time Found:', startStatus.statusUpdatedOn);
      setTravelStartTime(new Date(startStatus.statusUpdatedOn));
    }
  };

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
  /* ---------------- refetch (API) ---------------- */
  const refetch = useCallback(() => {
    dispatch(getEmpComplaintDetails({id: ticketId, refresh: true}))
      .unwrap()
      .then((res: any) => {
        const formData = res?.item?.formData;
        const statusList = res?.item?.statusList;

        // ⭐ FIX — Start status से SLA time set करो
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
  // Timer Logic
  useEffect(() => {
    let interval: any;

    if (travelStartTime) {
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

    return () => clearInterval(interval);
  }, [travelStartTime]);

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

  /* ---------------- Derived values (no hooks below this) ---------------- */

  const status = (ticketDetails?.status || '').toLowerCase().trim();

  const showAck = status === 'assigned';
  const showTravelStart = status === 'acknowledge';
  const showActivityStart =
    status === 'travel started' || status === 'in progress';
  const disableClose = [
    'closed',
    'task complete',
    'closed by splicer',
  ].includes(status);

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

  const getStatusColor = (s: string) =>
    ({
      assigned: COLORS.WARNING,
      started: COLORS.PRIMARY,
      completed: COLORS.SUCCESS,
    }[s?.toLowerCase()] ?? COLORS.TEXT_MEDIUM);

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

  /* ---------------- Handlers (no hooks inside) ---------------- */

  const handleStart = () => {
    if (!ticketDetails) return;
    const payload = JSON.parse(JSON.stringify(ticketDetails));
    navigation.navigate('StartTicketScreen', {
      from: 'ticket-details',
      ticket: payload,
    });
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
        setTravelStartTime(Date.now()); // ⬅️ TIMER START HERE
        refetch();
      })
      .catch(err => Common.showToast(err?.message ?? 'Travel start failed!'));
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
  const handleClose = () => {
    if (!ticketDetails) return;
    const payload = JSON.parse(JSON.stringify(ticketDetails));
    navigation.navigate('CloseTicketScreen', {
      from: 'ticket-details',
      ticket: payload,
    });
  };

  /* ---------------- EARLY RETURNS (AFTER ALL HOOKS!) ---------------- */

  if (loading && !ticketDetails) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading ticket details...</Text>
      </SafeAreaView>
    );
  }

  if (error && !ticketDetails) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.errorText}>{error || 'Unable to load ticket'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!ticketDetails) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.errorText}>Ticket not found</Text>
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

              {/* CUT LOCATION */}
              <View style={styles.detailRow}>
                <Text style={styles.purpleLabel}>Cut Location</Text>
                <View style={styles.valueBlock}>
                  <Text style={styles.detailValue}>
                    {/* API वाला address + resolved address दोनों में से जो चाहिए वो रख सकते हो */}
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

        {/* STATUS SECTION */}
        <View style={styles.statusChangeSection}>
          <Text style={styles.statusChangeTitle}>
            Change ticket status below
          </Text>

          <View style={styles.statusButtons}>
            {showAck && (
              <TouchableOpacity
                style={[styles.statusBtn, styles.startBtn]}
                onPress={handleAcknowledge}>
                <Text style={styles.statusBtnText}>Acknowledge</Text>
              </TouchableOpacity>
            )}

            {showTravelStart && (
              <TouchableOpacity
                style={[styles.statusBtn, styles.updateBtn]}
                onPress={handleTravelStart}>
                <Text style={styles.statusBtnText}>Travel Start</Text>
              </TouchableOpacity>
            )}

            {showActivityStart && (
              <TouchableOpacity
                style={[styles.statusBtn, styles.startBtn]}
                onPress={handleStart}>
                <Text style={styles.statusBtnText}>Activity Start</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.statusBtn,
                styles.closeBtn,
                disableClose && styles.disabledBtn,
              ]}
              disabled={disableClose}
              onPress={handleClose}>
              <Text style={styles.statusBtnText}>Activity Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
        {travelStartTime && (
          <View
            style={{
              backgroundColor: COLORS.WHITE,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginTop: 10,
              borderWidth: 2,
              borderColor: COLORS.PRIMARY,
              borderRadius: 8,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 18,
                color: COLORS.PRIMARY,
                fontWeight: 'bold',
              }}>
              Travel SLA Time
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 24,
                color: COLORS.SUCCESS,
                fontWeight: 'bold',
              }}>
              {travelTimer}
            </Text>
          </View>
        )}
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

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
    paddingHorizontal: SIZE.MS(32),
  },
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
