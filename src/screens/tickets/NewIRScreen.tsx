// screens/NewIRScreen.tsx - BRAND COLORS ONLY
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
  Modal,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@navigation/navigator';
import {Common} from '@utils';
import {ticketService} from '../../services/ticketService';
import {COLORS, FONTS, SIZE, STYLES} from '@res';
import {Picker} from '@react-native-picker/picker';

type NewIRRouteProp = RouteProp<RootStackParamList, 'NewIRScreen'>;
type NewIRNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'NewIRScreen'
>;

interface IssueType {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
}

interface NewIRFormData {
  issueType: string;
  tubeCoreDetails: string;
  description: string;
  remark: string;
  chamberSelected?: any;
  images: string[];
}

const NewIRScreen: React.FC = () => {
  const route = useRoute<NewIRRouteProp>();
  const navigation = useNavigation<NewIRNavigationProp>();

  const {ticketId, chamberDetails} = route.params;

  const [loading, setLoading] = useState(false);
  const [isHindi, setIsHindi] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [formData, setFormData] = useState<NewIRFormData>({
    issueType: '',
    tubeCoreDetails: '',
    description: '',
    remark: '',
    chamberSelected: chamberDetails,
    images: [],
  });
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    english: {
      title: 'New IR - Create Report',
      selectIssueType: 'Select Issue Type',
      tubeCore: 'Tube/Core Details',
      description: 'Incident Description',
      remark: 'Additional Remarks',
      chamberLocation: 'Chamber Location',
      viewOnMap: 'View on Map',
      playVoice: 'Play Voice (Encl)',
      viewTubeCore: 'View S.no',
      submit: 'Create IR',
      cancel: 'Cancel',
      hindi: 'Hindi',
      english: 'English',
    },
    hindi: {
      title: 'नया IR - रिपोर्ट बनाएं',
      selectIssueType: 'समस्या प्रकार चुनें',
      tubeCore: 'ट्यूब/कोर विवरण',
      description: 'घटना विवरण',
      remark: 'अतिरिक्त टिप्पणी',
      chamberLocation: 'चैम्बर स्थान',
      viewOnMap: 'मैप पर देखें',
      playVoice: 'आवाज़ चलाएं (Encl)',
      viewTubeCore: 'S.no देखें',
      submit: 'IR बनाएं',
      cancel: 'रद्द करें',
      hindi: 'हिंदी',
      english: 'अंग्रेजी',
    },
  };

  const currentLabels = isHindi ? labels.hindi : labels.english;

  useEffect(() => {
    loadIssueTypesFromAPI();
  }, []);

  const loadIssueTypesFromAPI = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getTypeDD();

      Common.log('Issue Types Response:', response);

      if (response.success && response.data) {
        setIssueTypes(response.data);
      } else {
        // Demo data for development
        setIssueTypes([
          {
            id: '1',
            name: 'Cable Fault',
            nameHindi: 'केबल फॉल्ट',
            description: 'Fiber optic cable related issues',
          },
          {
            id: '2',
            name: 'Signal Degradation',
            nameHindi: 'सिग्नल डिग्रेडेशन',
            description: 'Signal quality issues',
          },
          {
            id: '3',
            name: 'Splice Issue',
            nameHindi: 'स्प्लाइस समस्या',
            description: 'Fiber splicing related problems',
          },
          {
            id: '4',
            name: 'Chamber Access',
            nameHindi: 'चैम्बर पहुंच',
            description: 'Chamber accessibility issues',
          },
        ]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load issue types');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = () => {
    setIsHindi(!isHindi);
    Common.showToast(isHindi ? 'Language: English' : 'Language: Hindi');
  };

  const handleViewTubeCore = () => {
    if (!formData.issueType) {
      Alert.alert('Warning', 'Please select issue type first');
      return;
    }

    navigation.navigate('TubeCoreDetailsScreen', {
      issueTypeId: formData.issueType,
      ticketId,
    });
  };

  const handleViewOnMap = () => {
    if (chamberDetails && chamberDetails.latitude && chamberDetails.longitude) {
      navigation.navigate('MapViewScreen', {
        latitude: chamberDetails.latitude,
        longitude: chamberDetails.longitude,
        title: 'Chamber Location',
      });
    } else {
      // Demo coordinates for Jaipur
      navigation.navigate('MapViewScreen', {
        latitude: 26.9124,
        longitude: 75.7873,
        title: 'Chamber Location (Demo)',
      });
      Common.showToast('Showing demo location');
    }
  };

  const handlePlayVoice = () => {
    const language = isHindi ? 'Hindi' : 'English';
    Alert.alert(
      'Voice Assistant',
      `Playing voice instructions in ${language}\n\n"Please follow the on-screen instructions to complete the IR creation process."`,
      [
        {text: 'Stop', style: 'cancel'},
        {
          text: 'Continue',
          onPress: () => Common.showToast(`Voice playing in ${language}`),
        },
      ],
    );
  };

  const validateForm = (): boolean => {
    if (!formData.issueType.trim()) {
      Alert.alert('Error', 'Please select an issue type');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter incident description');
      return false;
    }
    return true;
  };

  const handleSubmitIR = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirm Creation',
      'Are you sure you want to create this New IR?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Create', onPress: submitIRToAPI},
      ],
    );
  };

  const submitIRToAPI = async () => {
    try {
      setLoading(true);

      const submitData = {
        ticketId,
        issueType: formData.issueType,
        tubeCoreDetails: formData.tubeCoreDetails,
        description: formData.description,
        remark: formData.remark,
        language: isHindi ? 'hindi' : 'english',
        chamberDetails: formData.chamberSelected,
        createdDate: new Date().toISOString(),
      };

      const response = await ticketService.createNewIR(submitData);

      Common.log('New IR Creation Response:', response);

      if (response.success) {
        Common.success('New IR created successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to create New IR');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create New IR');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof NewIRFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderIssueTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{currentLabels.selectIssueType}</Text>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowIssuePicker(true)}>
        <Text style={styles.pickerButtonText}>
          {formData.issueType
            ? issueTypes.find(type => type.id === formData.issueType)?.[
                isHindi ? 'nameHindi' : 'name'
              ] || 'Select...'
            : 'Select Issue Type...'}
        </Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showIssuePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIssuePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentLabels.selectIssueType}
              </Text>
              <TouchableOpacity onPress={() => setShowIssuePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {issueTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.optionItem,
                    formData.issueType === type.id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    updateFormData('issueType', type.id);
                    setShowIssuePicker(false);
                  }}>
                  <Text
                    style={[
                      styles.optionText,
                      formData.issueType === type.id &&
                        styles.selectedOptionText,
                    ]}>
                    {isHindi ? type.nameHindi : type.name}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {type.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
  if (loading && issueTypes.length === 0) {
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
            <Text style={styles.headerTitle}>New IR</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.networkIndicator} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading form...</Text>
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
          <Text style={styles.headerTitle}>{currentLabels.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={handleLanguageToggle}>
          <Text style={styles.languageText}>{isHindi ? 'EN' : 'हि'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Issue Type Selection */}
        {renderIssueTypeSelector()}

        {/* Tube/Core Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{currentLabels.tubeCore}</Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={handleViewTubeCore}>
              <Text style={styles.viewButtonText}>
                {currentLabels.viewTubeCore}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder={`Enter ${currentLabels.tubeCore.toLowerCase()}...`}
            value={formData.tubeCoreDetails}
            onChangeText={value => updateFormData('tubeCoreDetails', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentLabels.description}</Text>
          <TextInput
            style={[styles.textInput, styles.descriptionInput]}
            placeholder={`Enter ${currentLabels.description.toLowerCase()}...`}
            value={formData.description}
            onChangeText={value => updateFormData('description', value)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Additional Remarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentLabels.remark}</Text>
          <TextInput
            style={[styles.textInput, styles.descriptionInput]}
            placeholder={`Enter ${currentLabels.remark.toLowerCase()}...`}
            value={formData.remark}
            onChangeText={value => updateFormData('remark', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Chamber Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {currentLabels.chamberLocation}
          </Text>
          <View style={styles.chamberContainer}>
            <Text style={styles.chamberText}>
              {chamberDetails?.name || 'Chamber Location Available'}
            </Text>

            <View style={styles.chamberButtons}>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleViewOnMap}>
                <Text style={styles.buttonText}>
                  🗺️ {currentLabels.viewOnMap}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.voiceButton}
                onPress={handlePlayVoice}>
                <Text style={styles.buttonText}>
                  🔊 {currentLabels.playVoice}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>{currentLabels.cancel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmitIR}
          disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : currentLabels.submit}
          </Text>
        </TouchableOpacity>
      </View>
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
  languageToggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MVS(6),
    borderRadius: SIZE.MS(4),
  },
  languageText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SIZE.MS(16),
    marginTop: SIZE.MVS(16),
    borderRadius: SIZE.MS(8),
    padding: SIZE.MS(16),
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZE.MVS(12),
  },
  sectionTitle: {
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  viewButton: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MVS(6),
    borderRadius: SIZE.MS(4),
  },
  viewButtonText: {
    color: COLORS.PRIMARY,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(4),
    padding: SIZE.MS(12),
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  pickerButtonText: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  pickerArrow: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(4),
    padding: SIZE.MS(12),
    fontSize: SIZE.MS(14),
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    color: COLORS.TEXT_DARK,
  },
  descriptionInput: {
    height: SIZE.MVS(100),
    textAlignVertical: 'top',
  },
  chamberContainer: {
    marginTop: SIZE.MVS(8),
  },
  chamberText: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    marginBottom: SIZE.MVS(12),
    fontWeight: '500',
  },
  chamberButtons: {
    flexDirection: 'row',
    gap: SIZE.MS(12),
  },
  mapButton: {
    flex: 1,
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(6),
    alignItems: 'center',
  },
  voiceButton: {
    flex: 1,
    backgroundColor: COLORS.WARNING,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(6),
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: 'bold',
  },
  bottomContainer: {
    flexDirection: 'row',
    padding: SIZE.MS(16),
    backgroundColor: COLORS.WHITE,
    elevation: 4,
    gap: SIZE.MS(12),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.ERROR,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(6),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(14),
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(6),
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(14),
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.DISABLED,
  },
  bottomSpacing: {
    height: SIZE.MVS(20),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(8),
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZE.MS(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  modalTitle: {
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  modalClose: {
    fontSize: SIZE.MS(18),
    color: COLORS.TEXT_MEDIUM,
  },
  optionsList: {
    maxHeight: SIZE.MVS(300),
  },
  optionItem: {
    padding: SIZE.MS(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
  },
  selectedOption: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  optionText: {
    fontSize: SIZE.MS(16),
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
    marginTop: SIZE.MVS(4),
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
});

export default NewIRScreen;
