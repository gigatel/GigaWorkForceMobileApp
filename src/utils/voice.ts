import { Platform } from 'react-native';
import Tts from 'react-native-tts';

export const setLanguage = async (lang: 'en-IN' | 'hi-IN') => {
  Tts.setDefaultLanguage(lang ?? 'hi-IN');
};
export const speak = (msg: string) => {
  if (__DEV__) {
    return;
  }
  setLanguage('hi-IN').then(() => {
    Tts.speak(msg, {
      iosVoiceId: 'com.apple.voice.compact.hi-IN.Lekha',
      rate: 0.5,
      androidParams: {
        KEY_PARAM_PAN: -1,
        KEY_PARAM_VOLUME: __DEV__ ? 0.1 : 1,
        KEY_PARAM_STREAM: 'STREAM_RING',
      },
    });
  });
};
export const stop = () => {
  if (Platform.OS === 'android') {
    Tts.stop();
  }
};

