/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {ListView} from '@atoms';
import {ModalSheet} from '@molecules';
import {COLORS, FONTS, SIZE} from '@res';
import React, {FC, memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface InfoData {
  id: number;
  name: string;
  desc: string;
}
const INFO_DATA = {
  single: [
    {
      id: 1,
      name: 'P',
      desc: 'Present',
    },
    {
      id: 2,
      name: 'A',
      desc: 'Abset',
    },
    {
      id: 3,
      name: 'HD',
      desc: 'Half Day',
    },
    {
      id: 4,
      name: 'WO',
      desc: 'Week off',
    },
    {
      id: 5,
      name: 'OH',
      desc: 'Optional Holiday',
    },
    {
      id: 6,
      name: 'EL',
      desc: 'Earned Leave',
    },
    {
      id: 7,
      name: 'EL/2',
      desc: 'Half Day Earned Leave',
    },
    {
      id: 8,
      name: 'PI',
      desc: 'Punch In',
    },
    {
      id: 9,
      name: 'MP',
      desc: 'Miss punch',
    },
    {
      id: 10,
      name: 'H',
      desc: 'Fixed Holidy',
    },
  ],
  monthlySalary: [
    {
      id: 1,
      name: 'P',
      desc: 'Present',
    },
    {
      id: 2,
      name: 'A',
      desc: 'Abset',
    },
    {
      id: 3,
      name: 'HD',
      desc: 'Half Day',
    },
    {
      id: 13,
      name: 'DD',
      desc: 'Double Duty',
    },
    {
      id: 14,
      name: 'PD',
      desc: 'Penalty Days',
    },
    {
      id: 4,
      name: 'WO',
      desc: 'Week off',
    },
    {
      id: 5,
      name: 'EL',
      desc: 'Earned Leave',
    },
    {
      id: 6,
      name: 'CL',
      desc: 'Casual Leave',
    },
    {
      id: 7,
      name: 'SL',
      desc: 'Sick Leave',
    },
    {
      id: 8,
      name: 'OT',
      desc: 'Over Time',
    },
    {
      id: 9,
      name: 'SW',
      desc: 'SandWich',
    },
    {
      id: 10,
      name: 'SKW',
      desc: 'Skip Week Off',
    },
    {
      id: 11,
      name: 'HSW',
      desc: 'Holiday SandWich',
    },
    {
      id: 12,
      name: 'OHNH',
      desc: 'Optional and Fixed Holiday',
    },
  ],
};
const InfoRow: FC<InfoData> = memo(({name, desc}) => {
  return (
    <View style={styles.infoViewRow}>
      <Text style={styles.infoShortText}>{`${name}`}</Text>
      <Text style={styles.infoDescText}>{desc}</Text>
    </View>
  );
});
interface InfoAttendamceSheetPrpos {
  show: boolean;
  onClose: () => void;
  type: 'single' | 'monthlySalary';
}

export const InfoAttendamceSheet: FC<InfoAttendamceSheetPrpos> = memo(
  ({show, onClose, type = 'single'}) => {
    return (
      <ModalSheet
        show={show}
        title={'Information'}
        onClose={onClose}
        onClosePress={onClose}>
        <ListView
          data={INFO_DATA[type]}
          bounces={true}
          renderItem={({item}) => <InfoRow {...item} />}
        />
      </ModalSheet>
    );
  },
);
const styles = StyleSheet.create({
  infoViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZE.MVS(12),
    borderBottomWidth: SIZE.MS(1),
    borderColor: COLORS.BORDER_DEFAULT,
  },
  infoShortText: {
    flex: 0.3,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY_DARK,
    fontSize: SIZE.MS(15),
  },
  infoDescText: {
    flex: 1,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
    fontSize: SIZE.MS(15),
  },
});
