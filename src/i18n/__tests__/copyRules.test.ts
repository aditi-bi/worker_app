import { describe, expect, it } from 'vitest'
import en from '../locales/en.json'
import hi from '../locales/hi.json'
import mr from '../locales/mr.json'

const flat = (o: object): string[] => Object.values(o).flatMap((v) => (typeof v === 'object' && v ? flat(v) : [String(v)]))

describe('copy rules', () => {
  it.each([
    ['en', en],
    ['hi', hi],
    ['mr', mr],
  ])('%s has no alerts, ratings or pay guarantees', (_name, locale) => {
    const text = flat(locale).join('\n')
    expect(text).not.toMatch(/alert|notification|rating|review|guarantee|सूचना|अलर्ट|रेटिंग|गारंटी|हमी/i)
  })
})
