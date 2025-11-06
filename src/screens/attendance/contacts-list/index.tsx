/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons, InputField, ListView} from '@atoms';
import {BackHeader, ModalSheet} from '@molecules';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE, STYLES} from '@res';
import {getEmployeeListForContactApi} from '@slices/attendance.slice';
import {DataType, ScreenProps} from '@types';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {connect, useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';

const ListItem = memo(
  ({
    item,
    onCall,
    OnWhatsApp,
  }: {
    item: DataType.EmployeeDetails;
    onCall: () => void;
    OnWhatsApp: () => void;
  }) => {
    const {t} = useTranslation();
    return (
      <View style={styles.itemRowView}>
        <View style={styles.listItemView}>
          <View style={styles.rowView}>
            <Text style={styles.headingText}>{t('id') + ': '}</Text>
            <Text style={styles.listGNIdText}>{item?.employeeCode}</Text>
          </View>
          <View style={[styles.rowView, {marginVertical: 5}]}>
            <Text style={styles.headingText}>{t('name') + ': '}</Text>
            <Text style={styles.listNameText}>
              {`${item?.firstName} ${item?.middleName ?? ''} ${
                item?.lastName ?? ''
              }`}
            </Text>
          </View>
          <View style={styles.rowView}>
            <Text style={styles.headingText}>{t('designation') + ': '}</Text>
            <Text style={styles.listDesigText}>{item?.designationName}</Text>
          </View>
        </View>
        <Buttons
          type={'icon'}
          icon={IMAGES.telephone}
          iconStyle={styles.buttonIcon}
          viewStyle={styles.buttonView}
          onPress={onCall}
        />
        <Buttons
          type={'icon'}
          icon={IMAGES.whatsapp}
          iconStyle={{...styles.buttonIcon, ...styles.buttonIconW}}
          viewStyle={styles.buttonView}
          onPress={OnWhatsApp}
        />
      </View>
    );
  },
);

//! ********************** Contacts List Screen **********************
const ContactsList: FC<ScreenProps.ContactsList> = ({
  navigation,
  loading,
  data,
}) => {
  const {t} = useTranslation();

  const [show, setShow] = useState<DataType.EmployeeDetails | null>(null);
  const [searchText, setSearchText] = useState('');
  const dispatch = useDispatch<StoreDispatch>();

  const getData = useCallback(() => {
    dispatch(getEmployeeListForContactApi({refresh: false}));
  }, [dispatch]);

  useEffect(() => {
    getData();
    return () => {};
  }, [dispatch, getData]);

  const searchList = useMemo(() => {
    if (!searchText) {
      return data; // Return full list when searchText is empty
    }
    const searchLower = searchText.toLowerCase(); // Compute once
    return data.filter((item: DataType.EmployeeDetails) =>
      [
        item.firstName,
        item.middleName,
        item.lastName,
        item.personalMobileNo,
        item.officeMobileNo,
      ].some(field => field?.toLowerCase().includes(searchLower)),
    );
  }, [data, searchText]);

  // Function to open WhatsApp chat
  const openWhatsApp = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Mobile Number is Not Valid!');
      return;
    }

    const msg = '';
    const appUrl = `whatsapp://send?phone=+91${phoneNumber}&text=${msg}`;
    const webUrl = `https://wa.me/+91${phoneNumber}?text=${msg}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);

      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl); // fallback to browser if WB or WA not found
      }
    } catch (err) {
      console.error('Error opening WhatsApp:', err);
      Alert.alert('Error', 'Unable to open WhatsApp or WhatsApp Business');
    }
  };

  // Function to open phone dialer
  const openDialer = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Mobile Number is Not Valid!');
      return;
    }

    // Construct phone URL based on platform
    let dialUrl =
      Platform.OS === 'android'
        ? `tel:${phoneNumber}`
        : `telprompt:${phoneNumber}`;

    Linking.canOpenURL(dialUrl)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Phone dialer is not available');
        } else {
          return Linking.openURL(dialUrl);
        }
      })
      .catch(err => {
        console.error('Error opening dialer:', err);
        Alert.alert('Error', 'An error occurred while opening the dialer');
      });
  };

  return (
    <Screen statusBgColor={COLORS.PRIMARY} preset={'fixed'} loading={loading}>
      <BackHeader
        headerTitle={t('contacts')}
        onBackPress={() => {
          navigation.goBack();
        }}
        showGps={false}
      />
      <View style={styles.innerView}>
        <InputField
          value={searchText}
          type={'search'}
          placeholder={t('search_by_name_and_number')}
          onChangeText={(txt: string) => {
            setSearchText(txt);
          }}
          onSearchClear={() => setSearchText('')}
          onSubmitEditing={() => Keyboard.dismiss()}
          viewStyle={styles.searchBar}
          inputStyle={styles.searchInput}
        />
        <ListView
          data={searchList}
          renderItem={({item}) => (
            <ListItem
              item={item}
              onCall={() => {
                setShow({...item, type: 'phone'});
              }}
              OnWhatsApp={() => {
                setShow({...item, type: 'whatsapp'});
              }}
            />
          )}
        />
      </View>
      <Buttons
        type={'leftIconText'}
        icon={IMAGES.sync}
        title={t('sync')}
        onPress={() => {
          dispatch(getEmployeeListForContactApi({refresh: true}));
        }}
        viewStyle={{
          marginHorizontal: SIZE.MS(15),
          borderWidth: SIZE.MS(1),
          borderColor: COLORS.PRIMARY,
        }}
      />
      <ModalSheet
        title={t('contact_number')}
        show={show != null}
        onClose={() => {
          setShow(null);
        }}
        onClosePress={() => {
          setShow(null);
        }}>
        <TouchableOpacity
          style={styles.numberRowView}
          onPress={() => {
            if (show?.type === 'phone') {
              openDialer(show?.personalMobileNo ?? '');
            } else {
              openWhatsApp(show?.personalMobileNo ?? '');
            }
          }}>
          <Image source={IMAGES.account} style={styles.officeIcon} />
          <Text style={styles.nameText}>{t('personal')}</Text>
          <Text style={styles.nameNumText}>{show?.personalMobileNo}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.numberRowView}
          onPress={() => {
            if (show?.type === 'phone') {
              openDialer(show?.officeMobileNo ?? '');
            } else {
              openWhatsApp(show?.officeMobileNo ?? '');
            }
          }}>
          <Image source={IMAGES.office} style={styles.officeIcon} />
          <Text style={styles.nameText}>{t('official')}</Text>
          <Text style={styles.nameNumText}>{show?.officeMobileNo}</Text>
        </TouchableOpacity>
      </ModalSheet>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.attendance.contactListLoading === 'pending',
  data: state.attendance.contactList ?? [],
});
export default connect(MapStateToProps)(ContactsList);

const styles = StyleSheet.create({
  rowView: {flexDirection: 'row'},
  searchInput: {
    height: SIZE.MVS(45),
  },
  headingText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARKER,
  },
  listGNIdText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARKER,
  },
  listDesigText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_MEDIUM,
  },
  listNameText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MS(15),
    color: COLORS.PRIMARY_DARK,
  },
  listItemView: {
    flex: 1,
  },
  searchBar: {marginHorizontal: 0, marginBottom: SIZE.MVS(10)},
  nameNumText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(16),
    color: COLORS.PRIMARY_DARK,
    flex: 1,
    textAlign: 'right',
  },
  nameText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(16),
    color: COLORS.PRIMARY_DARK,
  },
  numberRowView: {
    flexDirection: 'row',
    marginVertical: SIZE.MS(5),
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
    paddingHorizontal: SIZE.MVS(10),
    paddingVertical: SIZE.MVS(15),
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.BORDER_SECONDARY,
    borderRadius: SIZE.MS(6),
  },
  officeIcon: {
    width: SIZE.MS(20),
    height: SIZE.MS(20),
    resizeMode: 'contain',
    tintColor: COLORS.PRIMARY_DARK,
    marginRight: SIZE.MS(10),
  },
  buttonIconW: {
    tintColor: COLORS.SUCCESS,
  },
  buttonView: {
    width: SIZE.MS(45),
    height: SIZE.MS(45),
    borderWidth: SIZE.MS(1),
    borderRadius: SIZE.MS(6),
    marginRight: SIZE.MS(5),
    borderColor: COLORS.BORDER_SECONDARY,
  },
  buttonIcon: {
    width: SIZE.MS(30),
    height: SIZE.MS(30),
    resizeMode: 'contain',
    tintColor: COLORS.PRIMARY_DARK,
  },
  itemRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: SIZE.MS(10),
    paddingLeft: SIZE.MS(15),
    borderRadius: SIZE.MS(10),
    marginVertical: SIZE.MS(5),
    ...STYLES.SHADOW_PRIMARY_3,
    marginHorizontal: SIZE.MS(5),
  },
  innerView: {flex: 1, padding: SIZE.MS(10)},
});
