/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons, RadioButton} from '@atoms';
import {COLORS, CONSTANT, FONTS, IMAGES, SIZE} from '@res';
import {DataType} from '@types';
import React, {FC, memo, useEffect, useState} from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NotFoundView} from '../../atoms/list-view/not-found';
import ModalSheet from '../modal-sheet';
import {Common} from '@utils';

interface OptionPickerSheetProps {
  show: boolean;
  enableSearch?: boolean;
  type: 'single' | 'multiple';
  rowType: DataType.SheetRowType;
  rowUniqueKey: string;
  searchKeys?: string[];
  title: string;
  data: any[];
  value: null | any;
  onDone: (value: any) => void;
  onClose: () => void;
}
export type SearchBarProps = {
  value: string;
  placeholder: string;
  onChangeText: (txt: string) => void;
  onClear: () => void;
};
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  placeholder,
  onChangeText,
  onClear,
}) => {
  return (
    <View style={styles.inputOuterView}>
      <Image source={IMAGES.search} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={COLORS.TEXT_PLACEHOLDER}
        style={styles.inputView}
        placeholder={placeholder}
      />
      {value !== '' && (
        <TouchableOpacity
          activeOpacity={0.65}
          onPress={onClear}
          style={styles.closeButtonView}>
          <Image style={styles.closeIcon} source={IMAGES.close} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const PatrollerLisItem = memo(({item}: {item: DataType.TodayBehalfOf}) => {
  return (
    <View style={styles.patItemView}>
      <View style={styles.nameCodeView}>
        <Text style={styles.patEmpCodeText}>{`${item.employeeCode} - `}</Text>
        <Text style={styles.patNameText}>{item.name}</Text>
      </View>
      <View style={styles.shiftIconView}>
        <Image
          source={
            item.isDay
              ? IMAGES.dayShift
              : item.isEvening
              ? IMAGES.eveningShift
              : IMAGES.nightShift
          }
          style={[
            styles.shiftIcon,
            item.isDay && styles.dayShiftIcon,
            item.isEvening && styles.eveningShiftIcon,
            item.isNight && styles.nightShiftIcon,
          ]}
        />
        <Text
          style={[
            styles.patShiftNameText,
            item.isDay && styles.patShiftNameTextDay,
            item.isEvening && styles.patShiftNameTextEvening,
          ]}>
          {item.shiftName}
        </Text>
      </View>
    </View>
  );
});
const DefaultLisItem = memo(({item}: {item: any}) => {
  return (
    <View style={styles.patItemView}>
      <Text style={styles.defaultNameText}>{item.name}</Text>
    </View>
  );
});

const LabelValueLisItem = memo(({item}: {item: any}) => {
  return (
    <View style={styles.patItemView}>
      <Text style={styles.defaultNameText}>{item.label}</Text>
    </View>
  );
});

const ChamberTaskLisItem = memo(({item}: {item: DataType.Chamber}) => {
  console.log('ChamberTaskLisItem', {item});
  // utils/formatDistance.ts
  const formatKmToMeters = (kmInput: number | string | null | undefined) => {
    const km = typeof kmInput === 'string' ? parseFloat(kmInput) : kmInput ?? 0;
    if (!isFinite(km)) return '0 m';
    const m = km * 1000000;
    // Pretty printing:
    // - < 1 m  -> keep 3 decimals (e.g., 0.402 m)
    // - 1–10 m -> keep 2 decimals (e.g., 9.53 m)
    // - 10–100 m -> 1 decimal
    // - >= 100 m -> no decimals
    let str: string;
    if (m < 1) str = m.toFixed(3);
    else if (m < 10) str = m.toFixed(2);
    else if (m < 100) str = m.toFixed(1);
    else str = Math.round(m).toString();

    // Trim trailing zeros like "0.400" -> "0.4", "1.00" -> "1"
    str = str.replace(/\.?0+$/, '');

    return `${str} m`;
  };

  return (
    <View style={styles.chamberItemView}>
      <Text
        style={
          styles.chamberNameText
        }>{`${item.chamberIdStr} - ${item.chamberName}`}</Text>
      <View style={styles.chamberDirButtonView}>
        <Text style={styles.chamberDistanceText}>
          {`Distance : ${formatKmToMeters(item?.distance ?? 0)}`}
        </Text>
        <Buttons
          type={'icon'}
          icon={IMAGES.mapDirection}
          iconStyle={styles.buttonIcons}
          viewStyle={styles.directionButon}
          onPress={() => {
            Common.openMaps(
              parseFloat(item?.chamberLat ?? '0'),
              parseFloat(item?.chamberLong ?? '0'),
            );
          }}
        />
      </View>
    </View>
  );
});

const NearestChamberLisItem = memo(
  ({item}: {item: DataType.NearestChamber}) => {
    return (
      <View style={styles.chamberItemView}>
        <Text style={styles.chamberNameText}>
          {`${item?.chamber_id ?? ''} - `}
          <Text
            style={[
              styles.chamberNameText,
              {color: COLORS.CARD_DESCRIPTION},
            ]}>{`${item?.chamber_name ?? ''}`}</Text>
        </Text>
        <Text style={styles.chamberDistanceText}>{`${
          item?.chamber_address ?? ''
        }`}</Text>
      </View>
    );
  },
);
const CustomerLisItem = memo(({item}: {item: any}) => {
  return (
    <View style={styles.customerItemView}>
      <Image
        source={IMAGES.Customer}
        style={{
          width: SIZE.MS(25),
          height: SIZE.MS(25),
          marginRight: SIZE.MS(10),
        }}
      />
      <Text style={styles.chamberDistanceText}>{`${
        item?.CustomerName ?? ''
      }`}</Text>
    </View>
  );
});
const CircuitLisItem = memo(({item}: {item: any}) => {
  return (
    <View style={styles.customerItemView}>
      <Image
        source={IMAGES.Circuit}
        style={{
          width: SIZE.MS(25),
          height: SIZE.MS(25),
          marginRight: SIZE.MS(10),
          tintColor: COLORS.PRIMARY,
        }}
      />
      <Text style={styles.chamberDistanceText}>{`${item?.CircuitName ?? ''} (${
        item?.EndAddress ?? ''
      })`}</Text>
    </View>
  );
});

const OptionPickerSheet: FC<OptionPickerSheetProps> = ({
  show,
  enableSearch = true,
  rowUniqueKey = 'id',
  rowType = 'default',
  searchKeys,
  type,
  data,
  value,
  title,
  onClose,
  onDone,
}) => {
  const [selectedData, setSelectedData] = useState<any>([]);
  const [searchData, setSearchData] = useState<any>([]);
  const [searchText, setSearchText] = useState<string>('');
  const listRef = React.useRef<FlatList>(null);
  // utils/formatDistance.ts
  const formatKmToMeters = (kmInput: number | string | null | undefined) => {
    const km = typeof kmInput === 'string' ? parseFloat(kmInput) : kmInput ?? 0;
    if (!isFinite(km)) return '0 m';

    const m = km * 1000;

    // Pretty printing:
    // - < 1 m  -> keep 3 decimals (e.g., 0.402 m)
    // - 1–10 m -> keep 2 decimals (e.g., 9.53 m)
    // - 10–100 m -> 1 decimal
    // - >= 100 m -> no decimals
    let str: string;
    if (m < 1) str = m.toFixed(3);
    else if (m < 10) str = m.toFixed(2);
    else if (m < 100) str = m.toFixed(1);
    else str = Math.round(m).toString();

    // Trim trailing zeros like "0.400" -> "0.4", "1.00" -> "1"
    str = str.replace(/\.?0+$/, '');

    return `${str} m`;
  };

  useEffect(() => {
    if (
      value !== null &&
      value !== undefined &&
      show &&
      type === 'single' &&
      value.length > 0
    ) {
      setSelectedData(value);
      const validValue = value[0]; // Get the first item since it's single select
      if (
        validValue &&
        validValue[rowUniqueKey] !== null &&
        validValue[rowUniqueKey] !== undefined
      ) {
        const index = data?.findIndex(
          item =>
            item &&
            item[rowUniqueKey] !== null &&
            item[rowUniqueKey] !== undefined &&
            item[rowUniqueKey] === validValue[rowUniqueKey],
        );
        if (show && index > -1) {
          listRef.current?.scrollToIndex({
            index: index,
            animated: true,
            viewPosition: 0.5,
          });
        }
      }
    } else if (
      value !== null &&
      value !== undefined &&
      show &&
      type === 'multiple' &&
      value?.length > 0
    ) {
      setSelectedData(
        data?.filter(
          e =>
            e &&
            e[rowUniqueKey] !== null &&
            e[rowUniqueKey] !== undefined &&
            value?.some(
              (item: any) =>
                item &&
                item[rowUniqueKey] !== null &&
                item[rowUniqueKey] !== undefined &&
                item[rowUniqueKey] === e[rowUniqueKey],
            ),
        ),
      );
    }

    return () => {
      setSearchText('');
      setSearchData([]);
    };
  }, [data, rowUniqueKey, show, type, value]);

  return React.useMemo(() => {
    const onChangeText = (txt: string) => {
      if (!searchKeys) {
        setSearchData(data); // Or handle as needed
        setSearchText(txt);
        return;
      }

      const filteredData = data.filter((item: any) =>
        searchKeys.some(key => {
          const values = item[key];
          return (
            values != null &&
            values.toString().toLowerCase().includes(txt.toLowerCase())
          );
        }),
      );

      setSearchData(filteredData);
      setSearchText(txt);
    };
    const onDonePress = () => {
      if (selectedData?.length <= 0) {
        setSelectedData([]);
        onClosed();
      } else {
        onDone(selectedData);
        setSelectedData([]);
      }
    };

    const onClosed = () => {
      setSelectedData([]);
      onClose();
    };

    const onItemPress = (item: any, isAdded: boolean) => {
      let allData = [...selectedData];
      if (type === 'single') {
        setSelectedData([item]);
      } else {
        if (isAdded) {
          allData = allData.filter(
            el =>
              el &&
              el[rowUniqueKey] !== null &&
              el[rowUniqueKey] !== undefined &&
              el[rowUniqueKey] !== item[rowUniqueKey],
          );
        } else {
          allData.push(item);
        }
        setSelectedData(allData);
      }
    };

    const showListData = searchText === '' ? data : searchData;

    return (
      <ModalSheet
        show={show}
        title={title}
        primaryTitle={'Done'}
        closeTitle={'Close'}
        onClose={onClosed}
        onClosePress={onClosed}
        onPrimaryPress={onDonePress}>
        {enableSearch && (
          <SearchBar
            value={searchText}
            placeholder={'Search here...'}
            onChangeText={onChangeText}
            onClear={() => setSearchText('')}
          />
        )}
        <FlatList
          ref={listRef}
          data={showListData}
          showsVerticalScrollIndicator={false}
          // style={{flex: 1}}
          contentContainerStyle={styles.listC}
          ListEmptyComponent={NotFoundView}
          keyExtractor={(item, index) => item[rowUniqueKey] + index + title}
          renderItem={({item}) => {
            const active = selectedData?.some(
              (e: any) =>
                e &&
                e[rowUniqueKey] !== null &&
                e[rowUniqueKey] !== undefined &&
                item &&
                item[rowUniqueKey] !== null &&
                item[rowUniqueKey] !== undefined &&
                e[rowUniqueKey] === item[rowUniqueKey],
            );
            return (
              <TouchableOpacity
                key={item[rowUniqueKey]}
                onPress={() => onItemPress(item, active)}
                activeOpacity={CONSTANT.BUTTON_OPACITY}
                style={styles.itemContainer}>
                {rowType === 'behalfOf' ? (
                  <PatrollerLisItem item={item} />
                ) : rowType === 'chamber' ? (
                  <ChamberTaskLisItem item={item} />
                ) : rowType === 'nearestChamber' ? (
                  <NearestChamberLisItem item={item} />
                ) : rowType === 'customer' ? (
                  <CustomerLisItem item={item} />
                ) : rowType === 'circuit' ? (
                  <CircuitLisItem item={item} />
                ) : rowType === 'labelValue' ? (
                  <LabelValueLisItem item={item} />
                ) : (
                  <DefaultLisItem item={item} />
                )}
                {type === 'single' ? (
                  <RadioButton
                    active={active}
                    onPress={() => onItemPress(item, active)}
                  />
                ) : (
                  <Image
                    source={IMAGES.uncheck}
                    style={[styles.check, false && styles.checkFill]}
                  />
                )}
              </TouchableOpacity>
            );
          }}
          decelerationRate="normal"
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50, // Adjust as needed
          }}
          onScrollToIndexFailed={(info: any) => {
            if (type === 'single') {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              });
            }
          }}
        />
      </ModalSheet>
    );
  }, [
    searchText,
    data,
    searchData,
    show,
    title,
    enableSearch,
    searchKeys,
    selectedData,
    onDone,
    onClose,
    type,
    rowUniqueKey,
    rowType,
  ]);
};

