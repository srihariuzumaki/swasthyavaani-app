import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enTranslations from '../locales/en/common.json';
import hiTranslations from '../locales/hi/common.json';
import taTranslations from '../locales/ta/common.json';
import teTranslations from '../locales/te/common.json';
import bnTranslations from '../locales/bn/common.json';
import mrTranslations from '../locales/mr/common.json';
import guTranslations from '../locales/gu/common.json';
import knTranslations from '../locales/kn/common.json';

// Get language from localStorage or default to 'en'
const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('app_language');
  return savedLanguage || 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      ta: { translation: taTranslations },
      te: { translation: teTranslations },
      bn: { translation: bnTranslations },
      mr: { translation: mrTranslations },
      gu: { translation: guTranslations },
      kn: { translation: knTranslations },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

export default i18n;

