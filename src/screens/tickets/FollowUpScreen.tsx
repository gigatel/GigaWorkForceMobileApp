import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
  MediaType,
} from 'react-native-image-picker';

import {RootStackParamList} from '@navigation/navigator';
import {COLORS, SIZE} from '@res';
import {Common} from '@utils';
import {ticketService} from '../../services/ticketService';

/* ───────────── Types ───────────── */
type Nav = NativeStackNavigationProp<RootStackParamList, 'FollowUpScreen'>;
type Rt = RouteProp<RootStackParamList, 'FollowUpScreen'>;

interface Chamber {
  id: string;
  name: string;
  address: string;
  distance: number;
  chamberType?: string;
  chamberId?: string;
  chamberNo?: number;
  routeId?: string;
}

interface DDItem {
  id: string;
  name: string;
}

/* ═══════════════ REMARK COMPONENT (KEYBOARD FIXED) ═══════════════ */
const RemarkSection = ({
  remark,
  onRemarkChange,
  onFocus,
}: {
  remark: string;
  onRemarkChange: (text: string) => void;
  onFocus: () => void;
}) => {
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.remarkSection}>
      <Text style={styles.secLbl}>Remark *</Text>
      <View style={styles.remarkContainer}>
        <TextInput
          ref={inputRef}
          style={styles.remarkInput}
          multiline
          numberOfLines={4}
          value={remark}
          onChangeText={onRemarkChange}
          onFocus={onFocus}
          placeholder="Enter your remarks here..."
          placeholderTextColor={COLORS.TEXT_LIGHT}
          textAlignVertical="top"
          blurOnSubmit={false}
          returnKeyType="default"
          autoCorrect={false}
          keyboardType="default"
          scrollEnabled={false}
          textContentType="none"
        />
      </View>
    </View>
  );
};

