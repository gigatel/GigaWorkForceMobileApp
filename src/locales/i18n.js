import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import {hindi} from './hi';
import {english} from './en';

// Define available languages
const resources = {
  en: {translation: english},
  hi: {translation: hindi},
};

i18next.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export default i18next;
