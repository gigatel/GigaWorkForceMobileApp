import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ImagePicker, {
  Image as PickerImage,
} from 'react-native-image-crop-picker';
import {COLORS, IMAGES, SIZE} from '@res';
import {useDispatch} from 'react-redux';
import type {StoreDispatch} from '@reducers';
import {closeTicketFollowup, holdTicketApi} from '@slices/tickets.slice';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '@navigation/navigator';
import CheckBox from '@react-native-community/checkbox';
import {useSelector} from 'react-redux';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Preferences, Location, Common} from '@utils';
import type {DataType} from '@types';
import {height} from 'src/utils/common';
import RNPickerSelect from 'react-native-picker-select';
import {getRFOListApi} from '@slices/tickets.slice';
type Props = {
  onSubmit?: (payload: {
    location?: {lat?: number; lng?: number; address?: string};
    photos: PickerImage[];
    remarks: string;
  }) => void;
  onCancel?: () => void;
  assignTaskId?: number;
};

type StartTicketRouteProp = RouteProp<RootStackParamList, 'HoldTicketScreen'>;

const DEFAULT_ASSIGN_TASK_ID = 8256;
const ADDR_ERR = 'Unable to fetch current location ...';

const HoldTicketScreen: React.FC<Props> = ({
  onSubmit,
  onCancel,
  assignTaskId,
}) => {
  const dispatch = useDispatch<StoreDispatch>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ---- Params ----
  const route = useRoute<StartTicketRouteProp>();
  const {ticket, assignTaskId: routeAssignTaskId, from} = route?.params ?? {};
  const {rfoList, rfoLoading, rfoError} = useSelector(
    (state: any) => state.tickets, // must match store key
  );

  const [toggleCheckBox, setToggleCheckBox] = useState(false);
  const [selectedRFO, setSelectedRFO] = useState<number | null>(null);
  const [status, setStatus] = useState(null); // "yes" or "no"
  const [materialName, setMaterialName] = useState('');
  // const rfoList = useSelector((state: any) => state.tickets?.rfoList ?? []);
  // UPDATED — use correct API fields
  const rfoPickerItems = useMemo(() => {
    return (rfoList ?? []).map((item: any) => ({
      label: item.name, // FIXED
      value: item.id, // FIXED
    }));
  }, [rfoList]);

  const formatCutLocation = (loc?: string) => {
    if (!loc) return '—';

    // Try to split by comma or space
    const parts = loc
      .split(/[,\s]+/)
      .map(p => p.trim())
      .filter(Boolean);
    if (parts.length < 2) return loc; // fallback if not two numbers

    const [lat, lng] = parts;

    // Format both to 3 decimals if valid numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!isFinite(latNum) || !isFinite(lngNum)) return loc;

    return `${latNum.toFixed(3)}   ${lngNum.toFixed(3)}`;
  };

  useEffect(() => {
    console.log('[HoldTicketScreen] route params raw:', route?.params);
    console.log('[HoldTicketScreen] ticket summary:', {
      LinkId: ticket?.LinkId,
      assignId: ticket?.assignId,
      cutLocation: ticket?.cutLocation,
    });
    console.log('[HoldTicketScreen] route.assignTaskId:', routeAssignTaskId);
    console.log('[HoldTicketScreen] prop.assignTaskId:', assignTaskId);
    console.log('[HoldTicketScreen] from:', from);
  }, [route?.params, ticket, routeAssignTaskId, assignTaskId, from]);

  // ---- Local UI state ----
  const [locLoading, setLocLoading] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Start EMPTY – user must tap Fetch
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [photos, setPhotos] = useState<PickerImage[]>([]);
  const [remarks, setRemarks] = useState('');
  const fetchingRef = useRef(false);

  // ---- Helpers ----
  const preview = (s?: string, n = 80) =>
    typeof s === 'string' ? s.slice(0, n) + (s.length > n ? '…' : '') : '';

  const getExtFromMime = (mime?: string): string => {
    if (!mime) return 'jpg';
    const [, subtype] = String(mime).split('/');
    if (!subtype) return 'jpg';
    if (subtype.includes('jpeg')) return 'jpg';
    if (subtype.includes('png')) return 'png';
    if (subtype.includes('webp')) return 'webp';
    return 'jpg';
  };

  const toNum = (v: any): number | null => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
  };

  // ---- Fetch current address (no auto-prefill) ----
  const fetchLocation = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLocLoading(true);
    setAddrLoading(true);
    try {
      const data = (await Location.getAddressFromLatLong()) as
        | DataType['GeoAddress']
        | (DataType & {
            address?: string;
            lat?: number | string;
            lng?: number | string;
            long?: number | string; // some utils use "long"
            latitude?: number | string;
            longitude?: number | string;
          })
        | any;

      console.log('[fetchLocation] raw:', data);

      const resolvedAddr = data?.address ? String(data.address).trim() : '';
      setAddress(resolvedAddr || ADDR_ERR);

      // Map latitude/longitude from multiple possible keys
      const _lat = toNum(data?.lat ?? data?.latitude);
      const _lng = toNum(data?.lng ?? data?.long ?? data?.longitude);

      setLat(_lat ?? null);
      setLng(_lng ?? null);
    } catch (e) {
      console.warn('[fetchLocation] error:', e);
      setAddress(ADDR_ERR);
      setLat(null);
      setLng(null);
    } finally {
      setLocLoading(false);
      setAddrLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // ---- Auto-fetch on open/focus ----
  // Call fetchLocation when the screen mounts and every time it comes into focus.
  useEffect(() => {
    // initial fetch on mount
    fetchLocation();

    // also refetch when screen gains focus (useful when navigating back here)
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLocation();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchLocation, navigation]);
  useEffect(() => {
    dispatch(getRFOListApi());
  }, [dispatch]);
  useEffect(() => {
    if (rfoError) {
      Alert.alert('RFO Error', rfoError?.message ?? 'Failed to load RFO list');
    }
  }, [rfoError]);
  // ---- Image picking ----
  const logPickedImage = async (
    img: PickerImage,
    source: 'Camera' | 'Gallery',
  ) => {
    const anyImg = img as any;
    const base64: string | undefined = anyImg?.data;
    console.log(`[IMAGE PICKED - ${source}]`, {
      path: img.path,
      mime: anyImg?.mime,
      width: img.width,
      height: img.height,
      size: img.size,
      hasBase64: !!base64,
      base64Len: base64?.length ?? 0,
      base64Preview: preview(base64, 80),
    });
  };

  const canAddMore = photos.length < 2;
  const addPhoto = (img: PickerImage | null) => {
    if (!img?.path) return;
    setPhotos(prev => [...prev, img].slice(0, 2));
  };
  const removePhoto = (index: number) =>
    setPhotos(prev => prev.filter((_, i) => i !== index));

  // ---- Image picking (direct, no-crop) ----
  const pickImage = async (source: 'camera' | 'gallery') => {
    if (!canAddMore) return;

    try {
      let img: PickerImage | PickerImage[] | null = null;

      if (source === 'camera') {
        img = await ImagePicker.openCamera({
          mediaType: 'photo',
          cropping: false, // <-- NO cropping / editing UI
          compressImageQuality: 0.8,
          includeBase64: true, // keep base64 for your upload
          forceJpg: true,
          useFrontCamera: false,
        });
      } else {
        img = await ImagePicker.openPicker({
          mediaType: 'photo',
          cropping: false, // <-- NO cropping / editing UI
          compressImageQuality: 0.8,
          includeBase64: true,
          forceJpg: true,
          multiple: false,
        });
      }

      // image-picker returns a single object for single pick
      if (img && !Array.isArray(img)) {
        await logPickedImage(img, source === 'camera' ? 'Camera' : 'Gallery');
        addPhoto(img);
      }
    } catch (err) {
      // user cancelled or error — ignore silently (or log)
      console.log('[pickImage] cancelled / error', err?.message ?? err);
    }
  };

  // ---- Validation: require (1) address fetched OK (2) remarks (3) 2 photos
  const addressOk = useMemo(
    () => Boolean(address && address !== ADDR_ERR),
    [address],
  );
  const isValid = useMemo(() => {
    const remarksOk = remarks.trim().length >= 3;
    const rfoOk = Boolean(selectedRFO);
    const materialOk = status === 'yes' ? materialName.trim().length > 0 : true; // only required when YES
    return rfoOk && remarksOk && materialOk;
  }, [selectedRFO, remarks, status, materialName]);
  // ---- API transforms ----
  const toApiImage = (img?: PickerImage) => {
    if (!img) return undefined;
    const anyImg = img as any;
    const base64: string | undefined = anyImg?.data;
    if (!base64) return undefined;
    return {
      imageData: base64,
      imageExtention: getExtFromMime(anyImg?.mime),
    };
  };
  // ⬇️ Resolve assignTaskId (ticket > route > prop > default)
  const effectiveAssignTaskId = useMemo(() => {
    const fromTicket =
      typeof ticket?.assignId === 'number' && Number.isFinite(ticket.assignId)
        ? ticket.assignId
        : undefined;
    const fromRoute =
      typeof routeAssignTaskId === 'number' &&
      Number.isFinite(routeAssignTaskId)
        ? routeAssignTaskId
        : undefined;
    const fromProp =
      typeof assignTaskId === 'number' && Number.isFinite(assignTaskId)
        ? assignTaskId
        : undefined;
    const finalVal =
      fromTicket ?? fromRoute ?? fromProp ?? DEFAULT_ASSIGN_TASK_ID;
    console.log('[HoldTicketScreen] effectiveAssignTaskId:', {
      fromTicket,
      fromRoute,
      fromProp,
      used: finalVal,
    });
    return finalVal;
  }, [ticket?.assignId, routeAssignTaskId, assignTaskId]);
  // ✅ Read empId from Preferences
  const empId = useMemo(() => {
    const raw = Preferences?.getData?.('EMPLOYEE_ID');
    const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  // ---- Submit ----
  const handleStartTicket = useCallback(async () => {
    if (remarks.trim().length < 3) {
      Alert.alert('Remarks required', 'Please enter at least 3 characters.');
      return;
    }

    // 🔥 RFO validation
    if (!selectedRFO) {
      Alert.alert('RFO Required', 'Please select an RFO.');
      return;
    }

    // 🔥 IF status = YES validate material name

    try {
      setSubmitting(true);

      const res = await dispatch(
        holdTicketApi({
          assignTaskId: effectiveAssignTaskId,
          rfoId: selectedRFO, // ⭐ Added
          rfO_materialName: status === 'yes' ? materialName.trim() : '', // ⭐ Added
          remark: remarks.trim(),
        }),
      ).unwrap();

      console.log('[FOLLOWUP RESPONSE]', res);

      // navigation.goBack();
      if (res?.success) {
        Common.showToast('Ticket Hold successfully.');
        // navigation.navigate('TicketsList', {refresh: true});
        navigation.reset({
          index: 0,
          routes: [{name: 'TicketsList', params: {refresh: true}}],
        });
      } else {
        Alert.alert('Error', res?.message || 'Failed to Hold Ticket');
      }
    } catch (e: any) {
      console.warn('[FOLLOWUP ERROR]', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  }, [
    addressOk,
    photos,
    remarks,
    selectedRFO,
    status,
    materialName,
    lat,
    lng,
    dispatch,
    effectiveAssignTaskId,
    empId,
    navigation,
  ]);

  // ---- Guard if opened without params ----
  if (!ticket) {
    return (
      <View
        style={[
          styles.container,
          {alignItems: 'center', justifyContent: 'center'},
        ]}>
        <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
        <Text
          style={{
            color: COLORS.TEXT_DARKER,
            fontSize: SIZE.MS(14),
            paddingHorizontal: SIZE.MS(24),
            textAlign: 'center',
          }}>
          No ticket data received. Please open this screen from Ticket Details.
        </Text>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.primaryBtn, {marginTop: SIZE.MVS(16)}]}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- UI ----
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
          <Image style={styles.backImage} source={IMAGES.back} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hold Ticket</Text>
        <View style={{width: SIZE.MS(24)}} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{paddingBottom: SIZE.MVS(28)}}
        showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={[styles.card, {borderColor: COLORS.PRIMARY}]}>
          <Text style={styles.sectionTitle}>Ticket Summary</Text>
          <Text style={styles.metaRow}>
            <Text style={styles.metaKey}>Link ID:</Text> {ticket.LinkId || '—'}
          </Text>
          <Text style={styles.metaRow}>
            <Text style={styles.metaKey}>Fault:</Text>{' '}
            {ticket.natureOfFault || '—'}
          </Text>
          <Text style={styles.metaRow}>
            <Text style={styles.metaKey}>Cut Location:</Text>{' '}
            {formatCutLocation(ticket.cutLocation)}
          </Text>
          <Text style={styles.metaRow}>
            <Text style={styles.metaKey}>Cut Address:</Text>{' '}
            {ticket.address || '—'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select RFO</Text>

          {rfoLoading && (
            <Text style={{color: COLORS.PRIMARY}}>Loading RFO list…</Text>
          )}

          <RNPickerSelect
            onValueChange={value => setSelectedRFO(value)}
            items={rfoPickerItems}
            value={selectedRFO}
            placeholder={{label: 'Select RFO…', value: null}}
            useNativeAndroidPickerStyle={false}
            style={{
              inputIOS: styles.pickerInput,
              inputAndroid: styles.pickerInput,
            }}
          />
        </View>
        {/* --------------------- END RFO SECTION --------------------- */}

        {/* Rest UI (address, photos, checkbox, remarks, submit) remains SAME */}
        {/* Current Address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Address</Text>
          <View style={styles.rowBetween}>
            <View style={{flex: 1, paddingRight: SIZE.MS(12)}}>
              <Text style={styles.addressValue}>
                {locLoading || addrLoading
                  ? 'Fetching current address…'
                  : address || '—'}
              </Text>
              {!address && !(locLoading || addrLoading) && (
                <Text style={styles.helperTextSmall}>
                  Tap “Fetch” to resolve address from GPS.
                </Text>
              )}
              {address === ADDR_ERR && (
                <Text
                  style={[
                    styles.helperTextSmall,
                    {color: COLORS.ERROR, marginTop: SIZE.MVS(6)},
                  ]}>
                  Could not fetch location. Please try again.
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={fetchLocation}
              style={[
                styles.primaryBtn,
                (locLoading || addrLoading) && styles.disabledBtn,
              ]}
              disabled={locLoading || addrLoading}>
              <Text style={styles.primaryBtnText}>
                {locLoading || addrLoading ? 'Fetching…' : 'Fetch'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Photos (2) */}
        {/* <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Pictures (2)</Text>
          <View style={styles.photosRow}>
            {photos.map((p, idx) => (
              <View key={idx} style={styles.photoWrap}>
                <Image source={{uri: p.path}} style={styles.photo} />
                <TouchableOpacity
                  onPress={() => removePhoto(idx)}
                  style={styles.removeBadge}>
                  <Text style={styles.removeBadgeText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {Array.from({length: Math.max(0, 2 - photos.length)}).map(
              (_, i) => (
                <TouchableOpacity
                  key={`slot-${i}`}
                  onPress={() => pickImage('camera')} // tap = camera
                  onLongPress={() => pickImage('gallery')} // long-press = gallery
                  style={styles.addSlot}
                  activeOpacity={0.8}>
                  <Text style={styles.addSlotPlus}>＋</Text>
                  <Text style={styles.addSlotText}>Add</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
          {photos.length < 2 && (
            <Text style={styles.helperText}>Add exactly 2 photos</Text>
          )}
        </View> */}
        <Text style={styles.checkTxtBox}>Select one checkbox*</Text>
        <View
          style={{
            flexDirection: 'row',
            marginLeft: SIZE.MS(10),
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <CheckBox
              disabled={false}
              value={status === 'yes'}
              onValueChange={() => {
                setStatus(status === 'yes' ? null : 'yes');
              }}
            />
            <Text style={{marginLeft: 8}}>YES</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 25,
            }}>
            <CheckBox
              disabled={false}
              value={status === 'no'}
              onValueChange={() => {
                setStatus(status === 'no' ? null : 'no');
              }}
            />
            <Text style={{marginLeft: 8}}>NO</Text>
          </View>
        </View>
        {status === 'yes' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Material Name</Text>
            <TextInput
              value={materialName}
              onChangeText={setMaterialName}
              placeholder="Enter material name…"
              placeholderTextColor={COLORS.TEXT_MEDIUM}
              style={styles.materialText}
            />
            <Text style={styles.countText}>
              {materialName.trim().length}/200
            </Text>
          </View>
        )}
        {/* Remarks */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Remarks</Text>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Type remarks here…"
            placeholderTextColor={COLORS.TEXT_MEDIUM}
            multiline
            textAlignVertical="top"
            style={styles.remarksInput}
            maxLength={500}
          />
          <Text style={styles.countText}>{remarks.trim().length}/500</Text>
        </View>
        {/* Start */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startBtn,
              (!isValid || submitting) && styles.disabledBtn,
            ]}
            disabled={!isValid || submitting}
            onPress={handleStartTicket}>
            <Text style={styles.startBtnText}>
              {submitting ? 'SUBMITTING…' : 'Hold Ticket'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
export default HoldTicketScreen;
/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.BACKGROUND_DEFAULT},
  header: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MVS(20),
  },
  backBtn: {padding: SIZE.MS(8), marginRight: SIZE.MS(6)},
  backImage: {
    height: SIZE.MS(20),
    width: SIZE.MS(20),
    resizeMode: 'contain',
    tintColor: COLORS.WHITE,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: SIZE.MS(18),
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {flex: 1},

  card: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: SIZE.MS(14),
    marginTop: SIZE.MVS(12),
    borderRadius: SIZE.MS(10),
    padding: SIZE.MS(14),
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  sectionTitle: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARKER,
    fontWeight: '700',
    marginBottom: SIZE.MVS(10),
  },

  metaRow: {
    fontSize: SIZE.MS(12),
    color: COLORS.TEXT_DARKER,
    marginBottom: SIZE.MVS(4),
  },
  metaKey: {fontWeight: '700', color: COLORS.PRIMARY},

  rowBetween: {flexDirection: 'row', alignItems: 'center'},

  addressValue: {fontSize: SIZE.MS(13), color: COLORS.TEXT_DARKER},
  helperTextSmall: {
    fontSize: SIZE.MS(11),
    color: COLORS.TEXT_MEDIUM,
    marginTop: SIZE.MVS(4),
    fontStyle: 'italic',
  },

  primaryBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(14),
    paddingVertical: SIZE.MVS(10),
    borderRadius: SIZE.MS(8),
  },
  primaryBtnText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: '700',
  },
  disabledBtn: {opacity: 0.5},

  photosRow: {flexDirection: 'row', alignItems: 'center', gap: SIZE.MS(10)},
  photoWrap: {
    width: SIZE.MS(96),
    height: SIZE.MS(96),
    borderRadius: SIZE.MS(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  photo: {width: '100%', height: '100%', resizeMode: 'cover'},
  removeBadge: {
    position: 'absolute',
    top: SIZE.MS(4),
    right: SIZE.MS(4),
    width: SIZE.MS(22),
    height: SIZE.MS(22),
    borderRadius: SIZE.MS(11),
    backgroundColor: COLORS.ERROR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {color: COLORS.WHITE, fontWeight: '700'},

  addSlot: {
    width: SIZE.MS(96),
    height: SIZE.MS(96),
    borderRadius: SIZE.MS(8),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  addSlotPlus: {
    fontSize: SIZE.MS(28),
    color: COLORS.PRIMARY,
    lineHeight: SIZE.MS(28),
  },
  addSlotText: {
    color: COLORS.PRIMARY,
    fontSize: SIZE.MS(11),
    marginTop: SIZE.MVS(4),
  },
  helperText: {
    marginTop: SIZE.MVS(8),
    color: COLORS.TEXT_MEDIUM,
    fontSize: SIZE.MS(11),
  },
  remarksInput: {
    minHeight: SIZE.MVS(100),
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(8),
    padding: SIZE.MS(10),
    fontSize: SIZE.MS(13),
    color: COLORS.TEXT_DARKER,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  materialText: {
    minHeight: SIZE.MVS(40),
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(8),
    padding: SIZE.MS(10),
    fontSize: SIZE.MS(13),
    color: COLORS.TEXT_DARKER,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  countText: {
    marginTop: SIZE.MVS(6),
    color: COLORS.TEXT_MEDIUM,
    fontSize: SIZE.MS(11),
    textAlign: 'right',
  },
  footer: {marginHorizontal: SIZE.MS(14), marginTop: SIZE.MVS(16)},
  startBtn: {
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: SIZE.MVS(14),
    borderRadius: SIZE.MS(10),
    alignItems: 'center',
  },
  startBtnText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(14),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkTxtBox: {
    marginLeft: SIZE.MS(15),
    marginTop: SIZE.MVS(12),
    color: 'red',
    fontSize: SIZE.MS(12),
  },
  pickerInput: {
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: 8,
    color: COLORS.TEXT_DARKER,
  },
});
