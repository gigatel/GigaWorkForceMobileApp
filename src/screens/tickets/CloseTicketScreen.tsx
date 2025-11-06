// screens/CloseTicketScreen.tsx
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
  TextInput,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {RootStackParamList} from '@navigation/navigator';
import {Common} from '@utils';
import {ticketService} from '../../services/ticketService';
import {COLORS, SIZE} from '@res';
import {OptionPickerSheet} from '@molecules';
import {
  closeTicketSchema,
  CloseTicketFormData,
  RFOOption,
} from '../../schemas/closeTicket.schema';

type CloseTicketRouteProp = RouteProp<RootStackParamList, 'CloseTicketScreen'>;
type CloseTicketNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CloseTicketScreen'
>;

const CloseTicketScreen: React.FC = () => {
  const route = useRoute<CloseTicketRouteProp>();
  const navigation = useNavigation<CloseTicketNavigationProp>();

  const {ticketId, ticketData} = route.params;

  // State Management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rfoOptions, setRfoOptions] = useState<RFOOption[]>([]);
  const [rfoPickerOpen, setRfoPickerOpen] = useState(false);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: {errors, isSubmitting},
  } = useForm<CloseTicketFormData>({
    resolver: yupResolver(closeTicketSchema),
    defaultValues: {
      selectedRfoId: '',
      closureRemarks: '',
    },
  });

  // Watch form values
  const selectedRfoId = watch('selectedRfoId');
  const closureRemarks = watch('closureRemarks');

  useEffect(() => {
    loadRFOOptions();
  }, []);

  // Load RFO Master Dropdown Options
  const loadRFOOptions = async () => {
    try {
      setLoading(true);
      Common.log('🔍 Loading RFO options...');

      const response = await ticketService.getRFOMasterDD();
      console.log('🔍 RFO options response:', response);

      if (response.success && response.data) {
        const mappedOptions: RFOOption[] = response.data.map((item: any) => ({
          id: item.id || item.rfoId || item.value,
          name: item.name || item.reason || item.description,
          description: item.description || '',
        }));

        setRfoOptions(mappedOptions);
        Common.log(`✅ ${mappedOptions.length} RFO options loaded`);
      } else {
        Common.showToast('No closure reasons found');
        setRfoOptions([]);
      }
    } catch (error) {
      Common.error('loadRFOOptions', error);
      Common.showToast('Failed to load closure reasons');
    } finally {
      setLoading(false);
    }
  };

  // Submit Closure with React Hook Form
  const onSubmit = async (data: CloseTicketFormData) => {
    Alert.alert(
      'Confirm Closure',
      'Are you sure you want to close this ticket? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Close Ticket',
          style: 'destructive',
          onPress: () => submitClosure(data),
        },
      ],
    );
  };

  // Handle submit button press
  const handleSubmitClosure = () => {
    handleSubmit(onSubmit)();
  };

  const submitClosure = async (data: CloseTicketFormData) => {
    setSubmitting(true);

    try {
      // ✅ Fixed payload structure
      const payload = {
        ticketId: ticketId, // Will be mapped to formDataId
        rfoId: data.selectedRfoId, // Will be mapped to rfoId (number)
        closureRemarks: data.closureRemarks.trim(), // Will be mapped to comment
        status: 'closed', // Status string
      };

      Common.log('🔒 Submitting ticket closure:', payload);

      const result = await ticketService.updateTaskRFO(payload);

      Common.log('🔒 Closure result:', result);

      Alert.alert(
        result.success ? 'Success' : 'Failed',
        result.message ||
          (result.success
            ? 'Ticket closed successfully'
            : 'Failed to close ticket'),
        [
          {
            text: 'OK',
            onPress: () => {
              if (result.success) {
                // Navigate back to ticket list
                navigation.navigate('TicketsList');
              }
            },
          },
        ],
      );
    } catch (error) {
      Common.error('submitClosure', error);
      Alert.alert('Error', 'Failed to close ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // RFO Picker Handlers
  const openRFOPicker = () => {
    if (rfoOptions.length === 0) {
      Common.showToast('No closure reasons available');
      return;
    }
    setRfoPickerOpen(true);
  };

  const onRfoDone = (selectedItems: {label: string; value: string}[]) => {
    setRfoPickerOpen(false);
    if (selectedItems.length > 0) {
      const selectedRfo = selectedItems[0];
      setValue('selectedRfoId', selectedRfo.value);
    }
  };

  // Header Component
  // eslint-disable-next-line react/no-unstable-nested-components
  const Header = () => (
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
        <Text style={styles.headerTitle}>Close Ticket</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.networkIndicator} />
      </View>
    </View>
  );

  // Ticket Info Component
  // eslint-disable-next-line react/no-unstable-nested-components
  const TicketInfo = () => (
    <View style={styles.ticketInfoCard}>
      <Text style={styles.ticketNumber}>{ticketData?.transactionNo}</Text>
      <Text style={styles.customerName}>{ticketData?.customerName}</Text>
      <Text style={styles.circuitInfo}>
        {ticketData?.circuitFrom} → {ticketData?.circuitTo}
      </Text>
      <Text style={styles.faultInfo}>Fault: {ticketData?.natureOfFault}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading closure options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🔍 selectedRfoId:', selectedRfoId);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      <Header />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Ticket Information */}
        <TicketInfo />

        {/* RFO Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Closure Reason *</Text>
          <TouchableOpacity
            style={[
              styles.rfoSelector,
              errors.selectedRfoId && styles.inputError,
            ]}
            onPress={openRFOPicker}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.rfoSelectorText,
                !selectedRfoId && styles.rfoPlaceholder,
              ]}>
              {selectedRfoId
                ? rfoOptions.find(opt => opt.id === selectedRfoId)?.name
                : 'Select closure reason'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {errors.selectedRfoId && (
            <Text style={styles.errorText}>{errors.selectedRfoId.message}</Text>
          )}
        </View>

        {/* Closure Remarks */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Final Remarks *</Text>
          <View
            style={[
              styles.remarksContainer,
              errors.closureRemarks && styles.inputError,
            ]}>
            <TextInput
              style={styles.remarksInput}
              multiline
              numberOfLines={6}
              value={closureRemarks}
              onChangeText={text =>
                setValue('closureRemarks', text, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
              placeholder="Enter detailed closure remarks (minimum 10 characters)..."
              placeholderTextColor={COLORS.TEXT_LIGHT}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>
            {closureRemarks.length}/500 characters
          </Text>
          {errors.closureRemarks && (
            <Text style={styles.errorText}>
              {errors.closureRemarks.message}
            </Text>
          )}
        </View>

        {/* Submit Section */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || isSubmitting || Object.keys(errors).length > 0) &&
                styles.submitButtonDisabled,
            ]}
            disabled={
              submitting || isSubmitting || Object.keys(errors).length > 0
            }
            onPress={handleSubmitClosure}
            activeOpacity={0.8}>
            {submitting || isSubmitting ? (
              <View style={styles.submitLoading}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.submitText, {marginLeft: 8}]}>
                  CLOSING TICKET...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitText}>CLOSE TICKET</Text>
            )}
          </TouchableOpacity>

          {/* Warning Message */}
          <Text style={styles.warningText}>
            ⚠️ Once closed, this ticket cannot be reopened
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* RFO Option Picker Sheet */}
      <OptionPickerSheet
        enableSearch={false}
        onClose={() => setRfoPickerOpen(false)}
        onDone={onRfoDone}
        show={rfoPickerOpen}
        type="single"
        value={
          selectedRfoId
            ? rfoOptions
                .filter(option => option.id === selectedRfoId)
                .map(option => ({
                  label: option.name,
                  value: option.id,
                }))
            : []
        }
        rowType="labelValue"
        rowUniqueKey="value"
        title="Select Closure Reason"
        data={rfoOptions.map(option => ({
          label: option.name,
          value: option.id,
        }))}
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },

  // Header Styles
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

  // Content Styles
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZE.MS(20),
  },
  loadingText: {
    marginTop: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
    fontSize: SIZE.MS(16),
  },

  // Ticket Info Styles
  ticketInfoCard: {
    backgroundColor: COLORS.WHITE,
    margin: SIZE.MS(16),
    padding: SIZE.MS(16),
    borderRadius: SIZE.MS(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ERROR,
  },
  ticketNumber: {
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
    color: COLORS.TEXT_DARKER,
    marginBottom: SIZE.MVS(4),
  },
  customerName: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_MEDIUM,
    marginBottom: SIZE.MVS(8),
  },
  circuitInfo: {
    fontSize: SIZE.MS(13),
    color: COLORS.TEXT_DARK,
    marginBottom: SIZE.MVS(4),
  },
  faultInfo: {
    fontSize: SIZE.MS(13),
    color: COLORS.ERROR,
    fontWeight: '600',
  },

  // Form Styles
  formSection: {
    marginHorizontal: SIZE.MS(16),
    marginBottom: SIZE.MVS(20),
  },
  sectionLabel: {
    fontSize: SIZE.MS(14),
    fontWeight: 'bold',
    color: COLORS.TEXT_DARKER,
    marginBottom: SIZE.MVS(8),
  },

  // RFO Selector Styles
  rfoSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(8),
    padding: SIZE.MS(14),
    backgroundColor: COLORS.WHITE,
    elevation: 1,
  },
  rfoSelectorText: {
    flex: 1,
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
  },
  rfoPlaceholder: {
    color: COLORS.TEXT_LIGHT,
  },
  dropdownArrow: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
  },

  // Remarks Styles
  remarksContainer: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(8),
    backgroundColor: COLORS.WHITE,
    elevation: 1,
  },
  remarksInput: {
    minHeight: SIZE.MVS(120),
    padding: SIZE.MS(12),
    textAlignVertical: 'top',
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    lineHeight: SIZE.MS(20),
  },
  charCount: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_LIGHT,
    textAlign: 'right',
    marginTop: SIZE.MVS(4),
  },

  // Submit Styles
  submitSection: {
    marginHorizontal: SIZE.MS(16),
    marginTop: SIZE.MVS(10),
  },
  submitButton: {
    backgroundColor: COLORS.ERROR,
    paddingVertical: SIZE.MVS(16),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.DISABLED,
    elevation: 0,
  },
  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZE.MS(12),
    marginTop: SIZE.MVS(4),
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  warningText: {
    color: COLORS.WARNING,
    fontSize: SIZE.MS(11),
    textAlign: 'center',
    marginTop: SIZE.MVS(8),
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: SIZE.MVS(32),
  },
});

export default CloseTicketScreen;
