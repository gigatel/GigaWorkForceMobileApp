// screens/OldIRScreen.tsx - BRAND COLORS ONLY
import {RootStackParamList} from '@navigation/navigator';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS, SIZE} from '@res';
import {Common} from '@utils';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ticketService} from '../../services/ticketService';

type OldIRRouteProp = RouteProp<RootStackParamList, 'OldIRScreen'>;
type OldIRNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OldIRScreen'
>;

interface OldIRData {
  id: string;
  irNumber: string;
  ticketId: string;
  description: string;
  issueType: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Cancelled';
  createdDate: string;
  createdBy: string;
  priority: 'High' | 'Medium' | 'Low';
  remark: string;
  chamberDetails?: {
    name: string;
    location: string;
  };
  images?: string[];
}

const OldIRScreen: React.FC = () => {
  const route = useRoute<OldIRRouteProp>();
  const navigation = useNavigation<OldIRNavigationProp>();

  const {ticketId} = route.params;

  const [loading, setLoading] = useState(true);
  const [oldIRList, setOldIRList] = useState<OldIRData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOldIRListFromAPI();
  }, [ticketId]);

  const loadOldIRListFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call to get Old IR list
      const response = await ticketService.getOldIRList(ticketId);

      Common.log('Old IR List Response:', response);

      if (response.success && response.data) {
        const mappedData: OldIRData[] = response.data.map((item: any) => ({
          id: item.id || '',
          irNumber:
            item.irNumber || `IR-${Math.random().toString(36).substr(2, 9)}`,
          ticketId: item.ticketId || ticketId,
          description: item.description || 'No description available',
          issueType: item.issueType || 'General',
          status: item.status || 'Open',
          createdDate: item.createdDate || new Date().toISOString(),
          createdBy: item.createdBy || 'Field Engineer',
          priority: item.priority || 'Medium',
          remark: item.remark || '',
          chamberDetails: item.chamberDetails,
          images: item.images || [],
        }));

        setOldIRList(mappedData);
      } else {
        // Demo data for development
        setOldIRList([
          {
            id: '1',
            irNumber: 'IR-001-2024',
            ticketId,
            description: 'Fiber optic cable fault detected in chamber C-123',
            issueType: 'Cable Fault',
            status: 'Closed',
            createdDate: '2024-08-25T10:30:00Z',
            createdBy: 'Ravi Kumar',
            priority: 'High',
            remark: 'Resolved by replacing damaged fiber section',
            chamberDetails: {
              name: 'Chamber C-123',
              location: 'Malviya Nagar, Jaipur',
            },
            images: ['img1.jpg', 'img2.jpg'],
          },
          {
            id: '2',
            irNumber: 'IR-002-2024',
            ticketId,
            description: 'Signal degradation in core 12',
            issueType: 'Signal Issue',
            status: 'In Progress',
            createdDate: '2024-08-20T14:15:00Z',
            createdBy: 'Suresh Sharma',
            priority: 'Medium',
            remark: 'Investigation ongoing, splicing required',
          },
        ]);
      }
      // eslint-disable-next-line no-catch-shadow
    } catch (error: any) {
      setError(error.message || 'Failed to load Old IR list');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
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
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return COLORS.WARNING;
      case 'in progress':
        return COLORS.PRIMARY;
      case 'closed':
        return COLORS.SUCCESS;
      case 'cancelled':
        return COLORS.ERROR;
      default:
        return COLORS.TEXT_MEDIUM;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return COLORS.ERROR;
      case 'medium':
        return COLORS.WARNING;
      case 'low':
        return COLORS.SUCCESS;
      default:
        return COLORS.TEXT_MEDIUM;
    }
  };

  const handleIRPress = (ir: OldIRData) => {
    Alert.alert(
      `${ir.irNumber}`,
      `${ir.description}\n\nStatus: ${ir.status}\nCreated by: ${ir.createdBy}`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'View Details',
          onPress: () => {
            navigation.navigate('IRDetailsScreen', {
              irId: ir.id,
              ticketId,
              irData: ir,
            });
          },
        },
      ],
    );
  };

  const renderIRItem = ({item}: {item: OldIRData}) => (
    <TouchableOpacity
      style={styles.irCard}
      onPress={() => handleIRPress(item)}
      activeOpacity={0.7}>
      <View style={styles.irHeader}>
        <View style={styles.irHeaderLeft}>
          <Text style={styles.irNumber}>{item.irNumber}</Text>
          <View
            style={[
              styles.priorityBadge,
              {backgroundColor: getPriorityColor(item.priority)},
            ]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
        </View>
        <View style={styles.irHeaderRight}>
          <Text style={styles.irDate}>{formatDate(item.createdDate)}</Text>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(item.status)},
            ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.irContent}>
        <Text style={styles.irDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.irMetadata}>
          <Text style={styles.metadataLabel}>Issue Type:</Text>
          <Text style={styles.metadataValue}>{item.issueType}</Text>
        </View>

        <View style={styles.irMetadata}>
          <Text style={styles.metadataLabel}>Created by:</Text>
          <Text style={styles.metadataValue}>{item.createdBy}</Text>
        </View>

        {item.chamberDetails && (
          <View style={styles.irMetadata}>
            <Text style={styles.metadataLabel}>Chamber:</Text>
            <Text style={styles.metadataValue}>{item.chamberDetails.name}</Text>
          </View>
        )}

        {item.images && item.images.length > 0 && (
          <View style={styles.irMetadata}>
            <Text style={styles.metadataLabel}>Attachments:</Text>
            <Text style={styles.metadataValue}>
              📸 {item.images.length} photo(s)
            </Text>
          </View>
        )}

        {item.remark && (
          <View style={styles.remarkContainer}>
            <Text style={styles.remarkLabel}>Remark:</Text>
            <Text style={styles.remarkText} numberOfLines={2}>
              {item.remark}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>No Old IR Found</Text>
      <Text style={styles.emptyStateMessage}>
        No previous Incident Reports found for this ticket.
      </Text>
    </View>
  );

  if (loading) {
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
            <Text style={styles.headerTitle}>Old IR</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.networkIndicator} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading Old IR list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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
            <Text style={styles.headerTitle}>Old IR</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.networkIndicator} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadOldIRListFromAPI}>
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
          <Text style={styles.headerTitle}>Old IR - Ticket #{ticketId}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.networkIndicator} />
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{oldIRList.length}</Text>
          <Text style={styles.statLabel}>Total IRs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {oldIRList.filter(ir => ir.status === 'Closed').length}
          </Text>
          <Text style={styles.statLabel}>Closed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {oldIRList.filter(ir => ir.status !== 'Closed').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* IR List */}
      <FlatList
        data={oldIRList}
        renderItem={renderIRItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadOldIRListFromAPI}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    elevation: 4,
  },
  backButton: {
    padding: SIZE.MS(8),
  },
  backText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(20),
    fontWeight: 'bold',
  },
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
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
  },
  headerRight: {
    width: SIZE.MS(32),
    alignItems: 'flex-end',
  },
  networkIndicator: {
    width: SIZE.MS(8),
    height: SIZE.MS(8),
    borderRadius: SIZE.MS(4),
    backgroundColor: COLORS.SUCCESS,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingVertical: SIZE.MVS(16),
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZE.MS(20),
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
    marginTop: SIZE.MVS(4),
  },
  listContainer: {
    padding: SIZE.MS(16),
  },
  irCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(8),
    marginBottom: SIZE.MVS(12),
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  irHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SIZE.MS(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  irHeaderLeft: {
    flex: 1,
  },
  irHeaderRight: {
    alignItems: 'flex-end',
  },
  irNumber: {
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
    color: COLORS.TEXT_DARKER,
    marginBottom: SIZE.MVS(4),
  },
  irDate: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
    marginBottom: SIZE.MVS(4),
  },
  priorityBadge: {
    paddingHorizontal: SIZE.MS(8),
    paddingVertical: SIZE.MVS(2),
    borderRadius: SIZE.MS(4),
    alignSelf: 'flex-start',
  },
  priorityText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(10),
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: SIZE.MS(8),
    paddingVertical: SIZE.MVS(4),
    borderRadius: SIZE.MS(12),
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(10),
    fontWeight: 'bold',
  },
  irContent: {
    padding: SIZE.MS(16),
  },
  irDescription: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    lineHeight: SIZE.MS(20),
    marginBottom: SIZE.MVS(12),
  },
  irMetadata: {
    flexDirection: 'row',
    marginBottom: SIZE.MVS(6),
  },
  metadataLabel: {
    fontSize: SIZE.MS(12),
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    width: SIZE.MS(90),
  },
  metadataValue: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  remarkContainer: {
    marginTop: SIZE.MVS(8),
    paddingTop: SIZE.MVS(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_DEFAULT,
  },
  remarkLabel: {
    fontSize: SIZE.MS(11),
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SIZE.MVS(4),
  },
  remarkText: {
    fontSize: SIZE.MS(11),
    color: COLORS.TEXT_MEDIUM,
    lineHeight: SIZE.MS(16),
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZE.MVS(60),
  },
  emptyStateIcon: {
    fontSize: SIZE.MS(48),
    marginBottom: SIZE.MVS(16),
  },
  emptyStateTitle: {
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: SIZE.MVS(8),
  },
  emptyStateMessage: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_MEDIUM,
    textAlign: 'center',
    paddingHorizontal: SIZE.MS(32),
  },
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
  retryText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(14),
    fontWeight: 'bold',
  },
});

export default OldIRScreen;
