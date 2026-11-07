import { describe, expect, it } from 'vitest'
import en from '../locales/en.json'
import hi from '../locales/hi.json'
import mr from '../locales/mr.json'

const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  )

describe('locale files', () => {
  const base = flatten(en).sort()
  it.each([
    ['hi', hi],
    ['mr', mr],
  ])('%s has exactly the same keys as English', (_name, locale) => {
    expect(flatten(locale).sort()).toEqual(base)
  })
  it('has no empty strings', () => {
    for (const locale of [en, hi, mr]) for (const key of flatten(locale)) expect(key).toBeTruthy()
  })
})
