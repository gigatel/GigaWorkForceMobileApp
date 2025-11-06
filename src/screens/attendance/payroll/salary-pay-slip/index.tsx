/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {Buttons} from '@atoms';
import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {RootState} from '@reducers';
import {COLORS, CONSTANT, FONTS, IMAGES, SIZE} from '@res';
import {ScreenProps} from '@types';
import {Common, Permissions} from '@utils';
import React, {FC, useEffect, useMemo, useState} from 'react';
import {Alert, Platform, StyleSheet, View} from 'react-native';
interface Header {
  name: string;
  image: string;
}
// @ts-ignore
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import WebView from 'react-native-webview';
import {connect} from 'react-redux';
import RNFS from 'react-native-fs';
//! ********************** Salary Pay Slip Screen **********************
const SalaryPaySlip: FC<ScreenProps.SalaryPaySlip> = ({
  navigation,
  loading,
  compId,
  data,
}) => {
  const [headerImage, setHeaderImage] = useState<Header | null>(null);

  useEffect(() => {
    const loadHeaderImage = async () => {
      let imagePath;

      if (compId === CONSTANT.COMPANY_ID_NETWORK) {
        imagePath = IMAGES.header.network;
      } else if (compId === CONSTANT.COMPANY_ID_INFOCOMM) {
        imagePath = IMAGES.header.infocom;
      } else if (compId === CONSTANT.COMPANY_ID_TECHNOSOFT) {
        imagePath = IMAGES.header.technosoft;
      } else if (compId === CONSTANT.COMPANY_ID_SOLUTION) {
        imagePath = IMAGES.header.solution;
      }
      setHeaderImage(imagePath);
    };

    loadHeaderImage();
  }, [compId]);

  const earnings = useMemo(() => {
    return {
      basic: data?.earings?.find(item => item.earningName === 'Basic Salary')
        ?.earing,
      hra: data?.earings?.find(item => item.earningName === 'HRA')?.earing,
      ca: data?.earings?.find(
        item => item.earningName === 'Conveyance Allowance',
      )?.earing,
    };
  }, [data?.earings]);

  const deductions = useMemo(() => {
    return {
      employeePf: data?.deductions?.find(
        item => item.deductionName === 'Employee PF',
      )?.deduction,
      employerPf: data?.deductions?.find(
        item => item.deductionName === 'Employer PF',
      )?.deduction,
      employeeEsic: data?.deductions?.find(
        item => item.deductionName === 'Employee ESIC',
      )?.deduction,
      employerEsic: data?.deductions?.find(
        item => item.deductionName === 'Employer ESIC',
      )?.deduction,
    };
  }, [data?.deductions]);

  //content="width=device-width, initial-scale=1.0"
  const salaryHTML = `
<!DOCTYPE html>
<html>
<head>
 <meta name="viewport"  />
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 10px;
    }
    .container {
      border: 1px solid #000;
      padding: 10px;
      max-width: 700px;
      margin: auto;
    }
    .header {
      text-align: center;
      font-weight: bold;
    }
    .sub-header {
      font-size: 12px;
    }
    .title {
      text-align: center;
      font-size: 20px;
      margin: 16px 0;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    th, td {
      border: 1px solid #000;
      padding: 5px;
      font-size: 13px;
    }
    .section-title {
      font-weight: bold;
      background: #f0f0f0;
    }
    .earnings {
      background-color: #e8f5e9;
    }
    .deductions {
      background-color: #ffebee;
    }
    .note {
      text-align: center;
      font-size: 12px;
      margin-top: 5px;
    }
    .split-table {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }
    .split-table table {
      width: 48%;
    }
    .split-table th {
      background-color: #ddd;
    }
    .logo {
      display: block;
      margin: 0 auto 5px auto;
      max-width: 100%;
      height: 120px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
    <img src="${headerImage?.image ?? ''}" class="logo" />
    </div>
    <div class="title">SALARY STATEMENT</div>
    <table>
      <tr class="section-title"><td colspan="2">Employee Details</td></tr>
      <tr><td>Name</td><td>${
        data?.firstName +
        ' ' +
        ' ' +
        (data?.middleName ?? '') +
        ' ' +
        (data?.lastName ?? '')
      }</td></tr>
      <tr><td>Designation</td><td>${data?.designationName}</td></tr>
      <tr><td>Department</td><td>${data?.departmentName}</td></tr>
      <tr><td>Employee Number</td><td>${data?.employeeCode}</td></tr>
      <tr><td>Present Days</td><td>${(data?.totalPayableDays ?? 0).toFixed(
        2,
      )}</td></tr>
      <tr><td>Over Time</td><td>${
        data?.totalOT ? (data?.totalOT).toFixed(2) : 0
      }</td></tr>
      <tr><td>Salary Slip</td><td>${Common.dateFormatFromTo(
        data?.month + ' ' + data?.year,
        'M YYYY',
        'MMM YYYY',
      )}</td></tr>
    </table>

    <div class="split-table">
      <table class="earnings">
        <tr><th colspan="2">Earnings</th></tr>
        <tr><th>Salary Heads</th><th>Amt.</th></tr>
        <tr><td>Basic (A)</td><td>₹${earnings?.basic?.toFixed(2)}</td></tr>
        <tr><td>Allowances</td><td>${''}</td></tr>
        <tr><td>HRA</td><td>₹${(earnings.hra ?? 0).toFixed(2)}</td></tr>
        <tr><td>Conv.All</td><td>₹${(earnings.ca ?? 0).toFixed(2)}</td></tr>
        <tr><td>Others</td><td>${''}</td></tr>
        <tr><td>Total Allowances (B)</td><td></td></tr>
        <tr><td>Gross Salary (C=A+B)</td><td>₹${(
          data?.calculatedGross ?? 0
        ).toFixed(2)}</td></tr>
        <tr><td>Employer Contribution</td><td></td></tr>
        <tr><td>PF Employer</td><td>₹${
          deductions?.employerPf?.toFixed(2) ?? ''
        }</td></tr>
        <tr><td>ESI Employer</td><td>₹${
          deductions?.employerEsic?.toFixed(2) ?? ''
        }</td></tr>
        <tr><td>Reimbursement</td><td></td></tr>
        <tr><td>Telephone (Reimb)</td><td></td></tr>
        <tr><td>Medical (Reimb)</td><td></td></tr>
        <tr><td>Actual Salary</td><td>₹${(data?.actualCtc ?? 0).toFixed(
          2,
        )}</td></tr>
        <tr><td>Salary (CTC)/PA</td><td>₹${(
          (data?.actualCtc ?? 0) * 12
        ).toFixed(2)}</td></tr>
      </table>

      <table class="deductions">
        <tr><th colspan="2">Deductions</th></tr>
        <tr><th>Salary Heads</th><th>Amt.</th></tr>
        <tr><td>PF employee</td><td>₹${
          deductions?.employeePf?.toFixed(2) ?? ''
        }</td></tr>
        <tr><td>ESI employee</td><td>₹${
          deductions?.employeeEsic?.toFixed(2) ?? ''
        }</td></tr>
        <tr><td>Advance</td><td></td></tr>
        <tr><td>Deductions</td><td></td></tr>
        <tr><td>Gross Salary</td><td>₹${(data?.calculatedGross ?? 0).toFixed(
          2,
        )}</td></tr>
        <tr><td>Net Salary</td><td>₹${(data?.inHand ?? 0).toFixed(2)}</td></tr>
      </table>
    </div>

    <div class="note">
      This is a system generated payslip and does not required signature
    </div>
  </div>
</body>
</html>
  `;

  const savePDF = async () => {
    try {
      const hasStoragePermission = await Permissions.requestPermission();
      if (hasStoragePermission) {
        const filename = `Salary Slip (${Common.dateFormatFromTo(
          data?.month + ' ' + data?.year,
          'M YYYY',
          'MMM YYYY',
        )})`;
        const file = await RNHTMLtoPDF.convert({
          html: salaryHTML,
          fileName: filename,
          directory: 'Documents',
        });
        //<app sandbox>/Documents/salary_slip.pdf
        let finalPath = file.filePath;
        if (Platform.OS === 'android') {
          const destPath = `${RNFS.DownloadDirectoryPath}/${filename}.pdf`;
          // console.log('Storage permission granted', file);

          // Move file to Downloads
          await RNFS.moveFile(file.filePath, destPath);
          finalPath = destPath;
        }

        Alert.alert('PDF Saved', `File saved to:\n${finalPath}`);
      }
    } catch (error) {
      Common.log('Error saving PDF:', error);
      Common.alert({
        title: 'Error',
        msg: 'Failed to save PDF. Please try again.',
      });
    }
  };

  return (
    <Screen
      statusBgColor={COLORS.PRIMARY}
      preset={'scroll'}
      loading={loading}
      fixedComponent={
        <BackHeader
          headerTitle={'Salary Pay Slip'}
          onBackPress={() => {
            navigation.goBack();
          }}
        />
      }
      fixedBottomComponent={
        <Buttons
          type={'primary'}
          title={'Save PDF'}
          onPress={() => {
            savePDF();
          }}
          viewStyle={{margin: SIZE.MS(15)}}
        />
      }>
      <View style={styles.innerView}>
        <WebView
          originWhitelist={['*']}
          source={{html: salaryHTML}}
          style={{flex: 1}}
          startInLoadingState={true}
          textInteractionEnabled={false}
        />
      </View>
    </Screen>
  );
};

const MapStateToProps = (state: RootState) => ({
  loading: state.payroll.monthlySalLoading === 'pending',
  data: state.payroll.monthlySalaryData,
  compId: state.dashboard.dashboardList?.employeeDetails.companyId ?? 0,
});
export default connect(MapStateToProps)(SalaryPaySlip);

const styles = StyleSheet.create({
  buttonTitleText: {
    color: COLORS.TEXT_DARK,
    fontSize: SIZE.MS(17),
    fontFamily: FONTS.MEDIUM,
    flex: 1,
  },
  icon: {
    tintColor: COLORS.TEXT_LIGHT,
  },

  innerView: {flex: 1, backgroundColor: COLORS.WHITE},
});
