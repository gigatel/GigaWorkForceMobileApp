/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {RootState} from '@reducers';
import {DataType} from '@types';
import React, {memo} from 'react';
import {useSelector} from 'react-redux';
import RootSheet from './root-sheet';

const ChamberIssueListActionSheet = ({
  title,
  placeholder,
  value,
  alertMessage,
  setValue,
}: {
  title?: string;
  placeholder?: string;
  value: DataType.IdName | null;
  setValue: (data: DataType.IdName) => void;
  alertMessage?: string;
}) => {
  const data = useSelector((state: RootState) => state.task.chamberIssueData);
  return (
    <>
      <RootSheet
        title={title ?? 'Chamber Issue'}
        value={value}
        placeholder={placeholder ?? 'Select Chamber Issue'}
        disabled={false}
        setValue={setValue}
        rowType={'default'}
        rowTitleKey={'name'}
        rowUniqueKey={'id'}
        data={data ?? []}
        alertMessage={alertMessage}
      />
    </>
  );
};

export default memo(ChamberIssueListActionSheet);
