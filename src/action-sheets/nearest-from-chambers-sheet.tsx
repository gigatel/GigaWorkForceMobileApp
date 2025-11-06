/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {RootState} from '@reducers';
import {DataType} from '@types';
import React, {memo} from 'react';
import {useSelector} from 'react-redux';
import RootSheet from './root-sheet';

const NearestChambersActionSheet = ({
  value,
  setValue,
  title,
}: {
  title: string;
  value: DataType.NearestChamber | null;
  setValue: (data: DataType.NearestChamber) => void;
}) => {
  const data = useSelector(
    (state: RootState) => state.chamberComplaint.nearestChambersData,
  );

  return (
    <RootSheet
      value={value}
      title={title}
      placeholder={title}
      data={data ?? []}
      rowUniqueKey={'chamber_id'}
      rowTitleKey={'chamber_name'}
      setValue={setValue}
      rowType={'nearestChamber'}
    />
  );
};

export default memo(NearestChambersActionSheet);
