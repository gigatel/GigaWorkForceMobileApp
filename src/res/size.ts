
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const [shortDimension, longDimension] = width < height ? [width, height] : [height, width];

let guidelineBaseWidth = 375;
let guidelineBaseHeight = 768;

export const scale = (size: number) => (shortDimension / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (longDimension / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
export const moderateVerticalScale = (size: number, factor = 0.5) =>
  size + (verticalScale(size) - size) * factor;

export const MS = moderateScale;
export const MVS = moderateVerticalScale;
// ✅ NEW: percentage helpers (viewport-based)
export const VH = (percent: number) => (height * percent) / 100; // % of screen height
export const VW = (percent: number) => (width * percent) / 100;  // % of screen width

// (optional) expose raw dims if you need
export const SCREEN_HEIGHT = height;
export const SCREEN_WIDTH = width;