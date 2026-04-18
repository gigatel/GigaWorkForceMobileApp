import {Buttons} from '@atoms';
import {UserNameDesigRow} from '@molecules';
import {reset} from '@navigation/services';
import {Screen} from '@organisms';
import {resetStore, RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE, STYLES} from '@res';
// import {getAppModulesApi} from '@slices/account.slice';
import {DataType, ScreenProps} from '@types';
import {Common, Location, Preferences} from '@utils';
import React, {FC, useEffect, useState, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import {connect, useDispatch} from 'react-redux';
import {log} from 'src/utils/common';
const ModuleRow = ({
  name,
  devider = true,
}: {
  name: string;
  devider?: boolean;
}) => {
  return (
    <>
      <View style={styles.nameiconRowView}>
        <View style={styles.nameRowModuleView}>
          <Image source={IMAGES.module} style={styles.iconImage} />
          <Text style={styles.moduleNameText}>{name}</Text>
        </View>
        <Image source={IMAGES.checkFill} style={styles.checkImage} />
      </View>
      {devider && <View style={styles.devider} />}
    </>
  );
};
const NameIconRow = ({
  name,
  value,
  icon,
  devider = true,
}: {
  name: string;
  value: string;
  icon: number;
  devider?: boolean;
}) => {
  return (
    <>
      <View style={styles.nameiconRowView}>
        <View style={styles.nameRowView}>
          <Image source={icon} style={styles.iconImage} />
          <Text style={styles.rowNametext}>{name}</Text>
        </View>
        <Text style={styles.rowValuetext}>{': ' + value}</Text>
      </View>
      {devider && <View style={styles.devider} />}
    </>
  );
};
const Account: FC<ScreenProps.Account> = ({
  employeeDetails,
  appModules,
  loading,
}) => {
  const {t} = useTranslation();
  const [address, setAddress] = useState('');
  const [isLoading, setisLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  console.log('employeeDetails:', {employeeDetails});
  const displayAddress = employeeDetails?.address || currentAddress || '—';
  const allowedModuleList: EmployeeModule[] = useMemo(() => {
    if (employeeDetails?.allowedModules?.length)
      return employeeDetails.allowedModules;
    return [{id: 1, name: 'Tickets'}];
  }, [employeeDetails?.allowedModules]);

  const dispatch = useDispatch<StoreDispatch>();

  // useEffect(() => {
  //   dispatch(getAppModulesApi(`empId=${employeeDetails?.id}`));
  // }, [dispatch, employeeDetails?.id]);

  const getAddressLocation = async () => {
    setisLoading(true);
    const data =
      (await Location.getAddressFromLatLong()) as DataType.GeoAddress;
    if (data !== null) {
      setAddress(data.address);
      setCurrentAddress(data.address);
    } else {
      console.log('getAddressLocationData2', {data});
      setAddress('Unable to fetch current location ...');
    }
    setisLoading(false);
  };

  const logout = async () => {
    Common.yesNoAlert(t('logout'), t('are_you_sure_logout'), async () => {
      await Preferences.logout();
      reset('Login');
      dispatch(resetStore());
    });
  };
  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      loading={isLoading || loading}
      preset={'fixed'}>
      <View style={styles.innerContainer}>
        <UserNameDesigRow
          name={
            (employeeDetails?.firstName ?? '') +
            ' ' +
            (employeeDetails?.lastName ?? '')
          }
          designation={employeeDetails?.designationName ?? ''}
          zonename={employeeDetails?.zoneName ?? ''}
          onLogoutPress={logout}
        />
        <ScrollView>
          <View style={styles.cardView}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.sectionHint}>
              Basic details linked to your account
            </Text>
            <NameIconRow
              name={t('name')}
              value={employeeDetails?.firstName ?? ''}
              icon={IMAGES.account}
            />
            <NameIconRow
              name={t('mobile')}
              value={employeeDetails?.officeMobileNo ?? ''}
              icon={IMAGES.mobile}
            />
            <NameIconRow
              name={t('email')}
              value={employeeDetails?.officeEmailId ?? ''}
              icon={IMAGES.email}
            />
            <NameIconRow
              name={t('zone')}
              value={employeeDetails?.zoneName ?? ''}
              icon={IMAGES.location}
            />
            <NameIconRow
              name={t('current_address')}
              value={String(displayAddress)}
              icon={IMAGES.address}
            />
            <Buttons
              type={'primary'}
              title={address === '' ? t('add_address') : t('update_address')}
              viewStyle={styles.addButton}
              onPress={() => {
                getAddressLocation();
              }}
            />
          </View>

          <View style={styles.cardView}>
            <Text style={styles.sectionTitle}>App Modules</Text>
            <Text style={styles.sectionHint}>
              Enabled features available to you
            </Text>
            <View style={styles.modulesWrap}>
              {allowedModuleList.map((item, idx) => (
                <View key={String(item.id)}>
                  <ModuleRow
                    name={Common.toTitleCase(item.name)}
                    devider={idx !== allowedModuleList.length - 1}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.account.loading === 'pending',
  appModules: state.account.appModules,
  employeeDetails: state.dashboard.dashboardList?.employeeDetails,
});
export default connect(MapStateToProps)(Account);

const styles = StyleSheet.create({
  appModuletext: {
    color: COLORS.PRIMARY_DARK,
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(14),
  },
  addButton: {
    marginTop: SIZE.MVS(20),
    height: SIZE.MS(40),
    marginHorizontal: SIZE.MS(25),
  },
  rowNametext: {
    color: COLORS.TEXT_DARKER,
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(14),
    marginLeft: SIZE.MS(10),
  },
  moduleNameText: {
    color: COLORS.TEXT_DARKER,
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(15),
    flex: 1,
    marginLeft: SIZE.MS(10),
  },
  rowValuetext: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(14),
    flex: 1,
  },
  nameRowModuleView: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.5,
  },
  nameiconRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SIZE.MVS(15),
  },
  iconImage: {
    width: SIZE.MVS(25),
    height: SIZE.MVS(25),
    tintColor: COLORS.PRIMARY_DARK,
    resizeMode: 'contain',
  },
  checkImage: {
    width: SIZE.MVS(18),
    height: SIZE.MVS(18),
    tintColor: COLORS.SUCCESS,
    resizeMode: 'contain',
  },
  cardView: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    marginTop: SIZE.MS(20),
    marginHorizontal: SIZE.MS(20),
    padding: SIZE.MS(15),
    marginBottom: SIZE.MVS(10),
    ...STYLES.SHADOW_PRIMARY_3,
  },
  devider: {
    height: SIZE.MVS(1),
    backgroundColor: COLORS.TEXT_DEVIDER,
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    paddingBottom: SIZE.MVS(25),
  },
  mainContainer: {
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
    // flex: 1,
  },
  sectionTitle: {
    color: COLORS.TEXT_DARKER,
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(18),
    fontWeight: '700',
  },
  sectionHint: {
    color: COLORS.TEXT_MEDIUM,
    fontSize: SIZE.MS(11),
    marginTop: SIZE.MVS(2),
    marginBottom: SIZE.MVS(10),
  },
  modulesWrap: {marginTop: SIZE.MVS(4)},
});
// Mobile Email Zone Shift CurrentAddress - Add Current Address
