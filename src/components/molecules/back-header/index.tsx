import {RootState} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';

interface BackHeaderProps {
  showGps?: boolean;
  onBackPress: () => void;
  headerTitle?: string;
}
const IconView = ({icon, tint, style}: any) => {
  return (
    <View style={styles.statusView}>
      <Image source={icon} style={style} tintColor={tint} />
    </View>
  );
};
const BackHeader: React.FC<BackHeaderProps> = ({
  onBackPress,
  headerTitle,
  showGps = true,
}) => {
  const device = useSelector((state: RootState) => state.device);
  console.log('deviceData==>', {device});

  return (
    <View style={styles.container}>
      {onBackPress && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Image source={IMAGES.back} style={styles.backIcon} />
        </TouchableOpacity>
      )}
      {headerTitle && <Text style={styles.headerTitleText}>{headerTitle}</Text>}
      <IconView
        icon={device.isNet ? IMAGES.wifiOn : IMAGES.wifiOff}
        tint={device.isNet ? COLORS.SUCCESS : COLORS.ERROR}
        style={styles.wifiOnImage}
      />
      {showGps && Platform.OS === 'android' && (
        <IconView
          icon={device.isGpsEnabled ? IMAGES.gpsOn : IMAGES.gpsOff}
          style={styles.gpsOnImage}
          tint={device.isGpsEnabled ? COLORS.SUCCESS : COLORS.ERROR}
        />
      )}
    </View>
  );
};

export default BackHeader;

const styles = StyleSheet.create({
  statusView: {
    height: SIZE.MS(40),
    width: SIZE.MS(40),
    borderRadius: SIZE.MS(6),
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZE.MVS(10),
  },
  wifiOnImage: {
    width: SIZE.MVS(28),
    height: SIZE.MVS(28),
    resizeMode: 'contain',
    padding: SIZE.MS(5),
    backgroundColor: COLORS.WHITE,
  },
  gpsOnImage: {
    width: SIZE.MVS(30),
    height: SIZE.MVS(30),
    resizeMode: 'contain',
    backgroundColor: COLORS.WHITE,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
  },
  backButton: {
    height: SIZE.MS(55),
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZE.MS(15),
    backgroundColor: COLORS.PRIMARY,
  },
  headerTitleText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(18),
    color: COLORS.WHITE,
    flex: 1,
  },
  backIcon: {
    tintColor: COLORS.WHITE,
    marginRight: SIZE.MS(5),
    width: SIZE.MS(30),
    height: SIZE.MS(30),
    resizeMode: 'contain',
  },
});
