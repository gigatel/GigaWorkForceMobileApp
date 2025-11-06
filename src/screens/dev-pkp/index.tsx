/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 @ This File Created for Developer experiments.
 */
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {RootState} from '@reducers';
import {COLORS, SIZE} from '@res';
import {ScreenProps} from '@types';
import React, {FC} from 'react';
import {StyleSheet, View} from 'react-native';
import {connect} from 'react-redux';

//! ***************** Developer PKP Screen ***************
const DeveloperPKPScreen: FC<ScreenProps.DeveloperPKPScreen> = ({
  loading,
  navigation,
}) => {
  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'fixed'}
      statusBarStyle={'light'}
      loading={loading}
      // loaderMessage={''}
    >
      <BackHeader headerTitle={'PKP'} onBackPress={() => navigation.goBack()} />
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.chamberComplaint.complaintListLoading === 'pending',
  totalPage: state.chamberComplaint.complaintTotalPage,
  data: state.chamberComplaint.complaintListData,
  empData: state.dashboard.dashboardList?.employeeDetails,
  empShift: state.attendance.employeeShift,
});
export default connect(MapStateToProps)(DeveloperPKPScreen);

const styles = StyleSheet.create({
  devider: {
    height: 1,
    backgroundColor: COLORS.BORDER_DEFAULT,
    width: '100%',
    marginVertical: SIZE.MVS(8),
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
});
