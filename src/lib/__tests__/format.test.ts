import { describe, expect, it } from 'vitest'
import { formatPosted, formatWage, formatWageParts } from '../format'
import { distanceKm } from '../geo'
import type { TFunction } from 'i18next'

const t = ((key: string) => (key === 'job.perDay' ? 'per day' : 'per month')) as unknown as TFunction

describe('formatWage', () => {
  it('formats a range with Indian digit grouping', () => {
    expect(formatWage({ min: 14000, max: 16000, type: 'monthly' }, 'en', t)).toBe('₹14,000–₹16,000 per month')
  })
  it('collapses an equal min and max to a single amount', () => {
    expect(formatWageParts({ min: 900, max: 900, type: 'daily' }, 'en', t)).toEqual({ amount: '₹900', unit: 'per day' })
  })
})

describe('formatPosted', () => {
  const now = Date.parse('2026-11-03T12:00:00Z')
  it('describes hours and days relative to now', () => {
    expect(formatPosted('2026-11-03T10:00:00Z', 'en', now)).toBe('2 hours ago')
    expect(formatPosted('2026-11-02T12:00:00Z', 'en', now)).toBe('yesterday')
  })
  it('never says "in 0 minutes" for a job posted just now', () => {
    expect(formatPosted('2026-11-03T12:00:00Z', 'en', now)).toMatch(/ago/)
  })
})

describe('distanceKm', () => {
  it('is about 120 km between Mumbai and Pune', () => {
    const km = distanceKm({ lat: 19.076, lng: 72.8777 }, { lat: 18.5204, lng: 73.8567 })
    expect(km).toBeGreaterThan(110)
    expect(km).toBeLessThan(130)
  })
})
