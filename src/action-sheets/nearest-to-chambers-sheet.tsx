/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {DataType} from '@types';
import React, {memo} from 'react';
import RootSheet from './root-sheet';

const NearestToChambersActionSheet = ({
  data,
  value,
  setValue,
}: {
  data: DataType.NearestChamber[] | null;
  value: DataType.NearestChamber | null;
  setValue: (data: DataType.NearestChamber) => void;
}) => {
  return (
    <RootSheet
      value={value}
      title={'Select To Chamber'}
      placeholder={'Select Chamber'}
      data={data ?? []}
      rowUniqueKey={'chamber_id'}
      rowTitleKey={'chamber_name'}
      setValue={setValue}
      rowType={'nearestChamber'}
    />
  );
};

export default memo(NearestToChambersActionSheet);
