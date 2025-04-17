
import { enTranslations } from './en';
import { frTranslations } from './fr';

export type Language = 'en' | 'fr';

export const translations = {
  en: enTranslations,
  fr: frTranslations
};

export type TranslationKey = keyof typeof enTranslations;
