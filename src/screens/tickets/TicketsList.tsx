import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {getEmpComplaintsByDate} from '../../store/slices/tickets.slice';
import {RootStackParamList} from '@navigation/navigator';
import {COLORS, SIZE} from '@res';
import {Screen} from '@organisms';
import {useTranslation} from 'react-i18next';
import DatePicker from 'react-native-date-picker';
import {useDispatch} from 'react-redux';

type TicketsListNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TicketsList'
>;

type Ticket = {
  id: string | number;
  transactionNo: string;
  assignedDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'Assigned' | 'In Progress' | 'Closed By Splicer' | string;
  customerName: string;
  circuitId?: string;
  natureOfFault?: string;
  circuitFrom?: string;
  circuitTo?: string;
  remark?: string;
  assignedBy?: string;
  assignedTo?: string;
  linkName?: string;
  pathLocation?: string;
  closedOnSplierSystem?: string; // ✅ added
};

type ApiTicketItem = {
  id: number;
  complaintCode: string;
  routeName: string;
  alarmType: string;
  totalDistance: number;
  cutDistance: number;
  latLng: string;
  status: string;
  statusUpdatedOn: string | null;
  statusUpdatedByName: string | null;
  assignedByName: string | null;
  assignedTo: string | null;
  assignedOn: string | null;
  assignTaskId: number;
  startedOn: string | null;
  startedByName: string | null;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const TicketsList: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<TicketsListNavigationProp>();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ✅ Only run timer if open tickets exist
  useEffect(() => {
    const hasOpenTickets = tickets.some(t => !t.closedOnSplierSystem);
    if (!hasOpenTickets) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [tickets]);

  const getStatusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('assign')) return COLORS.SUCCESS;
    if (s.includes('start')) return COLORS.PRIMARY;
    if (s.includes('in progress')) return COLORS.SUCCESS;
    if (s.includes('complete') || s.includes('resolved')) return COLORS.SUCCESS;
    return COLORS.TEXT_MEDIUM;
  };

  const getPriorityFromAlarm = (alarmType?: string): Ticket['priority'] => {
    const a = (alarmType || '').toUpperCase();
    if (a.includes('FIBER_BREAK') || a.includes('SPLICE_BREAK')) return 'high';
    return 'medium';
  };

  const getPriorityColor = (priority?: string) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') return COLORS.ERROR;
    if (p === 'medium') return COLORS.WARNING;
    if (p === 'low') return COLORS.SUCCESS;
    return COLORS.TEXT_MEDIUM;
  };

  // ✅ Duration logic — freezes when closedOnSplierSystem exists
  const calculateDuration = (
    assignedDate?: string,
    closedOnSplierSystem?: string,
    currentTime?: Date,
  ): string => {
    if (!assignedDate) return '00:00:00';
    try {
      const assigned = new Date(assignedDate);
      const endTime = closedOnSplierSystem
        ? new Date(closedOnSplierSystem)
        : currentTime ?? new Date();

      const diffMs = endTime.getTime() - assigned.getTime();
      if (diffMs < 0) return '00:00:00';

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return '00:00:00';
    }
  };

  // ✅ FIXED TYPE ERROR HERE
  const mapApiItemToTicket = (it: ApiTicketItem): Ticket => {
    const assignedDate =
      it.assignedOn ?? it.statusUpdatedOn ?? new Date().toISOString();

    // ✅ Cleanly convert null → undefined
    const closedOnSplierSystem: string | undefined =
      it.status === 'Closed By Splicer' && it.statusUpdatedOn
        ? it.statusUpdatedOn
        : undefined;

    return {
      id: it.id,
      transactionNo: it.complaintCode,
      assignedDate,
      priority: getPriorityFromAlarm(it.alarmType),
      status: it.status || 'Assigned',
      customerName: it.routeName || '-',
      natureOfFault: it.alarmType || '-',
      assignedBy: it.assignedByName || it.statusUpdatedByName || '-',
      assignedTo: it.assignedTo || '-',
      linkName: it.routeName || '-',
      pathLocation: it.latLng || '-',
      closedOnSplierSystem, // ✅ type-safe assignment
    };
  };

  const loadTickets = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const action: any = await (dispatch as any)(
        getEmpComplaintsByDate({date: selectedDate}),
      );
      if ('payload' in action && action.payload?.items) {
        const mapped = (action.payload.items as ApiTicketItem[]).map(
          mapApiItemToTicket,
        );
        setTickets(mapped);
      } else {
        setTickets([]);
      }
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets(true);
  }, [selectedDate]);

  const filteredTickets = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      t =>
        (t.transactionNo || '').toLowerCase().includes(q) ||
        (t.customerName || '').toLowerCase().includes(q) ||
        (t.circuitId || '').toLowerCase().includes(q) ||
        (t.natureOfFault || '').toLowerCase().includes(q) ||
        (t.assignedTo || '').toLowerCase().includes(q) ||
        (t.assignedBy || '').toLowerCase().includes(q) ||
        (t.linkName || '').toLowerCase().includes(q) ||
        (t.pathLocation || '').toLowerCase().includes(q),
    );
  }, [tickets, searchText]);

  const handleTicketPress = (ticket: Ticket) => {
    navigation.navigate('TicketDetails', {ticketId: ticket.id});
  };

  const Field = ({
    label,
    value,
    highlight,
    pill,
  }: {
    label: string;
    value?: string;
    highlight?: boolean;
    pill?: boolean;
  }) => (
    <View style={styles.col}>
      <Text style={styles.label} numberOfLines={1}>
        {label}:{' '}
        <Text
          style={[
            pill ? styles.valuePill : styles.value,
            highlight ? styles.valueHighlight : null,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {value || '-'}
        </Text>
      </Text>
    </View>
  );

  const renderTicket = ({item, index}: {item: Ticket; index: number}) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        onPress={() => handleTicketPress(item)}
        activeOpacity={0.8}>
        <View style={styles.cardRow}>
          <View style={[styles.leftStrip, {backgroundColor: statusColor}]} />
          <View style={styles.card}>
            <View style={styles.headerMainRow}>
              <Text style={styles.cardIndex}>
                {index + 1}. {item.transactionNo}
              </Text>

              <View style={[styles.badge, {backgroundColor: statusColor}]}>
                <Text style={styles.badgeText}>
                  {(item.status || '').toUpperCase()}
                </Text>
              </View>

              <View style={styles.topRightBlock}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>
                    {formatDate(new Date(item.assignedDate))}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dot,
                    {backgroundColor: getPriorityColor(item.priority)},
                  ]}
                />
              </View>
            </View>

            <View style={styles.badges}>
              <View style={[styles.badge, styles.badgeTimer]}>
                <Text style={styles.badgeText}>
                  {calculateDuration(
                    item.assignedDate,
                    item.closedOnSplierSystem,
                    currentTime,
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              <Field label="Link Name" value={item.linkName} />
              <Field label="Issue Type" value={item.natureOfFault} highlight />
            </View>

            <View style={styles.footerCompact}>
              <Text style={styles.footerLabel} numberOfLines={1}>
                By:{' '}
                <Text style={styles.footerValue}>{item.assignedBy || '-'}</Text>
              </Text>
              <Text style={styles.footerLabel} numberOfLines={1}>
                To:{' '}
                <Text style={styles.footerValue}>{item.assignedTo || '-'}</Text>
              </Text>
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => handleTicketPress(item)}>
                <Text style={styles.viewBtnText}>Open Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen statusBgColor={COLORS.PRIMARY} preset="scroll">
      <View style={styles.hero}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Complaints</Text>
          <Text style={styles.subtitle}>Track Complaints</Text>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder={'Search Complaints...'}
              placeholderTextColor="#777"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTickets}
        renderItem={renderTicket}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTickets(false);
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : `No complaints found`}
            </Text>
          </View>
        }
      />

      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        maximumDate={new Date()}
        onConfirm={date => {
          setShowDatePicker(false);
          setSelectedDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </Screen>
  );
};

