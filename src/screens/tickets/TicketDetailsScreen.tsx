// screens/TicketDetailsScreen.tsx - BRAND COLORS ONLY
import {useTicketDetails} from '@hooks/index.ts';
import {RootStackParamList} from '@navigation/navigator';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS, SIZE} from '@res';
import {Common} from '@utils';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TicketData} from 'src/types/ticket.types';

type TicketDetailsRouteProp = RouteProp<RootStackParamList, 'TicketDetails'>;
type TicketDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TicketDetails'
>;

// utils/mapper.ts
export const mapDetailsToTicket = (d: TicketDetailsData): TicketData => ({
  id: d.id,
  ticketNo: d.transactionNo,
  transactionNo: d.transactionNo,
  description: d.remark,
  assignedDate: d.createdDate,
  priority: d.priority as 'high' | 'medium' | 'low',
  status: d.status as TicketData['status'],
  customerName: d.customerName,
  customerMobile: d.contactPersonMobile,
  ticketType: 'complaint',
  circuitFrom: d.circuitFrom,
  circuitTo: d.circuitTo,
  circuitId: d.circuitId,
  assignedTo: d.assignedTo,
  assignedBy: d.assignedBy,
  contactPersonName: d.contactPersonName,
  contactPersonMobile: d.contactPersonMobile,
  natureOfFault: d.natureOfFault,
  modeOfComplaint: d.modeOfComplaint ?? '',
  otdrLength: d.otdrLength ?? '',
  remark: d.remark,
  isStarted: d.isStarted,
  startTime: null,
  endTime: null,
  rawData: {} as any,
  formData: {} as any,
});

interface TicketDetailsData {
  id: string;
  transactionNo: string;
  customerName: string;
  circuitId: string;
  circuitFrom: string;
  circuitTo: string;
  natureOfFault: string;
  status: string;
  contactPersonName: string;
  contactPersonMobile: string;
  assignedTo: string;
  assignedBy: string;
  createdDate: string;
  remark: string;
  nocRemark: string;
  closureRemark: string;
  rfo: string;
  priority: string;
  company: string;
  isStarted: boolean;
  otdrLength: string;
  modeOfComplaint: string;
}

