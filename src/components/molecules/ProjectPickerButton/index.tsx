import {COLORS, IMAGES, SIZE} from '@res';
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
  StyleSheet,
  Alert,
  Linking,
  type ViewStyle,
  type StyleProp,
  Platform,
  Image,
} from 'react-native';
import {Screen} from '@organisms';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DeviceEventEmitter} from 'react-native';
export type ProjectItem = {
  id: string;
  code: string;
  name: string;
  startAddress?: string;
  endAddress?: string;
  spDistanceM?: number;
  epDistanceM?: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
};

type ProjectPickerButtonProps = {
  value?: ProjectItem | null;
  projects: ProjectItem[];
  onSelect: (p: ProjectItem) => void;
  /** UPDATED: pass selected range (in meters) back to parent */
  onReload?: (rangeM: number) => void;
  title?: string;
  variant?: 'inline' | 'floating';
  containerStyle?: StyleProp<ViewStyle>;
  top?: number;
};

const EVENT_SHOW_PROJECT_POINTS = 'SHOW_PROJECT_POINTS';
const PAGE_SIZE = 10;

const ProjectPickerButton: React.FC<ProjectPickerButtonProps> = ({
  value,
  projects,
  onSelect,
  onReload,
  title = 'Select Project',
  variant = 'inline',
  containerStyle,
  top = 8,
}) => {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const wrapStyle: StyleProp<ViewStyle> = [
    variant === 'floating' && {
      position: 'absolute',
      left: SIZE.MS(12),
      right: SIZE.MS(12),
      top: SIZE.MS(top) + insets.top + 50,
      zIndex: 1000,
      elevation: 12,
      pointerEvents: 'box-none',
    },
    containerStyle,
  ];
  return (
    <>
      <View style={wrapStyle}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setOpen(true)}
          style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={styles.bulb}>
              <Text style={{fontSize: 14}}>💡</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {value ? `${value.name}` : title}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ProjectPickerModal
        visible={open}
        projects={projects}
        onClose={() => setOpen(false)}
        onSelect={p => {
          setOpen(false);
          onSelect(p);
        }}
        onReload={onReload}
      />
    </>
  );
};

export default ProjectPickerButton;

type ModalProps = {
  visible: boolean;
  projects: ProjectItem[];
  onClose: () => void;
  onSelect: (p: ProjectItem) => void;
  onReload?: (rangeM: number) => void;
};

const RANGE_PRESETS: Array<{label: string; m: number}> = [
  {label: '<200m', m: 200},
  {label: '<500m', m: 500},
  {label: '<1km', m: 1000},
  {label: '<5km', m: 5000},
];

