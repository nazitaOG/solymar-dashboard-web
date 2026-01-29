import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importamos los JSONs que acabamos de crear
import esDocs from '../../locales/es.json';
import enDocs from '../../locales/en.json';

i18n
  .use(LanguageDetector) // Detecta idioma del navegador
  .use(initReactI18next) // Pasa la instancia a React
  .init({
    resources: {
      es: { translation: esDocs },
      en: { translation: enDocs },
    },
    fallbackLng: 'es', // Si no detecta nada, usa Español
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
    detection: {
      order: ['localStorage', 'navigator'], // Busca en localStorage primero
      caches: ['localStorage'], // Guarda la selección del usuario aquí
    }
  });

export default i18n;