export default memo(OptionPickerSheet);

const styles = StyleSheet.create({
  customerItemView: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chamberDirButtonView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZE.MVS(10),
  },
  buttonIcons: {
    height: SIZE.MS(30),
    width: SIZE.MS(30),
    tintColor: COLORS.ACCENT_ORANGE,
  },
  directionButon: {
    height: SIZE.MS(45),
    width: SIZE.MS(80),
    borderRadius: SIZE.MS(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.BORDER_DEFAULT,
  },
  chamberNameText: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.REGULAR,
    color: COLORS.PRIMARY_DARK,
  },
  chamberDistanceText: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  chamberItemView: {
    flex: 1,
    paddingRight: SIZE.MS(10),
  },
  listC: {paddingBottom: 100},
  shiftIconView: {
    flexDirection: 'row',
  },
  nightShiftIcon: {
    tintColor: COLORS.TEXT_DARKER,
  },
  eveningShiftIcon: {
    tintColor: COLORS.PRIMARY,
  },
  dayShiftIcon: {
    tintColor: COLORS.ACCENT_ORANGE,
  },
  shiftIcon: {
    height: SIZE.MS(18),
    width: SIZE.MS(18),
    marginRight: SIZE.MS(10),
  },
  nameCodeView: {
    flexDirection: 'row',
    marginBottom: SIZE.MVS(10),
    alignItems: 'center',
  },
  patEmpCodeText: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_DARKER,
  },
  patShiftNameTextEvening: {color: COLORS.PRIMARY},
  patShiftNameTextDay: {color: COLORS.ACCENT_ORANGE},
  patShiftNameText: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_DARKER,
    flex: 1,
  },
  patNameText: {
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY_DARK,
    flex: 1,
  },
  defaultNameText: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  patItemView: {
    flex: 1,
    marginLeft: SIZE.MS(10),
  },
  itemContainer: {
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
    borderBlockColor: COLORS.BORDER_DEFAULT,
    borderBottomWidth: SIZE.MS(1),
    paddingVertical: SIZE.MVS(10),
    alignItems: 'center',
  },
  check: {
    height: SIZE.MS(25),
    width: SIZE.MS(25),
    tintColor: COLORS.TEXT_LIGHT,
  },
  checkFill: {
    tintColor: COLORS.PRIMARY,
  },
  // Search Bar
  closeButtonView: {
    width: 35,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    height: 16,
    width: 16,
    tintColor: COLORS.TEXT_DARK,
  },
  searchIcon: {
    height: 20,
    width: 20,
    tintColor: COLORS.TEXT_PLACEHOLDER,
  },
  inputView: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#222222',
    paddingHorizontal: 15,
  },
  inputOuterView: {
    height: 48,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: COLORS.TEXT_PLACEHOLDER,
    margin: 15,
    marginHorizontal: 10,
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
