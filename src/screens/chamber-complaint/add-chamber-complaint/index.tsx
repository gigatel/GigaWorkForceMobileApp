/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons, InputField, RadioButton} from '@atoms';
import {BackHeader, CaptureChamberPicture} from '@molecules';
import {Screen} from '@organisms';
import {GeolocationResponse} from '@react-native-community/geolocation';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, CONSTANT, DATA, FONTS, IMAGES, SIZE} from '@res';
import {
  ChamberComplaintPriorityActionSheet,
  ChamberIssueListActionSheet,
  NearestFromChambersSheet,
  NearestToChambersSheet,
} from '@sheets';
import {
  getChamberComplaintAlertApi,
  getChamberComplaintPriorityApi,
  getNearestChambersApi,
  getPrevNextChamberByIdApi,
  resetNextComplaintChambers,
  selectChamberComplaintAlerts,
  submitChamberComplaintApi,
} from '@slices/chamber-complaint.slice';
import {getChamberIssueListApi} from '@slices/task.slice';
import {DataType, ScreenProps} from '@types';
import {Common, Location, Preferences} from '@utils';
import React, {FC, memo, useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {connect, useDispatch} from 'react-redux';

const ViewPrevChamberList = ({onPress, t}: any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={CONSTANT.BUTTON_OPACITY}
      style={styles.prevRowView}>
      <Image source={IMAGES.taskList} style={styles.listIcon} />
      <Text style={styles.prevText}>{t}</Text>
      <Image source={IMAGES.down} style={styles.rightIcon} />
    </TouchableOpacity>
  );
};

