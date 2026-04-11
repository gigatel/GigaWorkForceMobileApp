
import NetInfo from '@react-native-community/netinfo';
import { COLORS, FONTS, SIZE } from '@res';
import moment from 'moment';
import { Alert, Dimensions, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import ImageCropPicker from 'react-native-image-crop-picker';
import ImageMarker, { ImageFormat, Position, TextBackgroundType } from 'react-native-image-marker';
import Toast from 'react-native-simple-toast';
import { getFormatedTime } from './times';
//* Screen *//
export const { height, width } = Dimensions.get('window');

//* Log Messages *//
const logWithColor = (colorCode: string, ...msg: any[]) => {
  if (__DEV__) {
    console.log(`\x1b[1m${colorCode} %s \x1b[0m`, ...msg);
  }
};
export const success = (...msg: any[]) => logWithColor('\x1b[32m', ...msg);
export const error = (...msg: any[]) => logWithColor('\x1b[31m', ...msg);
export const warn = (...msg: any[]) => logWithColor('\x1b[33m', ...msg);
export const log = (...msg: any[]) => logWithColor('', ...msg);
interface AlertProps {
  title?: string
  msg?: string
  onPress?: () => void
}
export const alert = (props: AlertProps) => {
  Alert.alert(
    props?.title ?? '',
    props?.msg ?? '',
    [
      {
        text: 'OK',
        onPress: props?.onPress,
      },
    ],
    { cancelable: false },

  );
};

export const yesNoAlert = (
  title: string,
  msg: string,
  onYessPress?: () => void,
  onNoPress?: () => void,
) => {
  Alert.alert(title, msg, [
    {
      text: 'YES',
      onPress: onYessPress,
    },
    {
      text: 'NO',
      onPress: onNoPress,
    },
  ]);
};
export const showToast = (
  msg: string,
  time?: 'short' | 'long',
  position?: 'top' | 'bottom',
) => {
  const t = time === 'short' ? Toast.SHORT : Toast.LONG;
  const p = position === 'top' ? Toast.TOP : Toast.BOTTOM;
  Toast.showWithGravity(msg, t, p);
};
export const checkEmpty = (value: any, defValue: any = '') => {
  return value === '' ? defValue : value;
};
export const getCreatedOnDate = () => {
  const markdate = getFormatedDate('YYYY-MM-DD');
  const markTime = getFormatedTime('HH:mm:ss');
  return `${markdate}T${markTime}`;
};
export const getFormatedDate = (format: string = 'DD-MM-YYYY') => {
  return moment(new Date()).format(format);
};
export const getCurrentMonth = () => {
  return new Date().getMonth() + 1;
};
export const getCurrentYear = () => {
  return new Date().getFullYear();
};
export const checkAndformatDate = (date: any, format = 'DD MMM YYYY') => {
  return date ? moment(date).format(format) : '';
};
export const formatDate = (date: any, format = 'DD MMM YYYY') => {
  return moment(date).format(format);
};
export const dateFormatFromTo = (
  date?: string,
  from = 'DD-MM-YYYY hh:mm A',
  to = 'DD/MMM/YYYY',
) => {
  return moment(date, from).format(to);
};
export const dateFormatFromApi = (
  date?: string,
  from = 'DD-MM-YYYY hh:mm A',
  to = 'DD/MMM/YYYY',
) => {
  return moment(date, from).format(to);
};
export const timeFormatFromApi = (
  date: string = '',
  format = 'hh:mm A',
) => {
  if (date) {
    return moment(date, 'DD-MM-YYYY hh:mm A').format(format);
  } else {
    return '';
  }
};

export const formatTodayDate = (format?: 'DD MMM YYYY' | string) => {
  return moment(new Date()).format(format);
};


export const getOneYearAfterDate = (format = 'MM/DD/YYYY') => {
  const today = moment();
  const oneYearFromToday = today.clone().add(1, 'years');
  return oneYearFromToday.format(format);
};

export const formatTime24To12 = (
  time: string,
  fromFormat = 'HH:mm',
  toFormat = 'hh:mm A',
) => {
  return moment(time, fromFormat).format(toFormat);
};
export const formatTime12To24 = (
  time: string,
  fromFormat = 'hh:mm A',
  toFormat = 'HH:mm',
) => {
  return time === '' ? '' : moment(time, fromFormat).format(toFormat);
};
export const formatTime = (time: Date, format = 'HH:mm') => {
  return moment(time).format(format);
};
export const getCurrentTime = (format = 'HH:mm') => {
  return moment(new Date()).format(format);
};

export const isDateBeforeToday = (
  date: string,
  format = 'YYYY/MM/DD',
): boolean => {
  const inputDate = moment(date, format);
  const today = moment().startOf('day');

  return inputDate.isBefore(today);
};
export const getTimeDuration = (
  startTime: string,
  endTime: string,
  startFormat = 'HH:mm',
  endFormat = 'HH:mm',
) => {
  const start = moment(startTime, startFormat, true);
  const end = moment(endTime, endFormat, true);

  // Check if both moments are valid
  if (!start.isValid() || !end.isValid()) {
    warn(
      'Invalid start or end time',
      startTime,
      endTime,
      startFormat,
      endFormat,
    );
    return 0; // Or handle the error as needed
  }

  return end.diff(start, 'minutes');
};
export const isEndTimeBeforeStart = (
  startTime: string,
  endTime: string,
  startFormat = 'HH:mm',
  endFormat = 'HH:mm',
) => {
  const start = moment(startTime, startFormat, true);
  const end = moment(endTime, endFormat, true);

  // Check if both moments are valid
  if (!start.isValid() || !end.isValid()) {
    warn(
      'Invalid start or end time',
      startTime,
      endTime,
      startFormat,
      endFormat,
    );
    return false; // Or handle the error as needed
  }

  return end.isSameOrBefore(start);
};

///
export const getShortName = (name: string | '') => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
};

