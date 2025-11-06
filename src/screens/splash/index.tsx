import {Screen} from '@organisms';
import {StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import {getLoginTokenApi} from '@slices/dashboard.slice';
import {Preferences} from '@utils';
import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useDispatch} from 'react-redux';
const Splash = () => {
  const dispatch = useDispatch<StoreDispatch>();
  useEffect(() => {
    dispatch(getLoginTokenApi());
    const isFirst = Preferences.getData('FIRST_OPEN');
    if (isFirst !== 'no') {
      Preferences.clearAll();
    }
  }, [dispatch]);
  if (__DEV__) {
    return (
      <Screen
        isSafeArea={false}
        preset={'fixed'}
        statusBarStyle="dark"
        statusBgColor={COLORS.TRANSPARENT}
        translucent={true}>
        <View style={styles.container}>
          <Animatable.Image
            duration={2000}
            animation={'slideInDown'}
            source={IMAGES.splashbg}
            style={styles.bgImage}
            resizeMode={'cover'}
          />
          <View style={styles.innercontainer}>
            <View style={styles.innerContainer}>
              <Animatable.Image
                duration={2000}
                animation={'zoomIn'}
                source={IMAGES.appLogo}
                style={styles.logoImge}
                resizeMode={'contain'}
              />
            </View>{' '}
            <Animatable.Text
              duration={2000}
              animation={'slideInUp'}
              style={styles.slogenText}>
              {'Powered by Gigatel'}
            </Animatable.Text>
          </View>
        </View>
      </Screen>
    );
  }
  return (
    <Screen
      isSafeArea={false}
      preset={'fixed'}
      statusBarStyle="dark"
      statusBgColor={COLORS.TRANSPARENT}
      translucent={true}>
      <View style={styles.container}>
        <Animatable.Image
          duration={2000}
          animation={'slideInDown'}
          source={IMAGES.splashbg}
          style={styles.bgImage}
          resizeMode={'cover'}
        />
        <View style={styles.innercontainer}>
          <View style={styles.innerContainer}>
            <Animatable.Image
              duration={2000}
              animation={'zoomIn'}
              source={IMAGES.appLogo}
              style={styles.logoImge}
              resizeMode={'contain'}
            />
          </View>
          <Animatable.Text
            duration={2000}
            animation={'slideInUp'}
            style={styles.slogenText}>
            {'Powered by Gigatel'}
          </Animatable.Text>
        </View>
      </View>
    </Screen>
  );
};

export default Splash;
const styles = StyleSheet.create({
  bgImage: {
    width: '100%',
    height: '100%',
  },
  innercontainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  logoImge: {
    width: SIZE.MS(150),
    height: SIZE.MS(150),
    alignSelf: 'center',
    marginVertical: SIZE.MS(25),
  },
  appName: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(25),
    color: COLORS.PRIMARY,
    alignSelf: 'center',
    letterSpacing: 3,
  },
  slogenText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(14),
    color: COLORS.TEXT_DARK,
    alignSelf: 'center',
    marginBottom: SIZE.MS(10),
    fontWeight: 700,
  },
});
