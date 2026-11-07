import type { TFunction } from 'i18next'
import type { Language } from '@/i18n'
import type { Sector } from '@/api/types'
import type { ExpectedPay, Worker } from '@/api/workerTypes'
import { formatNumber } from '@/lib/format'
import { pick } from '@/lib/localized'

/** Choices offered for "how long have you worked": years, lower bound of each range. */
export const EXPERIENCE_PRESETS = [0, 1, 3, 5, 10] as const

export function experienceLabel(years: number, t: TFunction): string {
  return years < 1 ? t('common.lessThanYear') : t('common.yearsLabel', { count: years })
}

export function presetLabel(years: number, t: TFunction): string {
  if (years === 0) return t('common.lessThanYear')
  if (years === 10) return `${years}+`
  const next = years === 1 ? 2 : years === 3 ? 5 : years + 2
  return `${years}–${next}`
}

export function payLabel(pay: ExpectedPay, language: Language, t: TFunction): string {
  const amount = `₹${formatNumber(pay.amount, language)}`
  return t(pay.type === 'daily' ? 'common.perDayShort' : 'common.perMonthShort', { amount })
}

/** Trades the call collected (Mason, Helper) or, when none, the work categories picked by hand. */
export function workLabel(worker: Pick<Worker, 'skills' | 'sectors'>, sectors: Sector[], language: Language): string {
  if (worker.skills.length > 0) return worker.skills.map((s) => pick(s, language)).join(', ')
  return worker.sectors
    .map((id) => sectors.find((s) => s.id === id))
    .filter((s): s is Sector => !!s)
    .map((s) => pick(s.name, language))
    .join(', ')
}