export default TicketsList;

// -------- styles (unchanged) ----------
const styles = StyleSheet.create({
  hero: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(12),
    paddingTop: SIZE.MS(10),
    paddingBottom: SIZE.MS(10),
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  headerContent: {marginBottom: SIZE.MS(8)},
  title: {fontSize: SIZE.MS(19), fontWeight: '800', color: COLORS.WHITE},
  subtitle: {color: COLORS.WHITE, opacity: 0.9, fontSize: SIZE.MS(11)},
  searchSection: {flexDirection: 'row', gap: 6},
  searchBox: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  searchInput: {fontSize: SIZE.MS(13), color: COLORS.TEXT_DARK},
  dateBtn: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: SIZE.MS(11),
    color: COLORS.PRIMARY_DARK,
    fontWeight: '700',
  },
  list: {padding: SIZE.MS(7)},
  cardRow: {
    flexDirection: 'row',
    marginBottom: 6,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    backgroundColor: COLORS.WHITE,
    elevation: 0.5,
  },
  leftStrip: {width: 4},
  card: {flex: 1, padding: 6},
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'space-around',
  },
  cardIndex: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
    fontSize: SIZE.MS(14),
    marginRight: 4,
  },
  ticketId: {
    color: COLORS.TEXT_DARKER,
    fontWeight: '700',
    fontSize: SIZE.MS(14),
    flexShrink: 1,
  },
  topRightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  dateBadge: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 0.5,
    marginRight: 4,
  },
  dateBadgeText: {
    fontSize: SIZE.MS(11),
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  dot: {width: 5, height: 5, borderRadius: 2.5},
  badges: {flexDirection: 'row', marginBottom: 3},
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginRight: 5,
  },
  badgeBrand: {backgroundColor: COLORS.PRIMARY_DARK},
  badgeTimer: {backgroundColor: COLORS.ACCENT_ORANGE},
  badgeText: {fontSize: SIZE.MS(12), color: COLORS.WHITE, fontWeight: '700'},
  grid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 3,
    marginBottom: 3,
  },
  col: {width: '82%'},
  label: {
    fontSize: SIZE.MS(13),
    color: COLORS.PRIMARY,
    fontWeight: '700',
    marginBottom: 1,
  },
  value: {fontSize: SIZE.MS(13), color: COLORS.TEXT_DARK},
  valuePill: {
    fontSize: SIZE.MS(13),
    color: COLORS.PRIMARY_DARK,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 7,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  valueHighlight: {fontWeight: '700'},
  footerCompact: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  footerLabel: {
    fontSize: SIZE.MS(11.5),
    color: COLORS.TEXT_MEDIUM,
    maxWidth: '28%',
  },
  footerValue: {color: COLORS.TEXT_DARKER, fontWeight: '700'},
  viewBtn: {
    marginLeft: 'auto',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  viewBtnText: {
    color: COLORS.WHITE,
    fontWeight: '700',
    fontSize: SIZE.MS(12),
  },
  empty: {paddingVertical: 40, alignItems: 'center'},
  emptyText: {color: COLORS.TEXT_LIGHT, fontSize: SIZE.MS(14)},
});
