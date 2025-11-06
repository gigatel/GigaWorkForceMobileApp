import {BackHeader} from '@molecules';
import {Screen} from '@organisms';
import {useFocusEffect} from '@react-navigation/native';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import {getOtpApi, verifyOtpApi} from '@slices/login.slice';
import {ScreenProps} from '@types';
import {Common} from '@utils';
import React, {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AppState,
  PermissionsAndroid,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {OtpInput, OtpInputRef} from 'react-native-otp-entry';
import {connect, useDispatch} from 'react-redux';
// 🔔 FCM
import messaging from '@react-native-firebase/messaging';
type OtpVerifyModule = {
  getHash?: () => Promise<string[]>;
  startOtpListener?: (cb: (message: string) => void) => void;
  getOtp?: () => Promise<void>;
  removeListener?: () => void;
} | null;

// 👉 Enable Android SMS auto-read
const ENABLE_AUTO_SMS = true;

const OtpVerification: FC<ScreenProps.OtpVerification> = ({
  navigation,
  route,
  loading,
}) => {
  const {t} = useTranslation();
  const params = route?.params ?? ({} as any);
  const userId: string = params.userId ?? '';
  const password: string = params.password ?? '';
  const appType: string = params.appType ?? '';

  const isProgrammaticSetRef = useRef(false);
  const [fetchingOtp] = useState(false);
  const [otpCode, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timerCount, setTimerCount] = useState(0);

  const dispatch = useDispatch<StoreDispatch>();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRef = useRef<OtpInputRef | null>(null);
  const verifyingRef = useRef(false);
  const cleanupOtpListenerRef = useRef<(() => void) | null>(null);
  const appHashRef = useRef<string>('');
  const requestedInitialOtpRef = useRef(false);
  const lastSubmittedCodeRef = useRef<string | null>(null);
  const lastSubmittedAtRef = useRef<number>(0);
  const SUBMIT_DEDUP_MS = 3000;

  // avoid starting listener twice
  const smsPipelineStartedRef = useRef(false);

  // 🔔 FCM token holder
  const fcmTokenRef = useRef<string | null>(null);

  // ---------- FCM: request permission (Android 13+) ----------
  const requestNotifPermissionAndroid = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 33) return true;
    const res = await PermissionsAndroid.request(
      'android.permission.POST_NOTIFICATIONS' as any,
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  // ---------- FCM: get token (fast) ----------
  const getFcmToken = useCallback(async (): Promise<string | null> => {
    try {
      const tok = await messaging().getToken();
      if (tok) {
        fcmTokenRef.current = tok;
        if (__DEV__) console.log('[FCM] token', tok);
      }
      return tok ?? null;
    } catch (e) {
      if (__DEV__) console.log('[FCM] getToken error', e);
      return null;
    }
  }, []);

  // ---------- FCM: init on mount; keep token fresh ----------
  useEffect(() => {
    (async () => {
      await requestNotifPermissionAndroid();
      await getFcmToken();

      // subscribe for token refresh
      const unsub = messaging().onTokenRefresh(tok => {
        fcmTokenRef.current = tok;
        if (__DEV__) console.log('[FCM] token refresh', tok);
      });
      return () => unsub();
    })();
  }, [getFcmToken, requestNotifPermissionAndroid]);

  useFocusEffect(
    useCallback(() => {
      startCountdown();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, []),
  );

  const verifyOtp = useCallback(
    async (code: string) => {
      if (verifyingRef.current) return;
      if (!code || code.length < 6) {
        Common.showToast(
          code ? t('validation.invalid_otp') : t('validation.wait_for_otp'),
        );
        return;
      }
      verifyingRef.current = true;
      try {
        const deviceType =
          Platform.OS + '-' + (DeviceInfo.getDeviceId?.() ?? 'device');

        // Ensure we have a token right before submit (instant fetch if missing)
        if (!fcmTokenRef.current) {
          await requestNotifPermissionAndroid();
          await getFcmToken();
        }

        await dispatch(
          verifyOtpApi({
            userId,
            password,
            appType,
            otp: code, // raw; thunk will encrypt
            deviceToken: fcmTokenRef.current || 'unknown',
            deviceType,
          }),
        ).unwrap();

        // ✅ Navigate on success
        navigation.replace('BottomTab');
      } catch (e: any) {
        if (__DEV__) console.log('verifyOtp error =>', e?.message ?? e);
      } finally {
        verifyingRef.current = false;
      }
    },
    [
      appType,
      dispatch,
      navigation,
      password,
      t,
      userId,
      getFcmToken,
      requestNotifPermissionAndroid,
    ],
  );

  const submitOnce = useCallback(
    async (code: string, source: string) => {
      const now = Date.now();
      if (!code || code.length < 6) return;
      if (verifyingRef.current) return;

      if (
        lastSubmittedCodeRef.current === code &&
        now - lastSubmittedAtRef.current < SUBMIT_DEDUP_MS
      ) {
        if (__DEV__)
          console.log(`[OTP] duplicate submit ignored from ${source}`);
        return;
      }

      lastSubmittedCodeRef.current = code;
      lastSubmittedAtRef.current = now;

      await verifyOtp(code);
    },
    [verifyOtp],
  );

  // 👉 helper to programmatically set input and submit
  const fillAndSubmit = useCallback(
    (code: string, source: string) => {
      try {
        const anyRef = otpRef.current as any;
        anyRef?.setValue?.(code);
      } catch {}
      setOtp(code);
      submitOnce(code, source);
    },
    [submitOnce],
  );

  const extractOTP = (message: string) => {
    const m = message.match(/(^|[^0-9])([0-9]{6})(?![0-9])/);
    return m ? m[2] : null;
  };

  const acceptIOSAutoFillOnly = useCallback(
    (txt: string) => {
      if (isProgrammaticSetRef.current) {
        isProgrammaticSetRef.current = false;
        return;
      }
      const onlyDigits = (txt || '').replace(/\D/g, '').slice(0, 6);
      if (onlyDigits.length === 6) {
        isProgrammaticSetRef.current = true;
        const anyRef = otpRef.current as any;
        anyRef?.setValue?.(onlyDigits);
        setOtp(onlyDigits);
        submitOnce(onlyDigits, 'ios_autofill');
      }
    },
    [submitOnce],
  );

  const startAndroidOtpPipelines = useCallback(async () => {
    if (!ENABLE_AUTO_SMS || Platform.OS !== 'android') return;

    // prevent duplicate starts
    if (smsPipelineStartedRef.current) return;

    let OtpVerify: OtpVerifyModule = null;
    try {
      OtpVerify = require('react-native-otp-verify');
    } catch {
      OtpVerify = null;
    }
    if (!OtpVerify) return;

    try {
      // getHash may be empty on first call on some devices; do a quick retry
      try {
        const hashes = (await OtpVerify.getHash?.()) ?? [];
        if (hashes.length) {
          appHashRef.current = hashes[0];
        } else {
          await new Promise(r => setTimeout(r, 300));
          const second = (await OtpVerify.getHash?.()) ?? [];
          if (second.length) appHashRef.current = second[0];
        }
      } catch (err) {
        if (__DEV__) console.log('[OTP] getHash err', err);
      }

      if (__DEV__) console.log('[OTP] app hash =>', appHashRef.current);
    } catch {}

    try {
      OtpVerify.startOtpListener?.((msg: string) => {
        const code = extractOTP(msg) ?? '';
        if (!code) return;
        fillAndSubmit(code, 'android_sms_listener');
      });
      cleanupOtpListenerRef.current = () => {
        try {
          OtpVerify?.removeListener?.();
        } catch {}
        smsPipelineStartedRef.current = false;
      };
      smsPipelineStartedRef.current = true;
    } catch {}

    try {
      // Triggers hint picker flow on supported devices
      await OtpVerify.getOtp?.();
    } catch {}
  }, [fillAndSubmit]);

  // Kick pipelines when app becomes active (Android)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') startAndroidOtpPipelines();
    });
    return () => sub.remove();
  }, [startAndroidOtpPipelines]);

  // Initial start on mount (Android)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let mounted = true;
    (async () => {
      await startAndroidOtpPipelines();
      if (!requestedInitialOtpRef.current) {
        for (let i = 0; i < 4 && mounted && !appHashRef.current; i++) {
          await new Promise<void>(resolve => setTimeout(resolve, 400));
        }
        requestedInitialOtpRef.current = true;
      }
    })();
    return () => {
      mounted = false;
      try {
        cleanupOtpListenerRef.current?.();
      } catch {}
      cleanupOtpListenerRef.current = null;
    };
  }, [startAndroidOtpPipelines, dispatch, userId]);

  const startCountdown = () => {
    setTimerCount(90);
    setResendDisabled(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    intervalRef.current = setInterval(() => {
      setTimerCount(prev => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOtp = () => {
    lastSubmittedCodeRef.current = null;
    lastSubmittedAtRef.current = 0;
    startCountdown();
    // send the current appHash to backend so it appends to SMS body
    dispatch(getOtpApi({mobileNumber: userId, hashKey: appHashRef.current}));
    try {
      (otpRef.current as any)?.clear?.();
    } catch {}
    setOtp('');
  };

  return (
    <Screen preset="scroll" loading={loading} statusBgColor={COLORS.PRIMARY}>
      <BackHeader onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image
          source={IMAGES.otpVerifcation}
          style={styles.logoImge}
          resizeMode="contain"
        />
        <Text style={styles.otptext}>{t('otp')}</Text>
        <Text style={styles.otptextVer}>{t('verification')}</Text>

        <Text style={styles.descText}>
          {t('otp_sent_mobile') + Common.maskMobileNumber(userId) + '.'}
          <Text
            style={styles.changeText}
            onPress={() => navigation.replace('Login')}>
            {' Change'}
          </Text>
        </Text>

        <View style={styles.inputContainer}>
          <OtpInput
            ref={otpRef}
            numberOfDigits={6}
            focusColor={COLORS.PRIMARY}
            autoFocus
            hideStick
            placeholder="••••••"
            blurOnFilled
            type="numeric"
            secureTextEntry={true}
            focusStickBlinkingDuration={0}
            onTextChange={txt => {
              // iOS: handle autofill; Android: listener handles auto-fill
              if (Platform.OS !== 'android') {
                acceptIOSAutoFillOnly(String(txt));
              }
            }}
            onFilled={code => {
              submitOnce(String(code), 'onFilled');
            }}
            textInputProps={{
              accessibilityLabel: 'One-Time Password',
              autoComplete:
                Platform.OS === 'android' ? 'sms-otp' : 'one-time-code',
              keyboardType: 'number-pad',
              textContentType: 'oneTimeCode',
              editable: true,
              showSoftInputOnFocus: Platform.OS === 'ios',
              caretHidden: Platform.OS === 'android',
              returnKeyType: 'done',
              blurOnSubmit: false,
            }}
            theme={{
              containerStyle: styles.container,
              pinCodeTextStyle: styles.pinCodeText,
              placeholderTextStyle: styles.placeholderText,
              filledPinCodeContainerStyle: styles.filledPinCodeContainer,
            }}
          />
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.didnotText}>{t('did_not_get_code')}</Text>
          <Text
            style={[styles.resendText, resendDisabled && {opacity: 0.5}]}
            onPress={!resendDisabled ? resendOtp : undefined}>
            {resendDisabled ? t('resend_after') : t('resend_code')}{' '}
            {timerCount > 0 && (
              <Text style={styles.timerText}>{timerCount}</Text>
            )}
            {resendDisabled ? ' sec' : ''}
          </Text>
        </View>

        {ENABLE_AUTO_SMS && fetchingOtp && Platform.OS === 'android' && (
          <View>
            <ActivityIndicator size="large" color={COLORS.PRIMARY_DARK} />
            <Text style={styles.waitingText}>
              {'Waiting for OTP to Auto fill'}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const MapStateToProps = (state: RootState) => ({
  loading: state.login.loading === 'pending',
});
export default connect(MapStateToProps)(OtpVerification);

// ---------------- STYLES (unchanged) ----------------
const styles = StyleSheet.create({
  keyboardCode: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(12),
    color: COLORS.ERROR,
    marginHorizontal: SIZE.MS(15),
    textAlign: 'center',
  },
  waitingText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(15),
    color: COLORS.PRIMARY_DARK,
    marginLeft: SIZE.MS(15),
  },
  otpLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledPinCodeContainer: {borderColor: COLORS.BORDER_DEFAULT},
  timerText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(15),
    color: COLORS.ERROR,
  },
  pinCodeText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(30),
    color: COLORS.TEXT_DARK,
  },
  placeholderText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(30),
    color: COLORS.TEXT_PLACEHOLDER,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SIZE.MS(30),
    gap: SIZE.MS(6),
  },
  didnotText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(15),
    color: COLORS.TEXT_DARK,
  },
  resendText: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(15),
    color: COLORS.PRIMARY,
  },
  inputContainer: {
    height: SIZE.MVS(60),
    borderRadius: SIZE.MS(6),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: SIZE.MS(25),
    marginTop: SIZE.MS(20),
    alignItems: 'center',
  },
  spacer: {flex: 1},
  descText: {
    marginHorizontal: SIZE.MS(25),
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(14),
    color: COLORS.TEXT_DARK,
    alignSelf: 'center',
    marginTop: SIZE.MS(30),
    marginVertical: SIZE.MS(20),
  },
  changeText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(14),
    color: COLORS.PRIMARY,
  },
  otptext: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(25),
    color: COLORS.PRIMARY,
    alignSelf: 'center',
    marginVertical: SIZE.MS(10),
  },
  otptextVer: {
    fontFamily: FONTS.BOLD,
    fontSize: SIZE.MVS(25),
    color: COLORS.PRIMARY_DARK,
    alignSelf: 'center',
  },
  logoImge: {
    width: SIZE.MS(120),
    height: SIZE.MS(120),
    alignSelf: 'center',
    marginVertical: SIZE.MS(25),
  },
  container: {flex: 1, backgroundColor: COLORS.BACKGROUND_DEFAULT},
  scroll: {flex: 1},
});
