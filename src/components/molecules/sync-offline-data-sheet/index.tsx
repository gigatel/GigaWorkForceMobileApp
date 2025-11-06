/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import React from 'react';
import {Image, StyleSheet, Text} from 'react-native';
import ModalSheet from '../modal-sheet';

interface SyncOfflineDataSheetProps {
  show: boolean;
  onSyncPress: () => void;
}

const SyncOfflineDataSheet: React.FC<SyncOfflineDataSheetProps> = ({
  show,
  onSyncPress,
}) => {
  return (
    <ModalSheet
      show={show}
      title={'Sync Offline Data'}
      onPrimaryPress={onSyncPress}
      primaryTitle={'Sync Now'}>
      <Image
        source={IMAGES.sync}
        resizeMode={'contain'}
        style={styles.iconStyle}
      />
      <Text style={styles.infoTitleText}>
        {
          'You have unsynced offline attendance data. Please sync now to submit it to the server.\n\nआपके पास ऑफ़लाइन उपस्थिति डेटा है। कृपया इसे सर्वर पर भेजने के लिए अभी सिंक करें।'
        }
      </Text>
    </ModalSheet>
  );
};

export default SyncOfflineDataSheet;

const styles = StyleSheet.create({
  infoTitleText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MS(18),
    color: COLORS.TEXT_DARK,
  },
  iconStyle: {
    width: SIZE.MS(120),
    height: SIZE.MS(120),
    alignSelf: 'center',
    tintColor: COLORS.PRIMARY_DARK,
    marginBottom: SIZE.MS(10),
  },

  outerView: {
    marginVertical: SIZE.MVS(10),
  },
});
