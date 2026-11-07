import type { TFunction } from 'i18next'
import type { Language } from '@/i18n'
import type { Wage } from '@/api/types'

const LOCALES: Record<Language, string> = { hi: 'hi-IN', mr: 'mr-IN', en: 'en-IN' }

export function formatNumber(value: number, language: Language): string {
  try {
    return new Intl.NumberFormat(LOCALES[language]).format(value)
  } catch {
    return String(value)
  }
}

/** Amount and unit separately, e.g. { amount: "₹900–₹1,100", unit: "per day" }. */
export function formatWageParts(wage: Wage, language: Language, t: TFunction): { amount: string; unit: string } {
  const min = `₹${formatNumber(wage.min, language)}`
  const amount = wage.max > wage.min ? `${min}–₹${formatNumber(wage.max, language)}` : min
  return { amount, unit: t(wage.type === 'daily' ? 'job.perDay' : 'job.perMonth') }
}

/** "₹900–₹1,100 per day" as one string (used for read-aloud). */
export function formatWage(wage: Wage, language: Language, t: TFunction): string {
  const { amount, unit } = formatWageParts(wage, language, t)
  return `${amount} ${unit}`
}

/** "2 hours ago" / "yesterday" in the worker's language. */
export function formatPosted(iso: string, language: Language, now = Date.now()): string {
  const diffSec = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(diffSec)
  let value: number
  let unit: Intl.RelativeTimeFormatUnit
  if (abs < 3600) {
    value = Math.round(diffSec / 60)
    unit = 'minute'
  } else if (abs < 86400) {
    value = Math.round(diffSec / 3600)
    unit = 'hour'
  } else {
    value = Math.round(diffSec / 86400)
    unit = 'day'
  }
  if (unit === 'minute' && value === 0) value = -1
  try {
    return new Intl.RelativeTimeFormat(LOCALES[language], { numeric: 'auto' }).format(value, unit)
  } catch {
    return `${Math.abs(value)} ${unit}`
  }
}
