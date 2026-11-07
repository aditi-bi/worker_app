import type { HisaabEntry } from '@/api/workerTypes'

/** YYYY-MM-DD in the phone's local time (not UTC), so "today" is the worker's today. */
export function localIsoDate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const monthOf = (isoDate: string): string => isoDate.slice(0, 7)

export interface MonthSummary {
  total: number
  /** Distinct days with at least one entry. */
  daysWorked: number
}

export function summarise(entries: HisaabEntry[]): MonthSummary {
  return { total: entries.reduce((sum, e) => sum + e.amount, 0), daysWorked: new Set(entries.map((e) => e.date)).size }
}

/** Amounts for the last 7 days ending today, oldest first. Days without work are 0. */
export function lastSevenDays(entries: HisaabEntry[], today = new Date()): number[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const iso = localIsoDate(d)
    return entries.filter((e) => e.date === iso).reduce((sum, e) => sum + e.amount, 0)
  })
}
