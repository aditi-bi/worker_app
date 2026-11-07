import { describe, expect, it } from 'vitest'
import { aboveMinimum, initials } from '../match'

describe('aboveMinimum', () => {
  it('is the gap between the top of the job pay and the worker minimum', () => {
    expect(aboveMinimum({ min: 1100, max: 1300, type: 'daily' }, { amount: 950, type: 'daily' })).toBe(350)
  })
  it('compares across daily and monthly pay', () => {
    expect(aboveMinimum({ min: 800, max: 1000, type: 'daily' }, { amount: 26000, type: 'monthly' })).toBeNull()
    expect(aboveMinimum({ min: 20000, max: 26000, type: 'monthly' }, { amount: 500, type: 'daily' })).toBe(13000)
  })
  it('never returns a negative or zero gap', () => {
    expect(aboveMinimum({ min: 800, max: 900, type: 'daily' }, { amount: 900, type: 'daily' })).toBeNull()
    expect(aboveMinimum({ min: 800, max: 900, type: 'daily' }, { amount: 1200, type: 'daily' })).toBeNull()
  })
})

describe('initials', () => {
  it('uses the first letters of the first two words', () => {
    expect(initials('Desai Construction')).toBe('DC')
    expect(initials('  patil  ')).toBe('P')
  })
})
