import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import React from 'react';
import {Animated, Easing, Image, StyleSheet, Text, View} from 'react-native';

interface LoaderProps {
  message?: string;
}
const Loader: React.FC<LoaderProps> = ({message}) => {
  const spinValue = new Animated.Value(0);
  Animated.loop(
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ).start();
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.modal}>
      <View style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.sppinnerView}>
            <Animated.Image
              source={IMAGES.loader}
              style={[styles.logo, {transform: [{rotate: spin}]}]}
              resizeMode="contain"
            />
            <Image
              source={IMAGES.appLogo}
              style={styles.applogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.loadingText}>{'Please Wait...'}</Text>
          {message && <Text style={styles.messageText}>{message}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: COLORS.BLACK_RGBA_65,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {},
  inner: {
    backgroundColor: COLORS.WHITE,
    padding: SIZE.MS(40),
    borderRadius: SIZE.MS(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sppinnerView: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZE.MS(30),
  },
  applogo: {
    width: SIZE.MS(45),
    height: SIZE.MS(45),
    position: 'absolute',
  },
  logo: {
    width: SIZE.MS(150),
    height: SIZE.MS(150),
  },
  messageText: {
    fontSize: SIZE.MS(14),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_MEDIUM,
    textAlign: 'center',
    marginTop: SIZE.MS(10),
    paddingHorizontal: SIZE.MS(20),
    lineHeight: SIZE.MS(20),
  },
  loadingText: {
    fontSize: SIZE.MS(16),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
    marginTop: SIZE.MS(10),
  },
});

export default Loader;
