import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { experienceLabel, payLabel, presetLabel } from '../format'

describe('profile format', () => {
  const t = i18n.getFixedT('en')
  it('writes experience in plain words', () => {
    expect(experienceLabel(0, t)).toBe('Less than 1 year')
    expect(experienceLabel(1, t)).toBe('1 year')
    expect(experienceLabel(6, t)).toBe('6 years')
  })
  it('labels the experience choices', () => {
    expect([0, 1, 3, 5, 10].map((y) => presetLabel(y, t))).toEqual(['Less than 1 year', '1–2', '3–5', '5–7', '10+'])
  })
  it('writes pay per day or per month', () => {
    expect(payLabel({ amount: 950, type: 'daily' }, 'en', t)).toBe('₹950 / day')
    expect(payLabel({ amount: 15000, type: 'monthly' }, 'en', t)).toBe('₹15,000 / month')
  })
})
