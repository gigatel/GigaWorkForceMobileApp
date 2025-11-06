/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {RootState} from '@reducers';
import {DataType} from '@types';
import React, {memo} from 'react';
import {useSelector} from 'react-redux';
import RootSheet from './root-sheet';

const ChamberComplaintPriorityActionSheet = ({
  value,
  setValue,
}: {
  value: DataType.IdName | null;
  setValue: (data: DataType.IdName) => void;
}) => {
  const data = useSelector(
    (state: RootState) => state.chamberComplaint.chamberPriorityData,
  );
  return (
    <RootSheet
      data={data}
      value={value}
      setValue={setValue}
      title={'Complaint Priority'}
      placeholder={'Select Priority'}
      rowType={'default'}
      rowUniqueKey={'id'}
      rowTitleKey={'name'}
    />
  );
};

export default memo(ChamberComplaintPriorityActionSheet);
