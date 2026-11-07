import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import mr from './locales/mr.json'
import { readStorage, STORAGE_KEYS } from '@/lib/storage'

export type Language = 'hi' | 'mr' | 'en'
export const LANGUAGES: readonly Language[] = ['hi', 'mr', 'en'] as const

export function isLanguage(value: unknown): value is Language {
  return value === 'hi' || value === 'mr' || value === 'en'
}

/** Language the worker chose before, or null when they have not chosen yet. */
export function getStoredLanguage(): Language | null {
  const stored = readStorage<string | null>(STORAGE_KEYS.language, null)
  return isLanguage(stored) ? stored : null
}

void i18n.use(initReactI18next).init({
  resources: { hi: { translation: hi }, mr: { translation: mr }, en: { translation: en } },
  lng: getStoredLanguage() ?? 'hi',
  fallbackLng: 'en',
  supportedLngs: LANGUAGES as unknown as string[],
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
})

export default i18n
