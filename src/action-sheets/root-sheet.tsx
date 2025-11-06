/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import {DropdownInput} from '@atoms';
import {OptionPickerSheet} from '@molecules';
import {DataType} from '@types';
import {Common} from '@utils';
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';

const RootSheet = ({
  data,
  title,
  placeholder,
  value,
  disabled,
  rowType,
  sheetType,
  rowUniqueKey,
  rowTitleKey,
  enableSearch,
  alertMessage,
  setValue,
}: {
  data: any;
  title?: string;
  alertMessage?: string;
  placeholder?: string;
  value: any | null;
  disabled?: boolean;
  rowType: DataType.SheetRowType;
  sheetType?: 'single' | 'multiple';
  rowUniqueKey: string;
  rowTitleKey: string;
  enableSearch?: boolean;
  setValue: (data: any) => void;
}) => {
  const {t} = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  return (
    <>
      <DropdownInput
        title={title ?? 'Option Sheet'}
        disabled={disabled ?? false}
        value={value?.[rowTitleKey] ?? t('select')}
        placeholder={placeholder ?? t('select')}
        onPress={() => {
          if (alertMessage) {
            Common.alert({
              title: 'Alert',
              msg: alertMessage,
            });
          } else {
            setShowPicker(true);
          }
        }}
      />
      <OptionPickerSheet
        rowType={rowType}
        show={showPicker}
        value={value != null ? [value] : value}
        type={sheetType ?? 'single'}
        title={title ?? t('select')}
        data={data ?? []}
        rowUniqueKey={rowUniqueKey}
        enableSearch={enableSearch ?? false}
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

export default RootSheet;