const ChamberAlerts = memo(({data, onPress}: any) => {
  return (
    <>
      {data?.map((item: DataType.IdName) => {
        return (
          <TouchableOpacity
            activeOpacity={CONSTANT.BUTTON_OPACITY}
            onPress={() => onPress(item)}
            key={item.name}
            style={styles.alertRowView}>
            <Image
              source={item.isChecked ? IMAGES.check : IMAGES.uncheck}
              style={styles.alertCheckBoxImage}
            />
            <Text style={styles.alertTitleText}>{item?.name}</Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
});

const mTypeData = DATA.CHAMBER_MANTENANCE_TYPE;
//! ***************** Add Chamber Complaint ***************
const AddChamberComplaint: FC<ScreenProps.AddChamberComplaint> = ({
  loading,
  navigation,
  chamberAlerts,
  empData,
  nextChamberData,
}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch<StoreDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [maintenanceType, setMantenaceType] =
    React.useState<DataType.IdName | null>(mTypeData[0]);
  const [landmark, setlandmark] = useState('');
  const [pic1, setPic1] = useState<DataType.ImagePickerResponse | null>(null);
  const [pic2, setPic2] = useState<DataType.ImagePickerResponse | null>(null);
  const [currentLoc, setCurrentLoc] = useState<GeolocationResponse | null>(
    null,
  );

  const [workType, setWorkType] = useState<null | DataType.IdName>(null);
  const [priority, setPriority] = useState<null | DataType.IdName>(null);
  const [fromChamber, setFromChamber] =
    useState<null | DataType.NearestChamber>(null);
  const [toChamber, setToChamber] = useState<null | DataType.NearestChamber>(
    null,
  );
  const [remark, setRemark] = useState('');
  const [distanceRange, setDistanceRange] = useState('100');
  // const [alerts, setAlerts] = useState<DataType.IdName[] | null>(null);

  const getChamberList = () => {
    if (!distanceRange) {
      Common.showToast(t('enter_distance_range'));
      return;
    }
    Keyboard.dismiss();
    dispatch(resetNextComplaintChambers());
    setFromChamber(null);
    setToChamber(null);
    dispatch(
      getNearestChambersApi(
        `?companyCode=gtpl&latitude=${currentLoc?.coords?.latitude}&longitude=${currentLoc?.coords?.longitude}&range=${distanceRange}`,
      ),
    );
  };
  const getData = useCallback(() => {
    try {
      setIsLoading(true);
      Location.getGeoLocation().then(loc => {
        setCurrentLoc(loc);
        dispatch(
          getNearestChambersApi(
            `?companyCode=gtpl&latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&range=${distanceRange}`,
          ),
        );

        setIsLoading(false);
      });
    } catch (error) {
      // console.log('4');
      Common.error('❌ Error In Get Task Data');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    dispatch(getChamberComplaintPriorityApi(''));
    dispatch(getChamberComplaintAlertApi(''));
    dispatch(
      getChamberIssueListApi({
        params: '?id=1',
        isRefresh: true,
      }),
    );
    getData();
  }, [getData, dispatch]);

  const onChangeMantenanceType = (type: number) => {
    if (type === 0) {
      setMantenaceType(mTypeData[type]);
    } else {
      setMantenaceType(mTypeData[1]);
    }
    dispatch(
      getChamberIssueListApi({
        params: '?id=' + mTypeData[type]?.id,
        isRefresh: true,
      }),
    );
    setFromChamber(null);
    setToChamber(null);
    setWorkType(null);
  };
  const isOther = maintenanceType?.id === 10;

  const submitApi = async () => {
    const address = Preferences.getData('LAST_GEO_ADDRESS');
    const alerts = chamberAlerts
      ?.filter((item: DataType.IdName) => item.isChecked)
      .map((item: DataType.IdName) => {
        if (item.isChecked) {
          return {
            alert_id: item.id,
            group_id: 0,
            is_alert: false,
          };
        }
      });
    const params = {
      id: 0,
      ticketId: 0,
      dailyReportId: 0,
      workScope: 'Single',
      typeId: maintenanceType?.id,
      typeOfWorkId: workType?.id,
      priorityId: priority?.id,
      routeId: fromChamber?.route_id_int ?? 0,
      fromChamberId: fromChamber?.id ?? 0,
      fromChamberLat: fromChamber?.chamber_latitude ?? '',
      fromChamberLon: fromChamber?.chamber_longitude ?? '',
      fromChamberGPSAddress: fromChamber?.route_name ?? '',
      toChamberId: toChamber?.id ?? 0,
      toChamberLat: toChamber?.chamber_latitude ?? '',
      toChamberLon: toChamber?.chamber_longitude ?? '',
      toChamberGPSAddress: toChamber?.route_name ?? '',
      landMark: landmark,
      remark: remark,
      lat: `${currentLoc?.coords.latitude}`,
      lon: `${currentLoc?.coords.longitude}`,
      gpsAddress: address?.address ?? '',
      employeeId: empData?.id,
      companyCode: 'gtpl',
      chamberComplaintImage: [
        {
          imageUrl: pic1?.data,
          imageExtention: 'jpg',
        },
        {
          imageUrl: pic2?.data,
          imageExtention: 'jpg',
        },
      ],
      alerts: alerts,
      isOffline: true,
      createdOn: Common.getCreatedOnDate(),
    };

    const res = await dispatch(submitChamberComplaintApi(params));
    if (res.payload?.status === 200 && res?.payload?.success) {
      Common.alert({
        title: 'Success',
        msg: t('chamber_complaint_submitted'),
        onPress: () => {
          navigation.replace('ChamberComplaintsList');
        },
      });
    }
  };

  const checkValidation = () => {
    Keyboard.dismiss();
    if (maintenanceType === null) {
      Common.alert({
        title: t('alert'),
        msg: t('select_maintenance_type'),
      });
    } else if (workType === null) {
      Common.alert({
        title: t('alert'),
        msg: t('select_work_type'),
      });
    } else if (fromChamber === null) {
      Common.alert({
        title: t('alert'),
        msg: isOther ? t('select_from_chamber') : t('select_chamber'),
      });
    } else if (isOther && toChamber === null) {
      Common.alert({
        title: t('alert'),
        msg: t('select_to_chamber'),
      });
    } else if (landmark === '') {
      Common.alert({
        title: t('alert'),
        msg: t('enter_landmark'),
      });
    } else if (!pic1) {
      Common.alert({
        title: t('alert'),
        msg: t('add_first_image'),
      });
    } else if (!pic2) {
      Common.alert({
        title: t('alert'),
        msg: t('add_second_image'),
      });
    } else if (priority === null) {
      Common.alert({
        title: t('alert'),
        msg: t('select_priority'),
      });
    } else if (remark === '') {
      Common.alert({
        title: t('alert'),
        msg: t('enter_remark'),
      });
    } else {
      submitApi();
    }
  };

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'scroll'}
      statusBarStyle={'light'}
      loading={loading || isLoading}
      loaderMessage={''}
      fixedComponent={
        <>
          <BackHeader
            headerTitle={t('add_chamber_complaint')}
            onBackPress={() => navigation.goBack()}
          />
          <ViewPrevChamberList
            t={t('view_prev_chamber_complaint')}
            onPress={() => navigation.navigate('ChamberComplaintsList')}
          />
        </>
      }
      fixedBottomComponent={
        <Buttons
          type={'primary'}
          title={t('submit')}
          onPress={() => {
            checkValidation();
          }}
          viewStyle={styles.submitButton}
        />
      }>
      <View style={styles.container}>
        <View style={styles.disInputView}>
          <InputField
            type={'default'}
            keyboardType={'numeric'}
            title={t('chamber_distance_range')}
            value={distanceRange}
            onChangeText={txt => {
              setDistanceRange(txt?.replace(/[^0-9]/g, ''));
            }}
            viewStyle={styles.disInput}
            inputStyle={{height: SIZE.MVS(45)}}
            maxLength={5}
            placeholder={t('enter_chamber_range')}
            onSubmitEditing={() => {
              getChamberList();
            }}
            returnKeyLabel={'Done'}
            returnKeyType={'done'}
          />
          <Buttons
            type={'primary'}
            title={t('get')}
            viewStyle={styles.getButton}
            onPress={() => {
              getChamberList();
            }}
          />
        </View>
        <Text style={styles.headingText}>
          {t('complaint_maintenance_type')}
        </Text>
        <View style={styles.radioButtonRow}>
          <RadioButton
            title={mTypeData[0]?.name}
            active={!isOther}
            onPress={() => {
              onChangeMantenanceType(0);
            }}
            viewStyle={styles.radioView}
          />
          <RadioButton
            title={mTypeData[1]?.name}
            active={isOther}
            onPress={() => {
              onChangeMantenanceType(1);
            }}
            viewStyle={styles.radioView}
          />
        </View>

        <NearestFromChambersSheet
          title={isOther ? t('from_chamber') : t('chamber_name')}
          value={fromChamber}
          setValue={frm => {
            setFromChamber(frm);

            if (isOther) {
              dispatch(resetNextComplaintChambers());
              dispatch(
                getPrevNextChamberByIdApi(
                  `?companyCode=gtpl&routeId=${frm.route_id_int}&companyId=${empData?.companyId}`,
                ),
              );
              setToChamber(null);
            }
          }}
        />
        {fromChamber && (
          <Text style={styles.routenameText}>
            {t('route') + ': '}
            <Text style={styles.routeNameValue}>{fromChamber?.route_id}</Text>
          </Text>
        )}
        {isOther && (
          <>
            <NearestToChambersSheet
              data={nextChamberData}
              value={toChamber}
              setValue={setToChamber}
            />
            {toChamber && (
              <Text style={styles.routenameText}>
                {t('route') + ': '}
                <Text style={styles.routeNameValue}>{toChamber?.route_id}</Text>
              </Text>
            )}
          </>
        )}

        <ChamberIssueListActionSheet
          title={t('work_type')}
          placeholder={t('select_work_type')}
          value={workType}
          alertMessage={
            maintenanceType === null ? t('select_maintenance_type') : ''
          }
          setValue={setWorkType}
        />
        <InputField
          title={t('landmark')}
          value={landmark}
          placeholder={t('enter_landmark')}
          onChangeText={txt => setlandmark(txt)}
          viewStyle={styles.landmarkView}
          inputStyle={{height: SIZE.MVS(45)}}
        />
        <Text style={styles.headingText}>{t('chamber_pictures')}</Text>
        <View style={styles.submitTaskPicRow}>
          <CaptureChamberPicture
            title={t('pic1')}
            pic={pic1}
            setPic={(e: any) => setPic1(e)}
            lat={currentLoc?.coords.latitude ?? 0}
            long={currentLoc?.coords.longitude ?? 0}
          />
          <CaptureChamberPicture
            title={t('pic2')}
            pic={pic2}
            setPic={(e: any) => setPic2(e)}
            lat={currentLoc?.coords.latitude ?? 0}
            long={currentLoc?.coords.longitude ?? 0}
          />
        </View>
        <ChamberComplaintPriorityActionSheet
          value={priority}
          setValue={setPriority}
        />
        <InputField
          title={t('remark')}
          value={remark}
          placeholder={t('enter_remark')}
          onChangeText={txt => setRemark(txt)}
          viewStyle={styles.remarkView}
          multiline={true}
          numberOfLines={3}
          inputStyle={{height: SIZE.MVS(45)}}
        />
        <Text style={styles.headingText}>{t('alerts')}</Text>
        <ChamberAlerts
          data={chamberAlerts}
          onPress={(alert: DataType.IdName) => {
            dispatch(selectChamberComplaintAlerts(alert));
          }}
        />
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading:
    state.chamberComplaint.complaintListLoading === 'pending' ||
    state.chamberComplaint.nearestChambersLoading === 'pending' ||
    state.chamberComplaint.chamberAlertLoading === 'pending' ||
    state.chamberComplaint.chamberPriorityLoading === 'pending' ||
    state.task.chamberIssueLoading === 'pending' ||
    state.chamberComplaint.nextChamberLoading === 'pending' ||
    state.chamberComplaint.submitComplaintLoading === 'pending',
  totalPage: state.chamberComplaint.complaintTotalPage,
  nearChamberData: state.chamberComplaint.nearestChambersData,
  chamberAlerts: state.chamberComplaint.chamberAlertData,
  empData: state.dashboard.dashboardList?.employeeDetails ?? null,
  nextChamberData: state.chamberComplaint.nextChamberData,
});
export default connect(MapStateToProps)(AddChamberComplaint);

const styles = StyleSheet.create({
  disInputView: {flexDirection: 'row', alignItems: 'flex-end'},
  disInput: {marginHorizontal: 0},
  getButton: {
    borderRadius: SIZE.MS(6),
    marginLeft: SIZE.MS(10),
    flex: 1,
    height: SIZE.MS(50),
  },
  alertCheckBoxImage: {
    height: SIZE.MS(25),
    width: SIZE.MS(25),
    tintColor: COLORS.PRIMARY_DARK,
  },
  alertTitleText: {
    flex: 1,
    marginHorizontal: SIZE.MS(10),
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    fontFamily: FONTS.MEDIUM,
  },
  alertRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZE.MVS(5),
    backgroundColor: COLORS.WHITE,
    padding: SIZE.MS(10),
    borderRadius: SIZE.MS(6),
  },
  routeNameValue: {
    color: COLORS.ACCENT_ORANGE,
    fontFamily: FONTS.REGULAR,
  },
  routenameText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY_DARK,
  },
  submitButton: {
    marginHorizontal: SIZE.MS(20),
    marginVertical: SIZE.MVS(10),
  },
  landmarkView: {marginHorizontal: 0},
  remarkView: {marginHorizontal: 0, height: SIZE.MVS(110)},

  submitTaskPicRow: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    padding: SIZE.MS(10),
    paddingBottom: SIZE.MVS(20),
    flexDirection: 'row',
  },
  radioView: {
    flex: 1,
  },
  radioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZE.MVS(10),
  },
  headingText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(15),
    color: COLORS.PRIMARY_DARK,
    marginTop: SIZE.MVS(10),
    marginBottom: SIZE.MVS(10),
    marginHorizontal: SIZE.MS(10),
  },
  prevText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY_DARK,
    flex: 1,
  },
  prevRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZE.MS(10),
    backgroundColor: COLORS.WHITE,
    padding: SIZE.MS(10),
    marginHorizontal: SIZE.MS(20),
    borderRadius: SIZE.MS(6),
  },
  listIcon: {
    height: SIZE.MS(25),
    width: SIZE.MS(25),
    tintColor: COLORS.PRIMARY_DARK,
    marginRight: SIZE.MS(10),
  },
  rightIcon: {
    height: SIZE.MS(25),
    width: SIZE.MS(25),
    tintColor: COLORS.PRIMARY_DARK,
    transform: [{rotate: '-90deg'}],
  },
  devider: {
    height: 1,
    backgroundColor: COLORS.BORDER_DEFAULT,
    width: '100%',
    marginVertical: SIZE.MVS(10),
  },
  container: {
    flex: 1,
    padding: SIZE.MS(5),
    marginHorizontal: SIZE.MS(20),
  },
});
