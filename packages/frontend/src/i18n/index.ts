import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';

const savedLang = localStorage.getItem('govlink_lang') || 'en';
if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLang;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already handles xss
  },
  missingKeyHandler: (ng, _ns, key) => {
    if (import.meta.env.DEV) {
      console.warn(`[i18n missing key] lang="${ng}" key="${key}"`);
    }
  },
});

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  localStorage.setItem('govlink_lang', lng);
});

export default i18n;
