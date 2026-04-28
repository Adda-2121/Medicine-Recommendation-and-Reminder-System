import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en/translation.json';
import amTranslations from './locales/am/translation.json';

const resources = {
  en: {
    translation: enTranslations
  },
  am: {
    translation: amTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already safely escapes
    }
  });

export default i18n;
