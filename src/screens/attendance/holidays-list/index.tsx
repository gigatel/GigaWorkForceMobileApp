/* eslint-disable react-native/no-inline-styles */
/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons, ListView} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, SIZE, STYLES} from '@res';
import {applyOptionalHolidayApi, getHolidayListApi} from '@slices/leave.slice';

import {ScreenProps} from '@types';
import {Common} from '@utils';
import React, {FC, useCallback, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';
import {connect, useDispatch, useSelector} from 'react-redux';

//! ********************** Holidays List Screen **********************
const HolidaysList: FC<ScreenProps.HolidaysList> = ({
  navigation,
  loading,
  data,
}) => {
  const {t} = useTranslation();
  const empData = useSelector(
    (state: RootState) => state.dashboard.dashboardList?.employeeDetails,
  );
  const dispatch = useDispatch<StoreDispatch>();

  const getData = useCallback(() => {
    dispatch(getHolidayListApi({}));
  }, [dispatch]);

  useEffect(() => {
    getData();
    return () => {};
  }, [dispatch, getData]);

  const applyHoliday = (id: number) => {
    const params = {
      id: '0',
      empId: empData?.id,
      holidayId: id,
    };
    dispatch(applyOptionalHolidayApi(params));
  };
  return (
    <Screen statusBgColor={COLORS.PRIMARY} preset={'fixed'} loading={loading}>
      <BackHeader
        headerTitle={t('holidays')}
        onBackPress={() => {
          navigation.goBack();
        }}
      />
      <View style={styles.innerView}>
        <ListView
          data={data}
          renderItem={({item}) => {
            const isFix = item.holidayType === 2;
            const isApplied = item?.id === 0;
            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: COLORS.WHITE,
                  padding: SIZE.MS(10),
                  borderRadius: SIZE.MS(10),
                  marginVertical: SIZE.MS(5),
                  borderLeftWidth: SIZE.MS(5),
                  marginHorizontal: SIZE.MS(5),
                  borderColor: !isFix ? COLORS.SUCCESS : COLORS.ACCENT_ORANGE,
                  ...STYLES.SHADOW_BLACK_3,
                }}>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: FONTS.MEDIUM,
                      fontSize: SIZE.MS(14),
                      color: COLORS.PRIMARY_DARK,
                    }}>
                    {item.name + (!isFix ? ' (FH)' : ' (OH)')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.REGULAR,
                      fontSize: SIZE.MS(14),
                      color: COLORS.TEXT_MEDIUM,
                      marginTop: SIZE.MS(5),
                    }}>
                    {Common.formatDate(item.holidayDate)}
                  </Text>
                  {item?.id !== 0 && item?.status !== '' && (
                    <Text
                      style={{
                        fontFamily: FONTS.REGULAR,
                        fontSize: SIZE.MS(14),
                        color: item?.isApproved
                          ? COLORS.ACCENT_GREEN_LIGHT
                          : COLORS.TEXT_DARKER,
                        marginTop: SIZE.MS(5),
                      }}>
                      {t('status') + ': ' + (item?.status ?? '')}
                    </Text>
                  )}
                  {item?.id !== 0 && item?.isApproved && (
                    <Text
                      style={{
                        fontFamily: FONTS.REGULAR,
                        fontSize: SIZE.MS(14),
                        color: item?.isApproved
                          ? COLORS.ACCENT_GREEN_LIGHT
                          : COLORS.TEXT_DARKER,
                        marginTop: SIZE.MS(5),
                      }}>
                      {t('created_on') + ': ' + (item?.createdOn ?? '')}
                    </Text>
                  )}
                </View>
                {isFix && !isApplied && !item?.isApproved && (
                  <Buttons
                    type={'primary'}
                    title={item?.isApproved ? t('apply') : t('re_apply')}
                    viewStyle={{
                      height: SIZE.MVS(45),
                      width: SIZE.MS(80),
                      borderRadius: SIZE.MS(12),
                      paddingHorizontal: SIZE.MS(5),
                    }}
                    onPress={() => {
                      if (item?.id !== 0 && item?.status === '') {
                        Common.alert({
                          title: t('alert'),
                          msg: t('already_applied'),
                        });
                      } else {
                        applyHoliday(item?.id ?? 0);
                      }
                    }}
                  />
                )}
              </View>
            );
          }}
        />
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.leave.holidayListLoading === 'pending',
  data: state.leave.holidayListData ?? [],
});
export default connect(MapStateToProps)(HolidaysList);

const styles = StyleSheet.create({
  innerView: {flex: 1, padding: SIZE.MS(10)},
});