/* ═══════════════ PHOTO COMPONENT (IMAGE PICKER FIXED) ═══════════════ */
const PhotoSection = ({
  images,
  onAddImage,
  onRemoveImage,
}: {
  images: string[];
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
}) => {
  return (
    <View style={styles.photoSection}>
      <View style={styles.photoHead}>
        <Text style={styles.secLbl}>Photos ({images.length}/5)</Text>
        <TouchableOpacity
          style={[
            styles.addPhotoBtn,
            images.length >= 5 && styles.addPhotoBtnDisabled,
          ]}
          onPress={onAddImage}
          disabled={images.length >= 5}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.addPhotoTxt,
              images.length >= 5 && styles.addPhotoTxtDisabled,
            ]}>
            + Add Photo
          </Text>
        </TouchableOpacity>
      </View>

      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
          contentContainerStyle={styles.imageScrollContent}>
          {images.map((uri, index) => (
            <TouchableOpacity
              key={`image_${index}_${uri.substring(0, 20)}`}
              style={styles.imageContainer}
              onPress={() => onRemoveImage(index)}
              activeOpacity={0.8}>
              <Image source={{uri}} style={styles.photo} resizeMode="cover" />
              <View style={styles.removeOverlay}>
                <Text style={styles.removeText}>×</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

/* ═══════════════ SUBMIT BUTTON COMPONENT ═══════════════ */
const SubmitButton = ({
  onSubmit,
  loading,
  disabled,
  validationError,
  isOnline,
}: {
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  validationError: string;
  isOnline: boolean;
}) => {
  return (
    <View style={styles.submitSection}>
      <TouchableOpacity
        style={[
          styles.subBtn,
          (disabled || loading || !isOnline) && styles.subBtnDis,
        ]}
        disabled={disabled || loading || !isOnline}
        onPress={onSubmit}
        activeOpacity={0.8}>
        {loading ? (
          <View style={styles.submitLoading}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={[styles.subTxt, {marginLeft: 8}]}>SUBMITTING...</Text>
          </View>
        ) : (
          <Text style={styles.subTxt}>SUBMIT FOLLOW-UP</Text>
        )}
      </TouchableOpacity>

      {/* Error Messages */}
      {validationError && <Text style={styles.errTxt}>{validationError}</Text>}
      {!isOnline && <Text style={styles.errTxt}>No internet connection</Text>}
    </View>
  );
};

/* ───────────── Other Components ───────────── */
const Header = ({onBack}: {onBack: () => void}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
      <Text style={styles.backTxt}>←</Text>
    </TouchableOpacity>
    <Text style={styles.hTitle}>Follow-Up</Text>
    <View style={{width: SIZE.MS(24)}} />
  </View>
);

const TicketInfo = ({ticketData}: {ticketData: any}) => (
  <View style={styles.tktBox}>
    <Text style={styles.tktNo}>{ticketData.transactionNo}</Text>
    <Text style={styles.tktCust}>{ticketData.customerName}</Text>
  </View>
);

const ChamberCard = ({
  item,
  selected,
  onSelect,
}: {
  item: Chamber;
  selected: boolean;
  onSelect: () => void;
}) => {
  const dist =
    item.distance < 1
      ? `${(item.distance * 1000).toFixed(0)} m`
      : `${item.distance.toFixed(1)} km`;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSel]}
      onPress={onSelect}
      activeOpacity={0.7}>
      <View style={{flex: 1}}>
        <Text style={styles.cardTtl}>{item.name}</Text>
        <Text style={styles.cardAddr}>{item.address}</Text>

        {item.chamberId && (
          <Text style={styles.cardMeta}>ID: {item.chamberId}</Text>
        )}
        {item.chamberNo && (
          <Text style={styles.cardMeta}>Chamber #{item.chamberNo}</Text>
        )}
      </View>

      <View style={styles.cardRt}>
        <Text style={styles.cardDist}>{dist}</Text>
        {item.routeId && <Text style={styles.cardRoute}>{item.routeId}</Text>}
      </View>
    </TouchableOpacity>
  );
};

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function FollowUpScreen() {
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const {ticketId, ticketData} = params;

  // Refs
  const flatListRef = useRef<FlatList>(null);

  /* ───────── State ───────── */
  const [gps, setGps] = useState<{lat: number; lng: number}>();
  const [loading, setLoading] = useState(true);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [selChId, setSelChId] = useState<string>();

  const [issueFound, setIssueFound] = useState(false);
  const [types, setTypes] = useState<DDItem[]>([]);
  const [works, setWorks] = useState<DDItem[]>([]);
  const [typeId, setTypeId] = useState('');
  const [workId, setWorkId] = useState('');

  const [remark, setRemark] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [isNet, setIsNet] = useState(true);

  /* ───────── Network Listener ───────── */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsNet(!!state.isConnected);
    });
    return unsubscribe;
  }, []);

  /* ───────── Location Handler ───────── */
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs location access to find nearby chambers',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return fallbackLocation();
          }
        }

        Geolocation.getCurrentPosition(
          position => {
            const {latitude: lat, longitude: lng} = position.coords;
            setGps({lat, lng});
            Common.log('Location obtained:', {lat, lng});
          },
          error => {
            Common.log('Location error:', error);
            fallbackLocation();
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      } catch (error) {
        Common.log('Location permission error:', error);
        fallbackLocation();
      }
    };

    const fallbackLocation = () => {
      Common.showToast('Using Delhi fallback location');
      setGps({lat: 28.6139, lng: 77.209});
    };

    requestLocationPermission();
  }, []);

  /* ───────── Fetch Chambers ───────── */
  useEffect(() => {
    if (gps) {
      fetchChambers();
    }
  }, [gps]);

  const fetchChambers = async () => {
    setLoading(true);
    try {
      Common.log('Fetching chambers for GTPL with location:', gps);
      const res = await ticketService.getNearestChambers('GTPL');

      if (res.success && res.data) {
        const mapped: Chamber[] = res.data.map((c: any) => ({
          id: String(c.id || c.chamberId || Math.random()),
          name: c.chamber_name || c.chamberName || 'Unknown Chamber',
          address: c.chamber_location || c.landmark || 'No address',
          distance: Number(c.distance || 0) / 1000,
          chamberType: c.chamber_type || c.chamberType,
          chamberId: c.chamber_id || c.chamberId,
          chamberNo: c.chamberNo,
          routeId: c.route_id || c.routeId,
        }));
        setChambers(mapped);
        Common.log('Chambers loaded:', mapped.length);
      } else {
        Common.showToast('No chambers found');
        setChambers([]);
      }
    } catch (error) {
      Common.error('fetchChambers', error);
      Common.showToast('Failed to load chambers');
    } finally {
      setLoading(false);
    }
  };

  /* ───────── Issue Types Handler ───────── */
  useEffect(() => {
    if (!issueFound) {
      setTypes([]);
      setWorks([]);
      setTypeId('');
      setWorkId('');
      return;
    }

    const fetchTypes = async () => {
      try {
        const res = await ticketService.getTypeDD();
        if (res.success && res.data) {
          setTypes(res.data);
        }
      } catch (error) {
        Common.error('fetchTypes', error);
      }
    };

    fetchTypes();
  }, [issueFound]);

  const fetchWorks = async (id: string) => {
    try {
      const res = await ticketService.getTypeOfWorkDD(id);
      if (res.success && res.data) {
        setWorks(res.data);
        setWorkId(''); // Reset work selection
      }
    } catch (error) {
      Common.error('fetchWorks', error);
    }
  };

  const handleImageResponse = useCallback((response: ImagePickerResponse) => {
    Common.log('=== IMAGE PICKER RESPONSE START ===');
    Common.log('Full response:', JSON.stringify(response, null, 2));

    if (response.didCancel) {
      Common.log('User cancelled image selection');
      return;
    }

    if (response.errorCode) {
      Common.error('ImagePicker ErrorCode:', response.errorCode);
      Common.showToast(`Error: ${response.errorCode}`);
      return;
    }

    if (response.errorMessage) {
      Common.error('ImagePicker ErrorMessage:', response.errorMessage);
      Common.showToast(`Error: ${response.errorMessage}`);
      return;
    }

    if (!response.assets || response.assets.length === 0) {
      Common.log('No assets found in response');
      Common.showToast('No images selected');
      return;
    }

    Common.log('Processing assets:', response.assets.length);

    const newImages: string[] = [];

    response.assets.forEach((asset, index) => {
      Common.log(`Processing asset ${index}:`, {
        uri: asset.uri,
        fileName: asset.fileName,
        type: asset.type,
        fileSize: asset.fileSize,
        hasBase64: !!asset.base64,
      });

      if (asset.base64 && asset.base64.length > 0) {
        newImages.push(`data:image/jpeg;base64,${asset.base64}`);
        Common.log(`Asset ${index}: Added via base64`);
      } else if (asset.uri) {
        newImages.push(asset.uri);
        Common.log(`Asset ${index}: Added via URI`);
      } else {
        Common.log(`Asset ${index}: Skipped - no valid data`);
      }
    });

    Common.log('Successfully processed images:', newImages.length);
    Common.log('=== IMAGE PICKER RESPONSE END ===');

    if (newImages.length > 0) {
      setImages(prevImages => {
        const combined = [...prevImages, ...newImages];
        const final = combined.slice(0, 5); // Max 5 images
        Common.showToast(`${newImages.length} image(s) added successfully`);
        Common.log('Updated image state:', final.length);
        return final;
      });
    } else {
      Common.showToast('Failed to process images');
    }
  }, []);

  const openCamera = useCallback(async () => {
    Common.log('=== OPENING CAMERA ===');

    // Camera ke liye SIRF camera permission check karo
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera access to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Camera Permission Required',
            'Please allow camera access to take photos.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
            ],
          );
          return;
        }
      } catch (error) {
        Common.error('Camera permission error:', error);
        return;
      }
    }

    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      saveToPhotos: false,
      cameraType: 'back' as const,
    };

    setTimeout(() => {
      launchCamera(options, handleImageResponse);
    }, 300);
  }, [handleImageResponse]);

  const openGallery = useCallback(async () => {
    Common.log('=== OPENING GALLERY ===');

    if (Platform.OS === 'android') {
      try {
        let permission;
        const androidVersion = Platform.Version;

        // Android 13+ ke liye different permission
        if (androidVersion >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        } else {
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Storage Permission',
          message: 'App needs storage access to select photos from gallery',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Storage Permission Required',
            'Please allow storage access to select photos.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()},
            ],
          );
          return;
        }
      } catch (error) {
        Common.error('Storage permission error:', error);
        return;
      }
    }

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      Common.showToast('Maximum 5 images allowed');
      return;
    }

    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: remainingSlots,
    };

    setTimeout(() => {
      launchImageLibrary(options, handleImageResponse);
    }, 300);
  }, [images.length, handleImageResponse]);

  const showImagePicker = useCallback(() => {
    if (images.length >= 5) {
      Common.showToast('Maximum 5 images allowed');
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Camera',
          onPress: () => {
            Common.log('User selected Camera');
            openCamera();
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            Common.log('User selected Gallery');
            openGallery();
          },
        },
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true},
    );
  }, [images.length, openCamera, openGallery]);

  const removeImage = useCallback((index: number) => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setImages(prev => {
            const updated = prev.filter((_, i) => i !== index);
            Common.showToast('Image removed');
            Common.log('Image removed, remaining:', updated.length);
            return updated;
          });
        },
      },
    ]);
  }, []);

  /* ───────── Validation & Submit ───────── */
  const validate = useCallback(() => {
    if (!selChId) {
      return 'Please select a chamber';
    }
    if (!remark.trim()) {
      return 'Please enter remark';
    }
    if (issueFound && (!typeId || !workId)) {
      return 'Please complete issue details';
    }
    return '';
  }, [selChId, remark, issueFound, typeId, workId]);

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    if (!isNet) {
      Alert.alert('No Internet', 'Please check your internet connection');
      return;
    }

    setSubmitting(true);

    try {
      let result;

      // ✅ Get selected chamber info
      const selectedChamber = chambers.find(c => c.id === selChId);

      if (issueFound) {
        const payload = {
          assignTaskId: ticketId,
          chamberId: selChId,
          remark: remark.trim(),
          typeId,
          typeOfWorkId: workId,
          image: images[0]
            ? {
                imageData: images[0].includes('base64,')
                  ? images[0].split('base64,')[1]
                  : images[0],
                imageExtention: 'jpg',
              }
            : undefined,
        };

        Common.log('🔍 Submitting complaint follow-up:', payload);

        // ✅ Pass GPS and chamber info
        result = await ticketService.addComplaintFollowUp(
          payload,
          gps,
          selectedChamber,
        );
      } else {
        Common.log('🔍 Submitting simple follow-up:', {
          ticketId,
          chamberId: selChId,
          remark,
          imageCount: images.length,
          gps,
          selectedChamber: selectedChamber?.name,
        });

        // ✅ Pass GPS and chamber info
        result = await ticketService.addFollowUp(
          ticketId,
          selChId ?? '',
          remark,
          images,
          gps,
          selectedChamber,
        );
      }

      Common.log('🔍 Submit result:', result);

      Alert.alert(
        result.success ? 'Success' : 'Failed',
        result.message ||
          (result.success
            ? 'Follow-up submitted successfully'
            : 'Failed to submit follow-up'),
        [
          {
            text: 'OK',
            onPress: () => {
              if (result.success) {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (error) {
      Common.error('handleSubmit', error);
      Alert.alert('Error', 'Failed to submit follow-up. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ───────── Event Handlers (KEYBOARD FIXED) ───────── */
  const handleRemarkFocus = useCallback(() => {
    // Scroll to bottom when remark field is focused
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 500); // Increased delay for better UX
  }, []);

  /* ───────── Render Functions ───────── */
  const renderChamber = useCallback(
    ({item}: {item: Chamber}) => (
      <ChamberCard
        item={item}
        selected={item.id === selChId}
        onSelect={() => setSelChId(item.id)}
      />
    ),
    [selChId],
  );

  const renderDropdownPicker = useCallback(
    (
      label: string,
      selectedValue: string,
      items: DDItem[],
      onSelect: (id: string) => void,
      placeholder: string = 'Select',
    ) => (
      <View style={styles.dropdownContainer}>
        <Text style={styles.secLbl}>{label}</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            if (items.length === 0) {
              Common.showToast('No options available');
              return;
            }

            Alert.alert(label, 'Choose an option', [
              ...items.map(item => ({
                text: item.name,
                onPress: () => onSelect(item.id),
              })),
              {text: 'Cancel', style: 'cancel'},
            ]);
          }}
          activeOpacity={0.7}>
          <Text
            style={[styles.pickTxt, !selectedValue && styles.pickPlaceholder]}>
            {items.find(item => item.id === selectedValue)?.name || placeholder}
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [],
  );

  /* ───────── Main Render (BOTH FIXES APPLIED) ───────── */
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      <Header onBack={() => navigation.goBack()} />

      <TicketInfo ticketData={ticketData} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.centerTxt}>Loading chambers...</Text>
        </View>
      ) : chambers.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerTxt}>No chambers found nearby</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchChambers}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          <FlatList
            ref={flatListRef}
            data={chambers}
            keyExtractor={item => item.id}
            renderItem={renderChamber}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={styles.formSection}>
                {/* Issue Found Section */}
                <Text style={styles.secLbl}>Issue found?</Text>
                <View style={styles.radioRow}>
                  {['Yes', 'No'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.radioWrap}
                      onPress={() => setIssueFound(option === 'Yes')}
                      activeOpacity={0.7}>
                      <View
                        style={[
                          styles.rDot,
                          issueFound === (option === 'Yes') && styles.rDotSel,
                        ]}
                      />
                      <Text style={styles.rTxt}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Issue Type & Work Type */}
                {issueFound && (
                  <>
                    {renderDropdownPicker(
                      'Issue Type',
                      typeId,
                      types,
                      id => {
                        setTypeId(id);
                        setWorkId('');
                        fetchWorks(id);
                      },
                      'Select Issue Type',
                    )}

                    {typeId &&
                      renderDropdownPicker(
                        'Work Type',
                        workId,
                        works,
                        setWorkId,
                        'Select Work Type',
                      )}
                  </>
                )}

                {/* Remark Section - KEYBOARD FIXED */}
                <RemarkSection
                  remark={remark}
                  onRemarkChange={setRemark}
                  onFocus={handleRemarkFocus}
                />

                {/* Photo Section - IMAGE PICKER FIXED */}
                <PhotoSection
                  images={images}
                  onAddImage={showImagePicker}
                  onRemoveImage={removeImage}
                />

                {/* Submit Section */}
                <SubmitButton
                  onSubmit={handleSubmit}
                  loading={submitting}
                  disabled={!!validate()}
                  validationError={validate()}
                  isOnline={isNet}
                />

                {/* Extra space for keyboard */}
                <View style={styles.keyboardSpacer} />
              </View>
            }
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/* ═══════════════ STYLES (UPDATED WITH FIXES) ═══════════════ */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  keyboardContainer: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backBtn: {
    padding: SIZE.MS(8),
    borderRadius: SIZE.MS(20),
  },
  backTxt: {
    color: '#fff',
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
  },
  hTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
  },

  /* Ticket Info */
  tktBox: {
    padding: SIZE.MS(16),
    borderBottomWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    backgroundColor: '#f8f9fa',
  },
  tktNo: {
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  tktCust: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_MEDIUM,
    marginTop: SIZE.MVS(2),
  },

  /* List - KEYBOARD FIX */
  listContent: {
    padding: SIZE.MS(16),
    paddingBottom: SIZE.MVS(50), // Extra padding for keyboard
  },

  /* Chamber Card */
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: SIZE.MS(8),
    padding: SIZE.MS(12),
    marginBottom: SIZE.MVS(8),
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardSel: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#e8f4f8',
    borderWidth: 2,
  },
  cardTtl: {
    fontSize: SIZE.MS(14),
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  cardAddr: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_MEDIUM,
    marginTop: SIZE.MVS(2),
  },
  cardMeta: {
    fontSize: SIZE.MS(10),
    color: COLORS.TEXT_LIGHT,
    marginTop: SIZE.MVS(2),
  },
  cardRt: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: SIZE.MS(60),
  },
  cardDist: {
    fontSize: SIZE.MS(12),
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  cardRoute: {
    fontSize: SIZE.MS(10),
    color: COLORS.TEXT_LIGHT,
  },

  /* Form Section */
  formSection: {
    marginTop: SIZE.MVS(8),
  },
  secLbl: {
    marginTop: SIZE.MVS(16),
    marginBottom: SIZE.MVS(8),
    fontWeight: '600',
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
  },

  /* Radio Buttons */
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZE.MS(24),
    paddingVertical: SIZE.MVS(4),
  },
  rDot: {
    width: SIZE.MS(18),
    height: SIZE.MS(18),
    borderRadius: SIZE.MS(9),
    borderWidth: 2,
    borderColor: COLORS.TEXT_LIGHT,
    marginRight: SIZE.MS(8),
  },
  rDotSel: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  rTxt: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
  },

  /* Dropdown */
  dropdownContainer: {
    marginBottom: SIZE.MVS(4),
  },
  picker: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: SIZE.MS(8),
    padding: SIZE.MS(14),
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pickTxt: {
    color: COLORS.TEXT_DARK,
    fontSize: SIZE.MS(14),
  },
  pickPlaceholder: {
    color: COLORS.TEXT_LIGHT,
  },

  /* ═══ REMARK SECTION STYLES (KEYBOARD FIXED) ═══ */
  remarkSection: {
    marginTop: SIZE.MVS(8),
  },
  remarkContainer: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: SIZE.MS(8),
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  remarkInput: {
    minHeight: SIZE.MVS(100),
    padding: SIZE.MS(12),
    textAlignVertical: 'top',
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    fontFamily: 'System',
    lineHeight: SIZE.MS(20),
  },

  /* ═══ PHOTO SECTION STYLES (IMAGE PICKER FIXED) ═══ */
  photoSection: {
    marginTop: SIZE.MVS(16),
  },
  photoHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZE.MVS(8),
  },
  addPhotoBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(8),
    borderRadius: SIZE.MS(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addPhotoBtnDisabled: {
    backgroundColor: COLORS.DISABLED,
    elevation: 0,
  },
  addPhotoTxt: {
    color: '#fff',
    fontSize: SIZE.MS(13),
    fontWeight: '600',
  },
  addPhotoTxtDisabled: {
    color: COLORS.TEXT_LIGHT,
  },
  imageScroll: {
    marginTop: SIZE.MVS(8),
  },
  imageScrollContent: {
    paddingRight: SIZE.MS(16),
  },
  imageContainer: {
    position: 'relative',
    marginRight: SIZE.MS(10),
  },
  photo: {
    width: SIZE.MS(80),
    height: SIZE.MS(80),
    borderRadius: SIZE.MS(8),
    backgroundColor: COLORS.CARD_BORDER,
  },
  removeOverlay: {
    position: 'absolute',
    top: -SIZE.MS(5),
    right: -SIZE.MS(5),
    backgroundColor: COLORS.ERROR,
    width: SIZE.MS(22),
    height: SIZE.MS(22),
    borderRadius: SIZE.MS(11),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  removeText: {
    color: '#fff',
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
    lineHeight: SIZE.MS(18),
  },

  /* ═══ SUBMIT SECTION STYLES ═══ */
  submitSection: {
    marginTop: SIZE.MVS(24),
    marginBottom: SIZE.MVS(20),
  },
  subBtn: {
    backgroundColor: COLORS.SUCCESS,
    padding: SIZE.MS(16),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  subBtnDis: {
    backgroundColor: COLORS.DISABLED,
    elevation: 0,
  },
  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZE.MS(16),
  },

  /* Error Text */
  errTxt: {
    color: COLORS.ERROR,
    fontSize: SIZE.MS(12),
    textAlign: 'center',
    marginTop: SIZE.MVS(8),
    fontStyle: 'italic',
  },

  /* Center Content */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZE.MS(20),
  },
  centerTxt: {
    marginTop: SIZE.MVS(10),
    color: COLORS.TEXT_MEDIUM,
    fontSize: SIZE.MS(14),
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: SIZE.MVS(16),
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(20),
    paddingVertical: SIZE.MVS(10),
    borderRadius: SIZE.MS(6),
  },
  retryTxt: {
    color: '#fff',
    fontWeight: '600',
  },

  /* ═══ KEYBOARD FIX STYLES ═══ */
  keyboardSpacer: {
    height: SIZE.MVS(200), // Extra space for keyboard
    backgroundColor: 'transparent',
  },
});
