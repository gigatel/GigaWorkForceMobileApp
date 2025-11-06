import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import {checkCameraPermission} from '@slices/permission.slice';
import {Common} from '@utils';
import React, {useEffect} from 'react';
import {Image, StyleSheet, Text} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import ModalSheet from '../modal-sheet';

const CameraPermission = ({}) => {
  const permRes = useSelector((state: RootState) => state.permission.camera);
  const loading = useSelector(
    (state: RootState) => state.permission.loading === 'pending',
  );

  // Common.log('Permission Result', permRes);
  const dispatch = useDispatch<StoreDispatch>();

  useEffect(() => {
    return () => {};
  }, [dispatch]);

  if (loading) {
    return <></>;
  }
  const isBlocked = permRes === 'blocked';
  return (
    <ModalSheet
      show={permRes !== 'granted'}
      title={'Permission Required'}
      onPrimaryPress={() => {
        if (isBlocked) {
          Common.openSettings();
        } else {
          dispatch(checkCameraPermission());
        }
      }}
      primaryTitle={'Allow Access'}>
      <Image
        source={IMAGES.cameraPermission}
        resizeMode={'contain'}
        style={styles.iconStyle}
      />
      <Text style={styles.infoTitleText}>
        {'Camera Permission Information'}
      </Text>
      <Text style={styles.infoDescText}>
        {
          'GTPL requires access to your camera to take pictures for attendance and daily tasks.'
        }
      </Text>

      {isBlocked && (
        <Text style={styles.blockedDesctext}>
          {
            'You have denied location access multiple times, so we can no longer request it automatically. Please enable location permissions manually in your device settings.'
          }
        </Text>
      )}
    </ModalSheet>
  );
};

export default CameraPermission;

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