const TicketDetailsScreen: React.FC = () => {
  const route = useRoute<TicketDetailsRouteProp>();
  const navigation = useNavigation<TicketDetailsNavigationProp>();

  const {ticketId} = route.params;
  const {ticketDetails, followUps, error, loading, refetch} =
    useTicketDetails(ticketId);

  const [activeTab, setActiveTab] = useState<
    'TICKET_DETAILS' | 'CONTACT_DETAILS'
  >('TICKET_DETAILS');

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

  const handleOldIR = () => {
    Alert.alert('Old IR', 'Open existing Installation Report?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Open', onPress: () => Common.showToast('Opening Old IR...')},
    ]);
  };

  const handleNewIR = () => {
    Alert.alert(
      'New IR - Update Core',
      'Create new Installation Report and update core?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Create',
          onPress: () => Common.showToast('Creating New IR - Update Core...'),
        },
      ],
    );
  };

  const handleStart = () => {
    if (ticketDetails?.isStarted) {
      Common.showToast('Ticket already started');
      return;
    }
    Alert.alert('Start Ticket', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Start',
        onPress: () => {
          // Common.success('Ticket started');
          Common.log('mapDetailData=>', mapDetailsToTicket(ticketDetails!));
          return;
          navigation.navigate('FollowUpScreen', {
            ticketId,
            ticketData: mapDetailsToTicket(ticketDetails!),
          });
        },
      },
    ]);
  };

  const handleUpdate = () => {
    navigation.navigate('FollowUpScreen', {
      ticketId,
      ticketData: mapDetailsToTicket(ticketDetails!),
      // mode:'update',
    });
  };

  const handleClose = () => {
    Alert.alert('Close Ticket', 'Are you sure you want to close this ticket?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Close',
        onPress: () => {
          navigation.navigate('CloseTicketScreen', {
            ticketId,
            ticketData: ticketDetails,
          });
        },
      },
    ]);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return COLORS.WARNING;
      case 'started':
        return COLORS.PRIMARY; // ✅ CHANGED: Blue to Purple
      case 'completed':
        return COLORS.SUCCESS;
      default:
        return COLORS.TEXT_MEDIUM;
    }
  };

  const renderTicketDetailsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Company</Text>
          <Text style={styles.detailValue}>{ticketDetails?.company}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Customer</Text>
          <Text style={styles.detailValue}>{ticketDetails?.customerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Circuit ID</Text>
          <Text style={styles.detailValue}>{ticketDetails?.circuitId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Route</Text>
          <Text style={styles.detailValue}>
            {ticketDetails?.circuitFrom} - {ticketDetails?.circuitTo}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Fault</Text>
          <Text
            style={[
              styles.detailValue,
              {color: getPriorityColor(ticketDetails?.priority || '')},
            ]}>
            {ticketDetails?.natureOfFault}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Status</Text>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(ticketDetails?.status || '')},
            ]}>
            <Text style={styles.statusText}>{ticketDetails?.status}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>For testing</Text>
          <Text style={styles.detailValue}>{ticketDetails?.assignedTo}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Remark</Text>
          <Text style={styles.detailValue}>{ticketDetails?.remark}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>NOC Remark</Text>
          <Text style={styles.detailValue}>{ticketDetails?.nocRemark}</Text>
        </View>
      </View>
    </View>
  );

  const renderContactDetailsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.contactDetailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Contact Name</Text>
          <Text style={styles.detailValue}>
            {ticketDetails?.contactPersonName}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.purpleLabel}>Contact Mobile</Text>
          <Text style={styles.detailValue}>
            {ticketDetails?.contactPersonMobile}
          </Text>
        </View>
      </View>
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

  if (error || !ticketDetails) {
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

      {/* Header - Changed from BUTTON_PRIMARY to PRIMARY */}
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
              <View style={styles.contactBadge}>
                <Text style={styles.contactBadgeText}>Contact</Text>
              </View>
              <Text style={styles.contactDate}>
                {formatDate(ticketDetails.createdDate)}
              </Text>
            </View>
            <View style={styles.contactRight}>
              <Text style={styles.assignedLabel}>Assigned by</Text>
              <Text style={styles.assignedName}>
                {ticketDetails.assignedBy}
              </Text>
            </View>
          </View>
        </View>

        {/* Working Tabs - Changed from BUTTON_PRIMARY to PRIMARY */}
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
              ]}></Text>
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
        {activeTab === 'TICKET_DETAILS'
          ? renderTicketDetailsTab()
          : renderContactDetailsTab()}

        {/* IR Buttons */}
        <View style={styles.irButtonsContainer}>
          <TouchableOpacity style={styles.irButton} onPress={handleOldIR}>
            <Text style={styles.irButtonText}>OLD IR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.irButtonSecondary}
            onPress={handleNewIR}>
            <Text style={styles.irButtonSecondaryText}>
              NEW IR ( UPDATE CORE )
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Change Section */}
        <View style={styles.statusChangeSection}>
          <Text style={styles.statusChangeTitle}>
            Change ticket status below
          </Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                styles.startBtn,
                ticketDetails.isStarted && styles.disabledBtn,
              ]}
              onPress={handleStart}
              disabled={ticketDetails.isStarted}>
              <Text style={styles.statusBtnText}>START</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusBtn, styles.updateBtn]}
              onPress={handleUpdate}>
              <Text style={styles.statusBtnText}>UPDATE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusBtn, styles.closeBtn]}
              onPress={handleClose}>
              <Text style={styles.statusBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo User Contact Card - Changed from BUTTON_PRIMARY to PRIMARY */}
        <View style={styles.contactDetailsCard}>
          <View style={styles.contactCardHeader}>
            <Text style={styles.contactCardTitle}>By: Demo User</Text>
          </View>
          <View style={styles.contactCardContent}>
            <Text style={styles.contactCardLabel}>Chambers</Text>
            <Text style={styles.contactCardValue}>
              151002/SOUTH-ALAK/231 - DESHBANDHU BED-LIGHT(241+7%) KI BLOCK - B
              PARK
            </Text>
            <Text style={styles.contactCardLabel}>Remark</Text>
            <Text style={styles.contactCardValue}>{ticketDetails.remark}</Text>
            <Text style={styles.contactCardAddress}>
              {ticketDetails.circuitFrom} to {ticketDetails.circuitTo}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  // ✅ CHANGED: All BUTTON_PRIMARY replaced with PRIMARY (purple)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY, // ✅ Changed from BUTTON_PRIMARY
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
    fontSize: SIZE.MS(18),
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
  scrollView: {
    flex: 1,
  },
  contactSection: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactLeft: {
    alignItems: 'flex-start',
  },
  contactBadge: {
    backgroundColor: COLORS.PRIMARY, // ✅ Changed from BUTTON_PRIMARY
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MVS(4),
    borderRadius: SIZE.MS(12),
    marginBottom: SIZE.MVS(4),
  },
  contactBadgeText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(10),
    fontWeight: 'bold',
  },
  contactDate: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_DARK,
  },
  contactRight: {
    alignItems: 'flex-end',
  },
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
  // ✅ Working Tabs Styles - Updated Colors
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY, // ✅ Changed from BUTTON_PRIMARY
  },
  tab: {
    flex: 1,
    paddingVertical: SIZE.MVS(12),
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY, // ✅ Changed from BUTTON_PRIMARY
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY_MEDIUM, // ✅ Brand color for active tab
    borderBottomWidth: 3,
    borderBottomColor: COLORS.WARNING,
  },
  tabText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(14),
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  tabContent: {
    backgroundColor: COLORS.WHITE,
    minHeight: SIZE.MVS(200),
  },
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
    alignItems: 'center',
    marginBottom: SIZE.MVS(12),
    minHeight: SIZE.MVS(24),
  },
  detailLabel: {
    width: SIZE.MS(100),
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: SIZE.MS(13), // slightly larger for easy scanning
    color: COLORS.TEXT_DARKER,
    fontWeight: '500', // a bit bolder for clarity
    letterSpacing: 0.2,
    paddingVertical: SIZE.MVS(2),
    // Optional - add a subtle background for emphasis:
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: SIZE.MS(4),
    borderLeftWidth: 2,
    borderLeftColor: COLORS.PRIMARY + '33', // 20% opacity purple
    paddingLeft: SIZE.MS(7),
  },

  statusBadge: {
    paddingHorizontal: SIZE.MS(8),
    paddingVertical: SIZE.MVS(4),
    borderRadius: SIZE.MS(4),
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(10),
    fontWeight: 'bold',
  },
  irButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(16),
    backgroundColor: COLORS.WHITE,
    marginTop: SIZE.MVS(8),
    gap: SIZE.MS(12),
  },
  irButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
  },
  irButtonText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },
  irButtonSecondary: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
  },
  irButtonSecondaryText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: SIZE.MS(11),
    fontWeight: 'bold',
  },
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
    gap: SIZE.MS(12),
  },
  statusBtn: {
    flex: 1,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: COLORS.SUCCESS,
  },
  updateBtn: {
    backgroundColor: COLORS.WARNING,
  },
  closeBtn: {
    backgroundColor: COLORS.ERROR,
  },
  disabledBtn: {
    backgroundColor: COLORS.DISABLED,
  },
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
    borderColor: COLORS.PRIMARY, // ✅ Changed from BUTTON_PRIMARY
    elevation: 2,
  },
  contactCardHeader: {
    backgroundColor: COLORS.PRIMARY, // ✅ Changed from BUTTON_PRIMARY
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
  contactCardContent: {
    padding: SIZE.MS(16),
  },
  contactCardLabel: {
    fontSize: SIZE.MS(11),
    color: COLORS.TEXT_MEDIUM,
    fontWeight: 'bold',
    marginBottom: SIZE.MVS(4),
    marginTop: SIZE.MVS(8),
  },
  contactCardValue: {
    fontSize: SIZE.MS(11),
    color: COLORS.TEXT_DARK,
    lineHeight: SIZE.MS(16),
  },
  contactCardAddress: {
    fontSize: SIZE.MS(10),
    color: COLORS.TEXT_MEDIUM,
    marginTop: SIZE.MVS(8),
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: SIZE.MVS(32),
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
  purpleLabel: {
    width: SIZE.MS(100),
    fontSize: SIZE.MS(12),
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
});

export default TicketDetailsScreen;
