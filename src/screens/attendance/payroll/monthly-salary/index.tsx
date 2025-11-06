/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import {InfoAttendamceSheet} from '@screens/attendance/components/info-sheet';
import {getEmpMonthlySalaryApi} from '@slices/payroll.slice';
import {DataType, ScreenProps} from '@types';
import {Common} from '@utils';
import React, {FC, ReactNode, useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import YearMonthPicker from 'react-native-year-month-pickers';
import {connect, useDispatch} from 'react-redux';

interface TitleValue {
  title: string;
  value: string | number;
}
const Devider = () => {
  return <View style={styles.devider} />;
};
const DeviderV = () => {
  return <View style={styles.deviderV} />;
};
const HeadingText = ({text}: {text: string}) => {
  return <Text style={styles.headingText}>{text}</Text>;
};
const Card = ({heading, children}: {heading: string; children: ReactNode}) => {
  return (
    <>
      <HeadingText text={heading} />
      <View
        style={{
          borderWidth: SIZE.MS(1),
          borderColor: COLORS.BORDER_DEFAULT,
          borderRadius: SIZE.MS(6),
          backgroundColor: COLORS.WHITE,
        }}>
        {children}
      </View>
    </>
  );
};
const EmpDetailsRow = ({title, value}: TitleValue) => {
  return (
    <View style={styles.empRowView}>
      <Text style={styles.empRowTitle}>{title}</Text>
      <Text style={styles.empRowValue}>{value}</Text>
    </View>
  );
};
const NetPayRow = ({title, value}: TitleValue) => {
  return (
    <View style={styles.netpayRowView}>
      <Text style={styles.netpayRowTitle}>{title}</Text>
      <Text style={styles.netpayRowValue}>{value}</Text>
    </View>
  );
};
const EmployeeDetailsCard = ({
  desig,
  ctc,
  empName,
}: {
  desig: string;
  ctc: string;
  empName: string;
}) => {
  return (
    <Card heading={'Employee Details'}>
      <EmpDetailsRow title={'Employee Name'} value={empName ?? '-'} />
      <Devider />
      <EmpDetailsRow title={'Designation'} value={desig ?? '-'} />
      <Devider />
      <EmpDetailsRow title={'Monthly CTC'} value={'₹' + (ctc ?? '00.00')} />
    </Card>
  );
};

const LeaveRow = ({title, value}: TitleValue) => {
  return (
    <View style={styles.leaveRowView}>
      <Text style={styles.leaveRowTitle}>{title}</Text>
      <Text style={styles.leaveRowValue}>{value}</Text>
    </View>
  );
};
const LeavesCard = ({cl, el, sl}: {cl: number; el: number; sl: number}) => {
  return (
    <>
      <HeadingText text={'Leaves'} />
      <View style={styles.leaveCardView}>
        <LeaveRow title={'CL'} value={cl} />
        <DeviderV />
        <LeaveRow title={'EL'} value={el} />
        <DeviderV />
        <LeaveRow title={'SL'} value={sl} />
      </View>
    </>
  );
};

const AttendanceRow = ({title, value}: TitleValue) => {
  return (
    <View style={styles.attRowView}>
      <Text style={styles.attRowTitle}>{title}</Text>
      <Text
        style={[
          styles.attRowValue,
          {
            color:
              title === 'P'
                ? COLORS.SUCCESS
                : title === 'A'
                ? COLORS.ERROR
                : COLORS.TEXT_DARK,
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};
const AttendanceCard = ({
  p,
  a,
  wo,
  dd,
  ot,
  hd,
  pd,
  sw,
  skw,
  hsw,
  ohnh,
  onInfoPress,
}: any) => {
  return (
    <>
      <View style={styles.attCardView}>
        <HeadingText text={'Attendance'} />
        <Buttons
          type={'icon'}
          icon={IMAGES.info}
          iconStyle={styles.icon}
          onPress={onInfoPress}
        />
      </View>
      <View style={styles.attCardInViewTop}>
        <AttendanceRow title={'P'} value={p ?? 0} />
        <AttendanceRow title={'A'} value={a ?? 0} />
        <AttendanceRow title={'WO'} value={wo ?? 0} />
        <AttendanceRow title={'DD'} value={dd ?? 0} />
        <AttendanceRow title={'OT'} value={ot ?? 0} />
        <AttendanceRow title={'HD'} value={hd ?? 0} />
      </View>
      <View style={styles.attCardInViewBottom}>
        <AttendanceRow title={'PD'} value={pd ?? 0} />
        <AttendanceRow title={'SW'} value={sw ?? 0} />
        <AttendanceRow title={'SKW'} value={skw ?? 0} />
        <AttendanceRow title={'HSW'} value={hsw ?? 0} />
        <AttendanceRow title={'OHNH'} value={ohnh ?? 0} />
      </View>
    </>
  );
};

const PaybleDaysCard = ({tpd}: {tpd: string}) => {
  return (
    <Card heading={'Days'}>
      <EmpDetailsRow title={'Total Payable Days'} value={tpd ?? 0} />
    </Card>
  );
};

const EarningBreakupCard = ({data}: {data: DataType.SalaryEarnings[]}) => {
  return (
    <Card heading={'Earning Breakup'}>
      {data?.map((item: DataType.SalaryEarnings) => (
        <React.Fragment key={item.earningId}>
          <EmpDetailsRow
            title={item.earningName}
            value={'₹' + item.earing.toFixed(2)}
          />
          <Devider />
        </React.Fragment>
      ))}
    </Card>
  );
};
const DeductionBreakupCard = ({
  data,
  adv,
  netPay,
}: {
  data: DataType.SalaryDeductions[];
  adv: string;
  netPay: string;
}) => {
  return (
    <Card heading={'Deduction Breakup'}>
      {data?.map((item: DataType.SalaryDeductions) => (
        <React.Fragment key={item.deductionId}>
          <EmpDetailsRow
            title={item.deductionName}
            value={'₹' + item?.deduction?.toFixed(2)}
          />
          <Devider />
        </React.Fragment>
      ))}

      <EmpDetailsRow title={'Advance'} value={'₹' + adv} />
      <Devider />
      <Devider />
      <NetPayRow title={'Net Payable'} value={'₹' + netPay} />
    </Card>
  );
};

//! ********************** Monthly Salary Screen **********************
const MonthlySalary: FC<ScreenProps.MonthlySalary> = ({
  navigation,
  loading,
  data,
  empId,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [month, setMonth] = useState<string>(Common.getCurrentMonth() + '');
  const [year, setYear] = useState<string>(Common.getCurrentYear() + '');
  console.log('data', data);
  const dispatch = useDispatch<StoreDispatch>();

  const getData = useCallback(
    (cmonth: string, cyear: string) => {
      dispatch(
        getEmpMonthlySalaryApi({
          year: `${cyear}`,
          month: `${cmonth}`,
          salaryFormulaId: 0,
          empId: empId,
        }),
      );
    },
    [dispatch, empId],
  );

  useEffect(() => {
    getData(month, year);
    return () => {};
  }, [month, year, dispatch, getData]);

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'scroll'}
      loading={loading}
      fixedComponent={
        <BackHeader
          headerTitle={'Monthly Salary'}
          onBackPress={() => {
            navigation.goBack();
          }}
        />
      }
      fixedBottomComponent={
        <Buttons
          type={'primary'}
          title={'Pay Slip'}
          onPress={() => {
            if (data) {
              navigation.navigate('SalaryPaySlip');
            } else {
              Common.showToast('No Salary Data Found!');
            }
          }}
          viewStyle={{margin: SIZE.MS(15)}}
        />
      }>
      <View style={styles.innerView}>
        <Buttons
          type={'rightIconText'}
          icon={IMAGES.calendar}
          viewStyle={styles.dateButton}
          iconStyle={styles.icon}
          titleStyle={styles.buttonTitleText}
          onPress={() => setShowPicker(true)}
          title={Common.dateFormatFromTo(
            month + '/' + year,
            'MM/YYYY',
            'MMM YYYY',
          )}
        />
        <EmployeeDetailsCard
          desig={data?.designationName ?? '-'}
          ctc={(data?.actualCtc ?? 0)?.toFixed(2) + ''}
          empName={(data?.firstName ?? '-') + ' ' + (data?.lastName ?? '')}
        />
        <LeavesCard
          cl={data?.casualLeave ?? 0}
          el={data?.earnedLeave ?? 0}
          sl={data?.sickLeave ?? 0}
        />
        <AttendanceCard
          p={data?.workingDays}
          a={data?.absentDays}
          wo={data?.weekOff}
          dd={data?.doubleDuty}
          ot={data?.totalOT ? (data?.totalOT).toFixed(2) : 0}
          hd={data?.holidaySandwich}
          pd={data?.penaltyDays}
          sw={data?.woSandwich}
          skw={data?.sickLeave}
          hsw={data?.holidaySandwich}
          ohnh={data?.ohnh}
          onInfoPress={() => {
            setShowInfo(true);
          }}
        />
        <PaybleDaysCard tpd={(data?.totalPayableDays ?? 0).toFixed(2)} />
        <Text style={styles.breakupText}>{'SALARY BREAKUP'}</Text>
        <EarningBreakupCard data={data?.earings ?? []} />
        <DeductionBreakupCard
          data={data?.deductions ?? []}
          adv={(data?.advanceDeduction ?? 0).toFixed(2)}
          netPay={(data?.inHand ?? 0).toFixed(2)}
        />

        <YearMonthPicker
          primaryColor={COLORS.PRIMARY}
          show={showPicker}
          value={month + '/' + year}
          onClose={() => setShowPicker(false)}
          onDone={dt => {
            setMonth(dt.split('/')[0]);
            setYear(dt.split('/')[1]);
            setShowPicker(false);
          }}
        />
        <InfoAttendamceSheet
          type={'monthlySalary'}
          show={showInfo}
          onClose={() => setShowInfo(false)}
        />
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.payroll.monthlySalLoading === 'pending',
  empId: state.dashboard.dashboardList?.employeeDetails?.id ?? 0,
  data: state.payroll.monthlySalaryData,
});
export default connect(MapStateToProps)(MonthlySalary);

const styles = StyleSheet.create({
  attCardInViewBottom: {
    flexDirection: 'row',
    marginTop: SIZE.MVS(10),
  },
  attCardInViewTop: {
    flexDirection: 'row',
  },
  attCardView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attRowValue: {
    fontSize: SIZE.MS(18),
    fontFamily: FONTS.REGULAR,
    flex: 1,
    marginTop: SIZE.MVS(15),
  },
  attRowTitle: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARKER,
    flex: 1,
  },
  attRowView: {
    backgroundColor: COLORS.WHITE,
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZE.MS(10),
    marginHorizontal: SIZE.MS(3),
    borderRadius: SIZE.MS(6),
  },
  leaveCardView: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(6),
  },
  leaveRowValue: {
    fontSize: SIZE.MS(18),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_DARK,
    flex: 1,
    marginTop: SIZE.MVS(15),
  },
  leaveRowTitle: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARKER,
    flex: 1,
  },
  leaveRowView: {
    backgroundColor: COLORS.LIST_HEADER,
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZE.MS(10),
    paddingHorizontal: SIZE.MS(10),
    borderRadius: SIZE.MS(6),
  },
  netpayRowTitle: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
    flex: 1,
  },
  netpayRowValue: {
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.REGULAR,
    color: COLORS.PRIMARY,
  },
  netpayRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZE.MVS(15),
    paddingHorizontal: SIZE.MVS(15),
  },
  empRowValue: {
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_DARK,
  },
  empRowTitle: {
    fontSize: SIZE.MS(15),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  empRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZE.MVS(15),
    paddingHorizontal: SIZE.MVS(15),
  },
  deviderV: {
    height: '100%',
    width: SIZE.MS(1),
    backgroundColor: COLORS.BORDER_DEFAULT,
  },
  devider: {height: 1, width: '100%', backgroundColor: COLORS.BORDER_DEFAULT},
  breakupText: {
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
    marginTop: SIZE.MVS(20),
    textAlign: 'center',
  },
  headingText: {
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY_DARK,
    marginBottom: SIZE.MS(10),
    marginTop: SIZE.MVS(20),
  },
  buttonTitleText: {
    color: COLORS.TEXT_DARK,
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.MEDIUM,
    flex: 1,
  },
  icon: {
    tintColor: COLORS.TEXT_LIGHT,
  },
  dateButton: {
    borderRadius: SIZE.MS(12),
    flex: 1,
    paddingHorizontal: SIZE.MS(15),
    backgroundColor: COLORS.WHITE,
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.BORDER_DEFAULT,
  },
  innerView: {flex: 1, padding: SIZE.MS(15)},
});
