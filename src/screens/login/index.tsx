import {Buttons, InputField} from '@atoms';
import {Screen} from '@organisms';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import {getOtpApi} from '@slices/login.slice';
import {ScreenProps} from '@types';
import {Common, Location} from '@utils';
import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Keyboard, Platform, StyleSheet, Text, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import OTPVerify from 'react-native-otp-verify';
import {connect, useDispatch} from 'react-redux';
/*******  e8beb33a-369d-43da-aa92-7f8862744bd1  *******/
const Login: React.FC<ScreenProps.Login> = ({loading}) => {
  const {t} = useTranslation();
  const [mobileNumber, setMobileNumber] = useState('');
  const dispatch = useDispatch<StoreDispatch>();
  useEffect(() => {
    const init = async () => {
      await Location.checkPermission();
    };
    init();
    return () => {};
  }, []);

  const getPwdKey = async () => {
    let hashKey = [''];
    if (Platform.OS === 'android') {
      hashKey = await OTPVerify.getHash();

      Common.log('Android Hash Key::', hashKey);
    }
    dispatch(getOtpApi({mobileNumber, hashKey: hashKey[0]}));
    // fetch key & navigate, but do not trigger server to send SMS yet
  };

  const checkValidation = () => {
    console.log('data');

    Keyboard.dismiss();
    if (mobileNumber.trim() === '') {
      console.log('data2');
      Common.showToast(t('validation.empty_mobile'));
    } else if (!Common.isValidMobile(mobileNumber)) {
      console.log('data3');
      Common.showToast(t('validation.invalid_mobile'));
    } else {
      console.log('data3');
      getPwdKey();
    }
  };

  return (
    <Screen
      preset={'scroll'}
      loading={loading}
      statusBgColor={COLORS.BACKGROUND_DEFAULT}
      statusBarStyle={'dark'}>
      <View style={styles.container}>
        {/* {!__DEV__ && (
          <> */}
        <Animatable.Image
          animation={'zoomIn'}
          source={IMAGES.appLogo}
          style={styles.logoImge}
          resizeMode={'contain'}
        />
        <Text style={styles.appNameText}>{t('app_name_long')}</Text>
        {/* </> */}
        {/* )} */}
        <View style={styles.inputContainer}>
          <Text style={styles.loginText}>{t('login')}</Text>
          <Text style={styles.descText}>{t('mobile_code_desc')}</Text>
          <InputField
            title={t('title.mobile_no')}
            type={'loginMobile'}
            value={mobileNumber}
            placeholder={t('placeholder.enter_mobile')}
            maxLength={10}
            isRequired
            keyboardType={'number-pad'}
            onChangeText={setMobileNumber}
            textContentType={'oneTimeCode'}
            inputStyle={{height: SIZE.MVS(45)}}
            onEndEditing={() => Keyboard.dismiss()}
          />
        </View>
        <View style={styles.spacer} />
        <Buttons
          type={'primary'}
          title={t('login')}
          viewStyle={styles.loginButton}
          onPress={checkValidation}
        />
      </View>
    </Screen>
  );
};
const MapStateToProps = (state: RootState) => ({
  loading: state.login.loading === 'pending' ? true : false,
});
export default connect(MapStateToProps)(Login);

const styles = StyleSheet.create({
  inputContainer: {
    marginHorizontal: SIZE.MS(15),
    // flex: 1,
  },
  spacer: {flex: 1},
  loginButton: {
    marginHorizontal: SIZE.MS(20),
    marginVertical: SIZE.MS(25),
  },
  descText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(14),
    color: COLORS.TEXT_DARK,
    alignSelf: 'center',
    marginTop: SIZE.MS(20),
    marginHorizontal: SIZE.MS(15),
    marginBottom: SIZE.MS(30),
  },
  loginText: {
    marginTop: SIZE.MS(30),
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(18),
    color: COLORS.PRIMARY,
    marginHorizontal: SIZE.MS(15),
  },
  appNameText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(25),
    color: COLORS.PRIMARY,
    alignSelf: 'center',
    marginVertical: SIZE.MS(10),
  },
  logoImge: {
    width: SIZE.MS(150),
    height: SIZE.MS(150),
    alignSelf: 'center',
    marginVertical: SIZE.MS(25),
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  scroll: {
    flex: 1,
  },
});
