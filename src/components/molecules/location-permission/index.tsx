import {Buttons, ListView} from '@atoms';
import {COLORS, CONTENT, FONTS, IMAGES, SIZE} from '@res';
import {Preferences} from '@utils';
import React, {memo} from 'react';
import {
  BackHandler,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ModalSheet from '../modal-sheet';

interface LocationPermissionProps {
  show: boolean;
  onPrivacyPress?: () => void;
  onAllowPress?: () => void;
}

const PrivacyItem = memo(({item}: {item: any}) => {
  return (
    <View style={styles.outerView}>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.descText}>{item.description}</Text>
    </View>
  );
});

export const PrivacyList = () => {
  return (
    <ListView
      data={CONTENT.privacyContent}
      renderItem={({item}) => <PrivacyItem item={item} />}
    />
  );
};

const LocationPermission: React.FC<LocationPermissionProps> = ({
  show,
  onPrivacyPress,
  onAllowPress,
}) => {
  return (
    <ModalSheet
      show={show}
      title={'Permission Required'}
      onPrimaryPress={() => {
        Preferences.setData('FIRST_OPEN', 'no');
        Preferences.setData('ALLOWED_ACCESS_FOR_LOCATION_BACKGROUND', 'yes');
        onAllowPress?.();
      }}
      primaryTitle={'Allow Access'}
      closeTitle={'Exit'}
      onClosePress={
        Platform.OS === 'android'
          ? () => {
              BackHandler.exitApp();
            }
          : undefined
      }>
      <Image
        source={IMAGES.LocationAccess}
        resizeMode={'contain'}
        style={styles.iconStyle}
      />
      <Text style={styles.infoTitleText}>
        {'Location Permission Information'}
      </Text>
      <Text style={styles.infoDescText}>
        {
          'GTPL needs your location to monitor your work tasks effectively. With your permission, we’ll collect location data when you’re using the app or when it’s in the background to support your daily operations.'
        }
      </Text>
      <Buttons
        type={'leftIconText'}
        title={'Check GTPL Privacy Policy'}
        icon={IMAGES.Privacy}
        viewStyle={styles.privacyButton}
        onPress={onPrivacyPress}
      />
      {/* {isBlocked && (
        <Text style={styles.blockedDesctext}>
          {
            'You have denied location access multiple times, so we can no longer request it automatically. Please enable location permissions manually in your device settings.'
          }
        </Text>
      )} */}
    </ModalSheet>
  );
};

export default LocationPermission;

const styles = StyleSheet.create({
  privacyButton: {
    alignSelf: 'flex-start',
    marginVertical: SIZE.MVS(15),
    borderRadius: 0,
  },
  blockedDesctext: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MS(13),
    color: COLORS.ERROR,
    marginTop: SIZE.MVS(10),
  },
  infoDescText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MS(13),
    color: COLORS.TEXT_LIGHT,
    marginTop: SIZE.MVS(10),
  },
  infoTitleText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MS(18),
    color: COLORS.TEXT_DARK,
  },
  iconStyle: {
    width: SIZE.MS(180),
    height: SIZE.MS(180),
    alignSelf: 'center',
  },
  titleText: {
    fontSize: SIZE.MS(16),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARKER,
    marginBottom: SIZE.MVS(10),
  },
  descText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: SIZE.MVS(10),
  },
  outerView: {
    marginVertical: SIZE.MVS(10),
  },
});
