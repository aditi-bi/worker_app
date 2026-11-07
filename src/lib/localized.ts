import type { Language } from '@/i18n'

/** Text the API returns in all three supported languages. */
export type LocalizedText = Record<Language, string>

export function pick(text: LocalizedText, language: Language): string {
  return text[language] || text.en || text.hi
}

/** Fixture helper: L(hindi, marathi, english) */
export const L = (hi: string, mr: string, en: string): LocalizedText => ({ hi, mr, en })
