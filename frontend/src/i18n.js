import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import uzTranslation from './locales/uz/translation.json';
import ruTranslation from './locales/ru/translation.json';

const resources = {
  uz: { translation: uzTranslation },
  ru: { translation: ruTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'uz', // default language
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
