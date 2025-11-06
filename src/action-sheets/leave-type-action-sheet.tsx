/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {DropdownInput} from '@atoms';
import {OptionPickerSheet} from '@molecules';
import {DATA} from '@res';
import {DataType} from '@types';
import React, {memo, useState} from 'react';

const LeaveTypeActionSheet = ({
  value,
  setValue,
}: {
  value: DataType.IdName | null;
  setValue: (data: DataType.IdName) => void;
}) => {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <>
      <DropdownInput
        title={'Leave Type'}
        disabled={false}
        value={value?.name ?? 'Select'}
        placeholder={'Select Leave Type'}
        onPress={() => setShowPicker(true)}
      />
      <OptionPickerSheet
        rowType={'default'}
        show={showPicker}
        value={value != null ? [value] : value}
        type={'single'}
        title={'Select Leave Type'}
        data={DATA?.LEAVE_TYPE ?? []}
        rowUniqueKey={'id'}
        enableSearch={false}
        // searchKeys={['name', 'id']}
        onClose={() => {
          setShowPicker(false);
        }}
        onDone={item => {
          setShowPicker(false);
          setValue(item?.[0]);
        }}
      />
    </>
  );
};

export default memo(LeaveTypeActionSheet);