export const getRandomString = (length = 6) => {
  let result = '';
  const characters = '1234569870'; //'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};
export const getRandomNumber = (min = 1, max = 6) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Device Informations
export const getDeviceName = async () => {
  return await DeviceInfo.getDeviceName();
};
export const getDeviceIP = async () => {
  return DeviceInfo.getIpAddress().then((ip) => {
    return ip;
  });
};
export const getAppVersion = () => {
  return DeviceInfo.getVersion();
};
// Net Information
export const getNetConnection = async () => {
  return NetInfo.fetch().then((state) => {
    return state.isConnected;
  });
};
export const netIP = async () => {
  return NetInfo.fetch().then((state) => {
    return state?.details;
  });
};

export const getFileName = (name: string) => {
  const parts = name.split('.');
  parts.pop();
  return parts.join('.');
};

export const getFileExtenstion = (name: string) => {
  return name.split('.').pop();
};

//* Validation Check *//
export const isValidPassword = (password: string) => {
  const passwordRegex =
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,}$/;
  return passwordRegex.test(password);
};
export const isAlphaNumaricDash = (text: string) => {
  return text.replace(/[^a-zA-Z0-9 -]/g, '');
};
export const isNumeric = (text: string) => {
  return text.replace(/[^0-9]/g, '');
};
export const isAlphaNumeric = (text: string) => {
  return text.replace(/[^a-zA-Z0-9 ]/g, '');
};
export const isAlphaNumericMultiLine = (text: string) => {
  return text.replace(/[^a-zA-Z0-9 \n]/g, '');
};
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
export const isValidAddrss = (text: string) => {
  return text.replace(/[^a-zA-Z0-9 ()\n,./-]+$/g, '');
};
export const isValidMobile = (mobile: string) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

export function maskMobileNumber(phone: string, visibleDigits: number = 2): string {
  // Remove non-digit characters (optional, if you want to support formats like (123) 456-7890)
  const digits = phone.replace(/\D/g, '');

  if (digits.length <= visibleDigits) { return '*'.repeat(digits.length); }

  const maskedSection = '*****';//.repeat(digits.length - visibleDigits);
  const visibleSection = digits.slice(-visibleDigits);
  return maskedSection + visibleSection;
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(^|\s)\w/g, char => char.toUpperCase());
}

