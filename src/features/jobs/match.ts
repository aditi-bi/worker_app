import type { Wage } from '@/api/types'
import type { ExpectedPay } from '@/api/workerTypes'

const WORK_DAYS_PER_MONTH = 26

const monthly = (amount: number, type: 'daily' | 'monthly') => (type === 'daily' ? amount * WORK_DAYS_PER_MONTH : amount)

/**
 * How much the top of the job's pay is above what the worker said they expect, in the job's own unit
 * (per day or per month). Returns null when it is not above - we never show a negative or invent a promise.
 * The employer still decides the final pay.
 */
export function aboveMinimum(wage: Wage, expected: ExpectedPay): number | null {
  const jobMonthly = monthly(wage.max, wage.type)
  const wantMonthly = monthly(expected.amount, expected.type)
  if (jobMonthly <= wantMonthly) return null
  const diffMonthly = jobMonthly - wantMonthly
  return Math.round(wage.type === 'daily' ? diffMonthly / WORK_DAYS_PER_MONTH : diffMonthly)
}

/** "Desai Construction" -> "DC" */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? '')
  return letters.join('').toUpperCase()
}
