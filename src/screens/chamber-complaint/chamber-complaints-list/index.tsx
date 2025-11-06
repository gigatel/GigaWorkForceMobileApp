/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {ListView} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, SIZE, STYLES} from '@res';
import {getChamberComplaintListApi} from '@slices/chamber-complaint.slice';
import {DataType, ScreenProps} from '@types';
import {Common} from '@utils';
import React, {FC, useCallback, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';
import {connect, useDispatch} from 'react-redux';

const Devider = () => {
  return <View style={styles.devider} />;
};

const TitleValueRow = ({title, value}: any) => {
  return (
    <View
      style={{
        flexDirection: 'row',
      }}>
      <Text
        style={{
          flex: 0.75,
          fontFamily: FONTS.MEDIUM,
          color: COLORS.PRIMARY,
          fontSize: SIZE.MS(14),
        }}>
        {title}
      </Text>
      <Text
        style={{
          flex: 1,
          fontFamily: FONTS.REGULAR,
          color: COLORS.TEXT_DARK,
          fontSize: SIZE.MS(13),
        }}>
        {value}
      </Text>
    </View>
  );
};
const ChamberComplaintItem = ({item}: {item: DataType.ChamberComplaint}) => {
  const {t} = useTranslation();
  return (
    <View
      style={{
        backgroundColor: COLORS.WHITE,
        padding: SIZE.MS(10),
        margin: SIZE.MS(10),
        borderRadius: SIZE.MS(6),
        borderTopWidth: SIZE.MS(5),
        borderTopColor:
          item.priorityId === 1 ? COLORS.ERROR : COLORS.ACCENT_ORANGE,
        ...STYLES.SHADOW_PRIMARY_6,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontFamily: FONTS.REGULAR,
            color: COLORS.WHITE,
            fontSize: SIZE.MS(13),
            backgroundColor: COLORS.PRIMARY,
            padding: SIZE.MS(5),
            borderRadius: SIZE.MS(5),
          }}>
          {item?.transactionNO}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.REGULAR,
            color: COLORS.TEXT_DARK,
            fontSize: SIZE.MS(13),
          }}>
          {Common.formatDate(item?.createdOn, 'DD MMM YYYY HH:mm')}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.REGULAR,
            color: COLORS.TEXT_DARK,
            fontSize: SIZE.MS(13),
          }}>{`${item.priorityId === 1 ? '▲' : '▼'}${t('priority')}`}</Text>
      </View>
      {/* <Devider />
      <TitleValueRow
        title={'Date'}
        value={Common.formatDate(item?.createdOn, 'DD MMM YYYY HH:mm')}
      /> */}
      <Devider />
      <TitleValueRow title={t('work_type')} value={item?.typeName} />
      <Devider />
      <TitleValueRow title={t('remark')} value={item?.typeOfWorkName} />
      <Devider />
      <TitleValueRow title={t('complaint_type')} value={item?.remark} />
    </View>
  );
};
//! ***************** Chamber Complaints List ***************
let pageNumber = 1;
const ChamberComplaintsList: FC<ScreenProps.ChamberComplaintsList> = ({
  loading,
  navigation,
  data,
  totalPage,
}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch<StoreDispatch>();

  const getData = useCallback(() => {
    dispatch(
      getChamberComplaintListApi({
        page: pageNumber,
        size: 100,
        search: '',
        companyCode: 'gtpl',
        typeId: 0,
      }),
    );
  }, [dispatch]);

  const loadMore = () => {
    if (totalPage > pageNumber) {
      pageNumber++;
      getData();
    }
  };

  const load = useCallback(() => {
    // if (loading) {
    //   return;
    // }
    pageNumber = 1;
    getData();
  }, [getData]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'fixed'}
      statusBarStyle={'light'}
      loading={loading}
      loaderMessage={t('getting_complaints')}>
      <BackHeader
        headerTitle={t('chamber_complaints')}
        onBackPress={() => navigation.goBack()}
        showGps={false}
      />
      <View style={styles.container}>
        <ListView
          data={data}
          renderItem={({item}) => <ChamberComplaintItem item={item} />}
          onEndReached={loadMore}
          devIds={{id: 'id', title: 'ChamberComplaintList'}}
        />
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.chamberComplaint.complaintListLoading === 'pending',
  totalPage: state.chamberComplaint.complaintTotalPage,
  data: state.chamberComplaint.complaintListData,
});
export default connect(MapStateToProps)(ChamberComplaintsList);

const styles = StyleSheet.create({
  devider: {
    height: 1,
    backgroundColor: COLORS.BORDER_DEFAULT,
    width: '100%',
    marginVertical: SIZE.MVS(10),
  },
  container: {
    flex: 1,
    padding: SIZE.MS(5),
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
});
