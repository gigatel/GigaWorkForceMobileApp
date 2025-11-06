// screens/TubeCoreDetailsScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@navigation/navigator';
import {Common} from '@utils';
import {ticketService} from '../../services/ticketService';
import {COLORS, SIZE} from '@res';

type TubeCoreRouteProp = RouteProp<RootStackParamList, 'TubeCoreDetailsScreen'>;
type TubeCoreNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TubeCoreDetailsScreen'
>;
interface TubeCoreData {
  sNo: string;
  tubeNumber: string;
  coreNumber: string;
  coreColor: string;
  status: 'Active' | 'Faulty' | 'Spare' | 'Under Maintenance';
  fiberType: string;
  length: string;
  attenuation: string;
  lastTested: string;
  remarks?: string;
}
const TubeCoreDetailsScreen: React.FC = () => {
  const route = useRoute<TubeCoreRouteProp>();
  const navigation = useNavigation<TubeCoreNavigationProp>();

  const {issueTypeId, ticketId} = route.params;

  const [loading, setLoading] = useState(true);
  const [tubeCoreList, setTubeCoreList] = useState<TubeCoreData[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTubeCoreDetailsFromAPI();
  }, [issueTypeId, ticketId]);

  const loadTubeCoreDetailsFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ticketService.getTubeCoreDetails(
        issueTypeId,
        ticketId,
      );

      Common.log('Tube Core Details Response:', response);

      if (response.success && response.data) {
        setTubeCoreList(response.data);
      } else {
        // Demo data for development
        setTubeCoreList([
          {
            sNo: '001',
            tubeNumber: 'T-12',
            coreNumber: 'C-01',
            coreColor: 'Blue',
            status: 'Active',
            fiberType: 'Single Mode',
            length: '2.5 km',
            attenuation: '0.35 dB/km',
            lastTested: '2024-08-20',
            remarks: 'Normal operation',
          },
          {
            sNo: '002',
            tubeNumber: 'T-12',
            coreNumber: 'C-02',
            coreColor: 'Orange',
            status: 'Faulty',
            fiberType: 'Single Mode',
            length: '2.5 km',
            attenuation: '1.85 dB/km',
            lastTested: '2024-08-25',
            remarks: 'High attenuation detected',
          },
          {
            sNo: '003',
            tubeNumber: 'T-12',
            coreNumber: 'C-03',
            coreColor: 'Green',
            status: 'Spare',
            fiberType: 'Single Mode',
            length: '2.5 km',
            attenuation: '0.28 dB/km',
            lastTested: '2024-08-15',
          },
          {
            sNo: '004',
            tubeNumber: 'T-13',
            coreNumber: 'C-01',
            coreColor: 'Brown',
            status: 'Under Maintenance',
            fiberType: 'Multi Mode',
            length: '1.8 km',
            attenuation: '2.15 dB/km',
            lastTested: '2024-08-22',
            remarks: 'Scheduled maintenance',
          },
        ]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load tube/core details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return COLORS.SUCCESS;
      case 'Faulty':
        return COLORS.ERROR;
      case 'Spare':
        return COLORS.WARNING;
      case 'Under Maintenance':
        return COLORS.PRIMARY;
      default:
        return COLORS.TEXT_MEDIUM;
    }
  };

  const handleItemSelect = (sNo: string) => {
    setSelectedItem(sNo);
    Common.showToast(`Selected S.No: ${sNo}`);
  };

  const handleConfirmSelection = () => {
    if (!selectedItem) {
      Alert.alert('Warning', 'Please select a tube/core first');
      return;
    }

    const selected = tubeCoreList.find(item => item.sNo === selectedItem);

    Alert.alert(
      'Confirm Selection',
      `Selected: ${selected?.tubeNumber}-${selected?.coreNumber} (${selected?.coreColor})\n\nDo you want to use this for the IR?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: () => {
            // Navigate back with selected data
            navigation.navigate('NewIRScreen', {
              ticketId,
              chamberDetails: route.params.chamberDetails,
              selectedTubeCore: selected,
            });
          },
        },
      ],
    );
  };

  const renderTubeCoreItem = ({item}: {item: TubeCoreData}) => (
    <TouchableOpacity
      style={[
        styles.itemCard,
        selectedItem === item.sNo && styles.selectedCard,
      ]}
      onPress={() => handleItemSelect(item.sNo)}
      activeOpacity={0.7}>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <Text style={styles.sNoText}>S.No: {item.sNo}</Text>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(item.status)},
            ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.itemHeaderRight}>
          <Text style={styles.tubeCore}>
            {item.tubeNumber}-{item.coreNumber}
          </Text>
          <View
            style={[
              styles.colorIndicator,
              {backgroundColor: item.coreColor.toLowerCase()},
            ]}
          />
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Core Color:</Text>
          <Text style={styles.detailValue}>{item.coreColor}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fiber Type:</Text>
          <Text style={styles.detailValue}>{item.fiberType}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Length:</Text>
          <Text style={styles.detailValue}>{item.length}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Attenuation:</Text>
          <Text
            style={[
              styles.detailValue,
              {
                color:
                  parseFloat(item.attenuation) > 1.0
                    ? COLORS.ERROR
                    : COLORS.SUCCESS,
              },
            ]}>
            {item.attenuation}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Tested:</Text>
          <Text style={styles.detailValue}>{item.lastTested}</Text>
        </View>

        {item.remarks && (
          <View style={styles.remarksContainer}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        )}
      </View>

      {selectedItem === item.sNo && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>✓ Selected</Text>
        </View>
      )}
    </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Tube/Core Details</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.networkIndicator} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading tube/core details...</Text>
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
            <Text style={styles.headerTitle}>Tube/Core Details</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.networkIndicator} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadTubeCoreDetailsFromAPI}>
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
          <Text style={styles.headerTitle}>Tube/Core Details</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.networkIndicator} />
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          📋 Select a tube/core for Issue Type: {issueTypeId}
        </Text>
      </View>

      {/* Tube/Core List */}
      <FlatList
        data={tubeCoreList}
        renderItem={renderTubeCoreItem}
        keyExtractor={item => item.sNo}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadTubeCoreDetailsFromAPI}
      />

      {/* Bottom Action Button */}
      {selectedItem && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmSelection}>
            <Text style={styles.confirmButtonText}>Use Selected Tube/Core</Text>
          </TouchableOpacity>
        </View>
      )}
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
  infoBanner: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  infoText: {
    fontSize: SIZE.MS(14),
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
  },
  listContainer: {
    padding: SIZE.MS(16),
  },
  itemCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(8),
    marginBottom: SIZE.MVS(12),
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY_LIGHT,
  },
  selectedCard: {
    borderLeftColor: COLORS.SUCCESS,
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZE.MS(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  itemHeaderLeft: {
    flex: 1,
  },
  itemHeaderRight: {
    alignItems: 'flex-end',
  },
  sNoText: {
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
    color: COLORS.TEXT_DARKER,
    marginBottom: SIZE.MVS(4),
  },
  tubeCore: {
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZE.MVS(4),
  },
  statusBadge: {
    paddingHorizontal: SIZE.MS(8),
    paddingVertical: SIZE.MVS(2),
    borderRadius: SIZE.MS(4),
    alignSelf: 'flex-start',
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(10),
    fontWeight: 'bold',
  },
  colorIndicator: {
    width: SIZE.MS(16),
    height: SIZE.MS(16),
    borderRadius: SIZE.MS(8),
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  itemDetails: {
    padding: SIZE.MS(16),
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SIZE.MVS(6),
  },
  detailLabel: {
    fontSize: SIZE.MS(12),
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    width: SIZE.MS(100),
  },
  detailValue: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  remarksContainer: {
    marginTop: SIZE.MVS(8),
    paddingTop: SIZE.MVS(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_DEFAULT,
  },
  remarksLabel: {
    fontSize: SIZE.MS(11),
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SIZE.MVS(4),
  },
  remarksText: {
    fontSize: SIZE.MS(11),
    color: COLORS.TEXT_MEDIUM,
    fontStyle: 'italic',
  },
  selectionIndicator: {
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: SIZE.MVS(8),
    alignItems: 'center',
  },
  selectionText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: SIZE.MS(16),
    backgroundColor: COLORS.WHITE,
    elevation: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SIZE.MVS(16),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default TubeCoreDetailsScreen;
