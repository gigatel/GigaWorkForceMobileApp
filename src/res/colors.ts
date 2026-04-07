
// ==============================================================================
import { COMPANY_ID_INFOCOMM, COMPANY_ID_NETWORK, COMPANY_ID_SOLUTION, COMPANY_ID_TECHNOSOFT } from './constant';
// Primary Colors
export const PRIMARY = '#0273b9';
export const PRIMARY_MEDIUM = '#a751ed';
export const PRIMARY_LIGHT = '#D7C4E7';
export const SECONDARY = '#0b8546';
export const PRIMARY_DARK = '#0273b9';
// ==============================================================================
// Button Colors
export const BUTTON_PRIMARY = '#059CED';
export const BUTTON_DANGER = '#FF1717';
export const BUTTON_CANCEL = '#F5B0AE';
// ==============================================================================
// Background Colors
export const BACKGROUND_DEFAULT = '#F6F6F6';
export const BACKGROUND_SECONDARY = '#F3F2F8';
export const BACKGROUND_PINK = '#F2C7DD';
export const BACKGROUND_GREEN = '#C7F2CF';
export const TRANSPARENT = 'transparent';
// ==============================================================================
// Card Colors
export const CARD_DESCRIPTION = '#0089D1';
export const CARD_BORDER = '#F5DCB0';
// ==============================================================================
// Status Colors
export const SUCCESS = '#34A853';
export const WARNING = '#FFD800';
export const ERROR = '#F50D0D';
export const WAITING = '#FFE2B2';
export const DISABLED = '#BABABA';
// ==============================================================================
// Text Colors
export const TEXT_DARKER = '#222222';
export const TEXT_DARK = '#444444';
export const TEXT_MEDIUM = '#666666';
export const TEXT_LIGHT = '#AAAAAA';
export const TEXT_LIGHTER = '#CCCCCC';
export const TEXT_PLACEHOLDER = '#BBBBBB';
export const TEXT_DEVIDER = '#EEEEEE';
export const TEXT_LINK = '#0A28C1';
// ==============================================================================
// Border Colors
export const BORDER_DEFAULT = '#CFCFCF';
export const BORDER_SECONDARY = '#BABABA';
// ==============================================================================
// UI Element Colors
export const STATUS_BAR = '#4E468E';
export const LIST_HEADER = '#E7F0F5';
export const WHITE = '#FFFFFF';
export const BLACK = '#000000';
export const BLACK_RGBA_65 = 'rgba(0,0,0,0.65)';
// ==============================================================================
// Accent Colors
export const ACCENT_PINK = '#FFC3C5';
export const ACCENT_PINK_LIGHT = '#F8EDEE';
export const ACCENT_ORANGE = '#D98B0D';
export const ACCENT_GREEN_LIGHT = '#34A85338';
// ==============================================================================
// ===================COMPANY COLORS ====================================
export const INFOCOMM = '#59b980';
export const NETWORK = '#e85d38';
export const TECHNOSOFT = '#47c1ef';
export const SOLUTION = '#785aa1';

export const getCompanyColor = (id: number) => {
  return id === COMPANY_ID_NETWORK
    ? NETWORK
    : id === COMPANY_ID_SOLUTION
      ? SOLUTION
      : id === COMPANY_ID_TECHNOSOFT
        ? TECHNOSOFT
        : id === COMPANY_ID_INFOCOMM
          ? INFOCOMM
          : ACCENT_ORANGE;
};
