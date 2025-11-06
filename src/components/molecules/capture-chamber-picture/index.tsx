import {Buttons} from '@atoms';
import {COLORS, IMAGES, SIZE} from '@res';
import {DataType} from '@types';
import {Common, Preferences} from '@utils';
import React, {FC, memo, useState} from 'react';
import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';

/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
interface Props {
  title: string;
  pic: DataType.ImagePickerResponse | null;
  setPic: (pic: DataType.ImagePickerResponse | null) => void;
  lat: number;
  long: number;
}
const CaptureChamberPicture: FC<Props> = ({title, pic, setPic, lat, long}) => {
  const [loading, setLoading] = useState(false);
  return (
    <View style={styles.imagePickerView}>
      <Image
        source={pic?.path ? {uri: pic?.path} : IMAGES.camera}
        style={[
          styles.imagePickerImg,
          {tintColor: pic?.path ? undefined : COLORS.BORDER_DEFAULT},
        ]}
      />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size={'large'} color={COLORS.PRIMARY_DARK} />
        </View>
      )}
      <Buttons
        type={'leftIconText'}
        title={title}
        icon={IMAGES.camera}
        iconStyle={styles.buttonIcons}
        viewStyle={styles.cameraPicButton}
        onPress={() => {
          setLoading(true);
          try {
            const geoAdd = Preferences.getData(
              'LAST_GEO_ADDRESS',
            ) as DataType.GeoAddress;

            Common.captureCameraImageWithWatermark(
              `Location: ${geoAdd?.address ?? 'N/A'}\nLatitude: ${lat?.toFixed(
                7,
              )} | Longitude : ${long?.toFixed(7)}\n${Common.getFormatedDate(
                'DD-MMM-YYYY hh:mm:ss A',
              )}`,
            ).then((data: any) => {
              setLoading(false);
              if (data) {
                setPic(data);
              } else {
                Common.showToast(
                  'There is an issue in click picture and add watermark',
                  'long',
                );
              }
            });
          } catch (error) {
            Common.error('ERRROR IN CAPTURE IMAGE:', error);
            setLoading(false);
          }
        }}
      />
    </View>
  );
};

export default memo(CaptureChamberPicture);
const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  cameraPicButton: {
    borderWidth: SIZE.MS(1),
    borderColor: COLORS.PRIMARY,
  },

  buttonIcons: {
    height: SIZE.MS(30),
    width: SIZE.MS(30),
    tintColor: COLORS.ACCENT_ORANGE,
  },
  imagePickerImg: {
    height: '80%',
    width: '100%',
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: SIZE.MS(10),
    marginBottom: SIZE.MS(5),
  },
  imagePickerView: {
    flex: 1,
    height: SIZE.MS(260),
    marginRight: SIZE.MS(5),
  },
});
