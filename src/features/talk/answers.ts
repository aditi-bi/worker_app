import type { TFunction } from 'i18next'
import type { Sector, SectorId } from '@/api/types'
import type { ExpectedPay, WorkMode } from '@/api/workerTypes'
import type { Language } from '@/i18n'
import { experienceLabel, payLabel } from '@/features/profile/format'
import { isSkip, parseAge, parseExperience, parseName, parsePay, parsePlace, parseWork, parseWorkMode, parseYesNo, workNames } from './parse'

/** The questions Phala asks, in order. The mobile number is last and is handled on its own. */
export const STEPS = ['name', 'work', 'experience', 'pay', 'home', 'relocate', 'age', 'workMode', 'stay', 'mobile'] as const
export type StepId = (typeof STEPS)[number]
export type AnswerStep = Exclude<StepId, 'mobile'>

export interface Draft {
  name?: string
  work?: SectorId[]
  experience?: number
  pay?: ExpectedPay
  home?: string
  relocate?: boolean
  /** null = the worker chose not to say. */
  age?: number | null
  workMode?: WorkMode
  stay?: boolean
}

export type Answer =
  | { step: 'name'; value: string }
  | { step: 'work'; value: SectorId[] }
  | { step: 'experience'; value: number }
  | { step: 'pay'; value: ExpectedPay }
  | { step: 'home'; value: string }
  | { step: 'relocate'; value: boolean }
  | { step: 'age'; value: number | null }
  | { step: 'workMode'; value: WorkMode }
  | { step: 'stay'; value: boolean }

export interface Ctx {
  sectors: Sector[]
  language: Language
  t: TFunction
}

/** What the worker said, as an answer for this question. null = not sure, ask again. */
export function interpret(step: AnswerStep, text: string, ctx: Pick<Ctx, 'sectors'>): Answer | null {
  switch (step) {
    case 'name': {
      const value = parseName(text)
      return value ? { step, value } : null
    }
    case 'work': {
      const value = parseWork(text, ctx.sectors)
      return value ? { step, value } : null
    }
    case 'experience': {
      const value = parseExperience(text)
      return value !== null ? { step, value } : null
    }
    case 'pay': {
      const value = parsePay(text)
      return value ? { step, value } : null
    }
    case 'home': {
      const value = parsePlace(text)
      return value ? { step, value } : null
    }
    case 'relocate':
    case 'stay': {
      const value = parseYesNo(text)
      return value === null ? null : { step, value }
    }
    case 'age': {
      if (isSkip(text)) return { step, value: null }
      const value = parseAge(text)
      return value !== null ? { step, value } : null
    }
    case 'workMode': {
      const value = parseWorkMode(text)
      return value ? { step, value } : null
    }
  }
}

/** Short text shown (and read back) for an answer. */
export function describe(answer: Answer, { sectors, language, t }: Ctx): string {
  switch (answer.step) {
    case 'name':
    case 'home':
      return answer.value
    case 'work':
      return workNames(answer.value, sectors, language)
    case 'experience':
      return experienceLabel(answer.value, t)
    case 'pay':
      return payLabel(answer.value, language, t)
    case 'relocate':
    case 'stay':
      return t(answer.value ? 'tap.yes' : 'tap.no')
    case 'age':
      return answer.value === null ? t('talk.ageSkipped') : t('profile.ageYears', { count: answer.value })
    case 'workMode':
      return t(`profile.mode_${answer.value}`)
  }
}

export function applyAnswer(draft: Draft, answer: Answer): Draft {
  return { ...draft, [answer.step]: answer.value }
}
