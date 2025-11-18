import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    resources: {
      en: {
        translation: enTranslations
      }
      // Add more languages here as you create them:
      // ja: { translation: jaTranslations },
      // es: { translation: esTranslations },
      // fr: { translation: frTranslations },
    },
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],
      // Keys to lookup language from
      lookupLocalStorage: 'preferredLanguage',
      // Cache user language
      caches: ['localStorage'],
    }
  });

export default i18n;