const ProjectPickerModal: React.FC<ModalProps> = ({
  visible,
  projects,
  onClose,
  onSelect,
  onReload,
}) => {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [rangeM, setRangeM] = useState<number>(200);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return projects;
    return projects.filter(p => {
      const blob = `${p.code} ${p.name} ${p.startAddress ?? ''} ${
        p.endAddress ?? ''
      }`.toLowerCase();
      return blob.includes(t);
    });
  }, [q, projects]);
  useEffect(() => {
    if (!visible) return;
    setLimit(PAGE_SIZE);
    setRangeM(200);
  }, [q, visible]);

  const baseList = filtered;
  const visibleProjects = useMemo(
    () => baseList.slice(0, Math.min(limit, baseList.length)),
    [baseList, limit],
  );

  const resultsCount = filtered.length;

  const handleEndReached = () => {
    if (limit >= baseList.length) return;
    setLimit(curr => Math.min(curr + PAGE_SIZE, baseList.length));
  };

  // Directions: use coords if available, else address string. No origin needed.
  const openDirectionsTo = async (item: ProjectItem, toStart: boolean) => {
    const lat = toStart ? item.startLat : item.endLat;
    const lng = toStart ? item.startLng : item.endLng;
    const addr = toStart ? item.startAddress : item.endAddress;

    let destParam: string | null = null;
    if (typeof lat === 'number' && typeof lng === 'number') {
      destParam = `${lat},${lng}`;
    } else if (addr && addr.trim().length > 0) {
      destParam = addr.trim();
    }

    if (!destParam) {
      Alert.alert('Address not found', 'Could not locate the destination.');
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        const apple = `http://maps.apple.com/?daddr=${encodeURIComponent(
          destParam,
        )}`;
        const canApple = await Linking.canOpenURL(apple);
        if (canApple) {
          await Linking.openURL(apple);
          return;
        }
      }
      const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destParam,
      )}`;
      const canG = await Linking.canOpenURL(gmaps);
      if (canG) {
        await Linking.openURL(gmaps);
      } else {
        Alert.alert('No Maps app available');
      }
    } catch {
      Alert.alert('Error', 'Failed to open directions.');
    }
  };

  // Select → emit to map with whatever coords are already on the item
  const handleSelectAndShowOnMap = (item: ProjectItem) => {
    const sp =
      typeof item.startLat === 'number' && typeof item.startLng === 'number'
        ? {latitude: item.startLat, longitude: item.startLng}
        : null;
    const ep =
      typeof item.endLat === 'number' && typeof item.endLng === 'number'
        ? {latitude: item.endLat, longitude: item.endLng}
        : null;

    DeviceEventEmitter.emit(EVENT_SHOW_PROJECT_POINTS, {
      projectId: item.id,
      name: item.name,
      sp,
      ep,
    });

    onSelect(item);
    onClose();
  };

  const renderItem = ({item}: {item: ProjectItem}) => {
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.cell}>
        <View style={styles.cellIconWrap}>
          <Text style={{fontSize: SIZE.MS(18)}}>💡</Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.projCode} numberOfLines={1}>
            PROJ-CODE : {item.code}
          </Text>
          <Text style={styles.projName} numberOfLines={1}>
            PROJ-NAME : {item.name}
          </Text>

          {!!item.startAddress && (
            <>
              <View style={[styles.addrRow, {marginTop: SIZE.MS(10)}]}>
                <View style={[styles.addrBadge, {backgroundColor: '#65c3ff'}]}>
                  <Text style={styles.addrBadgeTxt}>SP</Text>
                </View>
                <Text style={styles.addrLink} numberOfLines={1}>
                  {item.startAddress}
                </Text>
              </View>
              <View style={styles.subRow}>
                <View style={{flex: 1}} />
                <TouchableOpacity
                  onPress={() => handleSelectAndShowOnMap(item)}
                  style={[styles.actionBtn, styles.actionBtnBlue]}>
                  <Image
                    style={[styles.actionBtnIcon, {tintColor: '#fbec5d'}]}
                    source={IMAGES.select}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGreen]}
                  onPress={() => openDirectionsTo(item, true)}>
                  <Image
                    style={styles.actionBtnIcon}
                    source={IMAGES.destination}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {!!item.endAddress && (
            <>
              <View style={[styles.addrRow, {marginTop: SIZE.MS(2)}]}>
                <View style={[styles.addrBadge, {backgroundColor: '#f06292'}]}>
                  <Text style={styles.addrBadgeTxt}>EP</Text>
                </View>
                <Text style={styles.addrLink} numberOfLines={1}>
                  {item.endAddress}
                </Text>
              </View>
              <View style={styles.subRow}>
                <View style={{flex: 1}} />
                <TouchableOpacity
                  onPress={() => handleSelectAndShowOnMap(item)}
                  style={[styles.actionBtn, styles.actionBtnBlue]}>
                  <Image
                    style={[styles.actionBtnIcon, {tintColor: '#fbec5d'}]}
                    source={IMAGES.select}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGreen]}
                  onPress={() => openDirectionsTo(item, false)}>
                  <Image
                    style={styles.actionBtnIcon}
                    source={IMAGES.destination}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex: 1, backgroundColor: '#e8f0fe'}}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROJECTS ({resultsCount})</Text>
        </View>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search"
            value={q}
            onChangeText={text => {
              setQ(text);
              setLimit(PAGE_SIZE);
            }}
            style={styles.searchInput}
            placeholderTextColor="#7f8c8d"
          />
          {q ? (
            <TouchableOpacity onPress={() => setQ('')} style={styles.clearBtn}>
              <Text style={{fontSize: 16}}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* NEW: Range boxes */}
        <View style={styles.rangeWrap}>
          {RANGE_PRESETS.map(p => {
            const active = rangeM === p.m;
            return (
              <TouchableOpacity
                key={p.m}
                onPress={() => {
                  setRangeM(p.m);
                  // fire API immediately with selected range
                  onReload?.(p.m);
                }}
                style={[styles.rangeBtn, active && styles.rangeBtnActive]}>
                <Text style={[styles.rangeBtnTxt, active && {color: '#fff'}]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={visibleProjects}
          keyExtractor={it => it.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: SIZE.MS(12),
            paddingBottom: SIZE.MVS(80),
          }}
          ItemSeparatorComponent={() => <View style={{height: SIZE.MS(10)}} />}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: SIZE.MS(20)}}>
              <Text style={{color: '#334155'}}>No projects found</Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerBtn, {backgroundColor: '#94a3b8'}]}
            onPress={onClose}>
            <Text style={styles.footerBtnTxt}>DISMISS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              {backgroundColor: onReload ? COLORS.PRIMARY : '#cbd5e1'},
            ]}
            onPress={() => onReload?.(rangeM)}
            disabled={!onReload}>
            <Text style={styles.footerBtnTxt}>RELOAD</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    paddingHorizontal: SIZE.MS(14),
    paddingVertical: SIZE.MVS(12),
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: SIZE.MS(6),
    shadowOffset: {width: 0, height: 3},
  },
  cardLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  bulb: {
    height: SIZE.MS(28),
    width: SIZE.MS(28),
    borderRadius: SIZE.MS(14),
    backgroundColor: '#fff7cc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZE.MS(10),
  },
  cardTitle: {fontSize: SIZE.MS(15), fontWeight: '600', color: '#1f2937'},
  header: {
    height: SIZE.MS(48),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
  },
  headerTitle: {
    fontSize: SIZE.MS(15),
    color: COLORS.WHITE,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchWrap: {
    marginHorizontal: SIZE.MS(12),
    marginTop: SIZE.MS(12),
    borderRadius: SIZE.MS(12),
    paddingHorizontal: SIZE.MS(12),
    backgroundColor: COLORS.WHITE,
    paddingVertical: Platform.OS === 'ios' ? SIZE.MVS(10) : SIZE.MVS(4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {flex: 1, fontSize: SIZE.MS(15), color: '#111827'},
  clearBtn: {
    marginLeft: SIZE.MS(8),
    paddingHorizontal: SIZE.MS(6),
    paddingVertical: SIZE.MVS(4),
  },

  /* NEW: range styles */
  rangeWrap: {
    flexDirection: 'row',
    gap: SIZE.MS(8),
    marginHorizontal: SIZE.MS(12),
    marginTop: SIZE.MS(10),
  },
  rangeBtn: {
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MVS(6),
    borderRadius: SIZE.MS(16),
    backgroundColor: '#e5e7eb',
  },
  rangeBtnActive: {
    backgroundColor: '#1d4ed8',
  },
  rangeBtnTxt: {
    fontSize: SIZE.MS(12),
    fontWeight: '700',
    color: '#0f172a',
  },

  cell: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    padding: SIZE.MS(12),
  },
  cellIconWrap: {
    width: SIZE.MS(28),
    height: SIZE.MS(28),
    alignItems: 'center',
    paddingTop: SIZE.MS(2),
    marginRight: SIZE.MS(10),
  },
  projCode: {fontSize: SIZE.MS(13), fontWeight: '700', color: '#111827'},
  projName: {
    marginTop: SIZE.MS(2),
    fontSize: SIZE.MS(13),
    fontWeight: '700',
    color: '#374151',
  },
  addrRow: {flexDirection: 'row', alignItems: 'center'},
  addrBadge: {
    width: SIZE.MS(26),
    height: SIZE.MS(26),
    borderRadius: SIZE.MS(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZE.MS(10),
  },
  addrBadgeTxt: {color: COLORS.WHITE, fontWeight: '700', fontSize: SIZE.MS(12)},
  addrLink: {
    flex: 1,
    fontSize: SIZE.MS(13),
    fontWeight: '700',
    color: '#2563eb',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZE.MS(8),
  },
  actionBtn: {
    width: SIZE.MS(40),
    height: SIZE.MS(40),
    borderRadius: SIZE.MS(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZE.MS(10),
  },
  actionBtnBlue: {backgroundColor: '#1d4ed8'},
  actionBtnGreen: {backgroundColor: '#22c55e'},
  actionBtnTxt: {fontSize: SIZE.MS(18), color: COLORS.WHITE},
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginVertical: SIZE.MS(10),
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 15 : 0,
    flexDirection: 'row',
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MS(12),
    backgroundColor: '#e8f0fe',
    gap: SIZE.MS(12),
  },
  footerBtn: {
    flex: 1,
    height: SIZE.MS(48),
    borderRadius: SIZE.MS(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnTxt: {color: COLORS.WHITE, fontWeight: '800', letterSpacing: 0.6},
  actionBtnIcon: {
    height: SIZE.MS(20),
    width: SIZE.MS(20),
    resizeMode: 'contain',
  },
});