export const isEqualIgnoreCase = (value1: string | null, value2: string | null): boolean => {
  if (!value1 || !value1) { return false; }
  return value1?.toLocaleLowerCase() === value2?.toLowerCase();
};
export const isEqual = (value1: string, value2: string): boolean => {
  return value1 === value2;
};


//! Device Settings
export const openSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};


export const openSigleImagePicker = async ({ }) => {
  try {
    return await ImageCropPicker.openPicker({ mediaType: 'photo', includeBase64: true });
  } catch (err) {
    error('Error in Single Image Picker::', err);
    return null;
  }
};
export const openSigleImageCamera = async ({ isBase64 = true }: { isBase64?: boolean }) => {
  try {
    return await ImageCropPicker.openCamera({
      mediaType: 'photo',
      includeBase64: isBase64,
      compressImageQuality: 0.7,
      useFrontCamera: false,
    });
  } catch (err) {
    error('Error in Single Image Picker::', err);
    return null;
  }
};
export const openMultipleImagePicker = async () => {
  try {
    return await ImageCropPicker.openPicker({
      multiple: true,
      mediaType: 'photo',
      includeBase64: true,
      compressImageQuality: 0.9,
      compressImageMaxWidth: 1080,
      compressImageMaxHeight: 1920,
    });
  } catch (err) {
    error('Error in Multi Image Picker::', err);
    return null;
  }
};

export const openMaps = (
  destinationLat: number,
  destinationLng: number,
) => {
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destinationLat},${destinationLng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;

  Linking.openURL(url).catch(err => console.error('Error opening maps:', err));
};


export const convertImageToBase64 = async (imagePath: string) => {
  var RNFS = require('react-native-fs');
  try {
    const base64 = await RNFS.readFile(imagePath, 'base64');
    return base64;
  } catch (err) {
    error('Error converting image to base64:', err);
    return null;
  }
};

export const convertBase64ToImage = async (base64: string) => {
  var RNFS = require('react-native-fs');
  try {
    const imagePath = `${RNFS.DocumentDirectoryPath}/temp_image.jpg`;
    await RNFS.writeFile(imagePath, base64, 'base64');
    return imagePath;
  } catch (err) {
    error('Error converting base64 to image:', err);
    return null;
  }
};


export const captureCameraImageWithWatermark = async (text: string,) => {
  try {
    return openSigleImageCamera({ isBase64: false }).then(
      async (img: any) => {
        // log('Image PIcker', img);
        if (!img) { return null; }
        const options = {
          backgroundImage: {
            src: { uri: img.path },
            scale: 1,
          },
          watermarkTexts: [
            {
              text: text,
              position: {
                position: Position.bottomLeft,
                offsetX: 10,
                offsetY: 10,
              },
              style: {
                color: COLORS.WHITE,
                fontSize: SIZE.MS(60),
                fontName: FONTS.REGULAR,
                textBackgroundStyle: {
                  // cornerRadius: {
                  //   topLeft: {
                  //     x: '10%',
                  //     y: '10%',
                  //   },
                  //   topRight: {
                  //     x: '10%',
                  //     y: '10%',
                  //   },
                  //   bottomLeft: {
                  //     x: '10%',
                  //     y: '10%',
                  //   },
                  //   bottomRight: {
                  //     x: '10%',
                  //     y: '10%',
                  //   },
                  // },
                  padding: '1%',
                  type: TextBackgroundType.none,
                  color: '#00000050',

                },
              },
            },
          ],
          scale: 1,
          quality: 40,
          filename: 'ChamberTask' + getFormatedDate(
            'DDMMMYYYYhhmmssA',
          ),
          saveFormat: ImageFormat.jpg,
        };
        const markedImageUri = await ImageMarker.markText(options);
        const base64 = await convertImageToBase64(
          markedImageUri,
        );
        // log(
        //   '✅ Watermarked image path:',
        //   `data:image/jpeg;base64,${base64}`,
        // );
        ImageCropPicker.cleanSingle(img?.path);
        return {
          path: 'file://' + markedImageUri,
          uri: 'file://' + markedImageUri,
          type: img.type,
          name: 'Chamber Task.jpg',
          size: img.size,
          data: base64,
        };

      });
  } catch (err) {
    error('❌ Error applying watermark:', err);
    return null;
  }
};