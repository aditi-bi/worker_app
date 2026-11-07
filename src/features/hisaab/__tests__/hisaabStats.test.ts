import { describe, expect, it } from 'vitest'
import { lastSevenDays, localIsoDate, monthOf, summarise } from '../hisaabStats'

const e = (date: string, amount: number) => ({ id: date + amount, date, place: 'Site', amount })

describe('hisaab stats', () => {
  it('formats the local date, not UTC', () => {
    expect(localIsoDate(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03')
    expect(monthOf('2026-11-03')).toBe('2026-11')
  })

  it('sums the month and counts distinct days', () => {
    expect(summarise([e('2026-11-01', 1000), e('2026-11-01', 200), e('2026-11-02', 900)])).toEqual({ total: 2100, daysWorked: 2 })
    expect(summarise([])).toEqual({ total: 0, daysWorked: 0 })
  })

  it('gives seven bars ending today, with zero for days off', () => {
    const today = new Date(2026, 10, 7)
    expect(lastSevenDays([e('2026-11-07', 800), e('2026-11-05', 500), e('2026-10-20', 999)], today)).toEqual([0, 0, 0, 0, 500, 0, 800])
  })
})
