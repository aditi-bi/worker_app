import { describe, expect, it } from 'vitest'
import { SECTORS } from '@/mocks/fixtures/sectors'
import { formatPhone, isSkip, parseAge, parseExperience, parseName, parsePay, parsePhone, parsePlace, parseWork, parseWorkMode, parseYesNo } from '../parse'

describe('parseName', () => {
  it('drops the lead-in and capitalises', () => {
    expect(parseName('my name is santosh pawar')).toBe('Santosh Pawar')
    expect(parseName('मेरा नाम संतोष पवार')).toBe('संतोष पवार')
  })
  it('refuses numbers and long sentences', () => {
    expect(parseName('9876543210')).toBeNull()
    expect(parseName('one two three four five six')).toBeNull()
  })
})

describe('parseWork', () => {
  it('finds the work category from words workers say', () => {
    expect(parseWork('I do mason work, mostly with bricks', SECTORS)).toEqual(['construction'])
    expect(parseWork('मैं लोडिंग का काम करता हूँ', SECTORS)).toEqual(['loading'])
    expect(parseWork('mistri aur hotel kitchen', SECTORS)).toEqual(expect.arrayContaining(['construction', 'hotel']))
  })
  it('returns null when nothing matches', () => {
    expect(parseWork('hello there', SECTORS)).toBeNull()
  })
})

describe('parseExperience', () => {
  it('reads digits and spoken numbers', () => {
    expect(parseExperience('4 years')).toBe(4)
    expect(parseExperience('चार साल')).toBe(4)
    expect(parseExperience('५ वर्ष')).toBe(5)
    expect(parseExperience('seven years')).toBe(7)
  })
  it('refuses nonsense', () => {
    expect(parseExperience('a long time')).toBeNull()
    expect(parseExperience('500 years')).toBeNull()
  })
})

describe('parsePay', () => {
  it('reads amounts and the pay type', () => {
    expect(parsePay('1000 per day')).toEqual({ amount: 1000, type: 'daily' })
    expect(parsePay('15000 per month')).toEqual({ amount: 15000, type: 'monthly' })
    expect(parsePay('बारह सौ')).toEqual({ amount: 1200, type: 'daily' })
    expect(parsePay('one thousand')).toEqual({ amount: 1000, type: 'daily' })
    expect(parsePay('1,200')).toEqual({ amount: 1200, type: 'daily' })
  })
  it('refuses tiny or huge amounts', () => {
    expect(parsePay('50')).toBeNull()
    expect(parsePay('9999999')).toBeNull()
  })
})

describe('parsePhone', () => {
  it('keeps ten digits and drops prefixes', () => {
    expect(parsePhone('98765 43210')).toBe('9876543210')
    expect(parsePhone('+91 98765 43210')).toBe('9876543210')
    expect(parsePhone('९८७६५४३२१०')).toBe('9876543210')
  })
  it('refuses wrong numbers', () => {
    expect(parsePhone('12345')).toBeNull()
    expect(parsePhone('1234567890')).toBeNull()
  })
  it('formats for display', () => {
    expect(formatPhone('9876543210')).toBe('98765 43210')
  })
})

describe('extra questions', () => {
  it('reads yes and no in three languages', () => {
    expect(parseYesNo('haan ji')).toBe(true)
    expect(parseYesNo('हां')).toBe(true)
    expect(parseYesNo('होय')).toBe(true)
    expect(parseYesNo('नहीं')).toBe(false)
    expect(parseYesNo('नाही')).toBe(false)
    expect(parseYesNo('no, not now')).toBe(false)
    expect(parseYesNo('maybe')).toBeNull()
  })
  it('reads the home place', () => {
    expect(parsePlace('मैं बीड से')).toBe('बीड')
    expect(parsePlace('my village is Latur')).toBe('Latur')
    expect(parsePlace('')).toBeNull()
    expect(parsePlace('9876')).toBeNull()
  })
  it('reads age and a skip', () => {
    expect(parseAge('I am 32')).toBe(32)
    expect(parseAge('बत्तीस')).toBeNull()
    expect(parseAge('5')).toBeNull()
    expect(isSkip('नहीं बताना')).toBe(true)
    expect(isSkip('thirty')).toBe(false)
  })
  it('reads the kind of work', () => {
    expect(parseWorkMode('daily wage')).toBe('daily')
    expect(parseWorkMode('दिहाड़ी')).toBe('daily')
    expect(parseWorkMode('ठेका')).toBe('contract')
    expect(parseWorkMode('permanent job')).toBe('permanent')
    expect(parseWorkMode('pata nahi')).toBeNull()
  })
})
