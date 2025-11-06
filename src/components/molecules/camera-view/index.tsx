/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {SIZE} from '@res';
import React, {useEffect, useRef} from 'react';
import {StyleSheet} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import ModalSheet from '../modal-sheet';
import {Common} from '@utils';
import {useDispatch} from 'react-redux';
import {StoreDispatch} from '@reducers';
import {checkCameraPermission} from '@slices/permission.slice';

interface CameraView {
  show: boolean;
  onDone: (img: any) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraView> = ({show, onDone, onClose}) => {
  const cameraRef = useRef<any>(null);
  const dispatch = useDispatch<StoreDispatch>();

  useEffect(() => {
    dispatch(checkCameraPermission());
  }, [dispatch]);

  const captureImage = async () => {
    try {
      const image = await cameraRef.current?.capture();
      const base64Image = await Common.convertImageToBase64(image.uri);

      if (base64Image) {
        Common.log('Base64 Image', base64Image);
        // <Image source={{ uri: `data:image/jpeg;base64,${base64String}` }} />
        onDone?.({
          ...image,
          base64: base64Image,
        });
      }
    } catch (error) {
      Common.error('Error capturing image:', error);
      onDone?.(null);
    }
  };

  return (
    <ModalSheet
      show={show}
      primaryTitle={'Done'}
      deleteTitle={'Cancel'}
      onPrimaryPress={() => {
        captureImage();
      }}
      onDeletePress={onClose}>
      <Camera
        ref={cameraRef}
        cameraType={CameraType.Back}
        flashMode="auto"
        style={styles.cameraStyle}
        resizeMode={'contain'}
        maxPhotoQualityPrioritization={'balanced'}
        shutterPhotoSound={true}
      />
    </ModalSheet>
  );
};

export default CameraView;

const styles = StyleSheet.create({
  cameraStyle: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  outerView: {},
});
