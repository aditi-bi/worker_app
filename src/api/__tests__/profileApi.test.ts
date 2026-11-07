import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toBackendFields, toDailyPay, toWorker } from '../profileContract'
import { workerApi } from '../workerEndpoints'
import { setContact } from '@/features/applications/localStore'
import { clearToken, setToken } from '@/features/auth/tokenStore'

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const ID = '6f1c1c0e-0000-4000-8000-000000000001'

describe('profile contract mapping', () => {
  it('turns a monthly pay into the daily wage the backend stores', () => {
    expect(toDailyPay({ amount: 15600, type: 'monthly' })).toBe(600)
    expect(toDailyPay({ amount: 700, type: 'daily' })).toBe(700)
  })

  it('sends only the fields that changed, with the backend names', () => {
    expect(toBackendFields({ experienceYears: 4, homePlace: 'Nashik', livesOnSite: true })).toEqual({ experience: 4, home_place: 'Nashik', lives_on_site: true })
    expect(toBackendFields({ age: null })).toEqual({ age: null })
  })

  it('keeps a monthly pay as monthly and a daily pay clears it', () => {
    expect(toBackendFields({ expectedPay: { amount: 15600, type: 'monthly' } })).toEqual({ expected_pay: 600, monthly_pay: 15600 })
    expect(toBackendFields({ expectedPay: { amount: 700, type: 'daily' } })).toEqual({ expected_pay: 700, monthly_pay: null })
  })

  it('sends the app language and shows a stored monthly pay as monthly', () => {
    expect(toBackendFields({ language: 'mr' })).toEqual({ language: 'mr' })
    const worker = toWorker({
      id: ID, name: 'A', phone_number: '9876543210', type: 'worker', skills: [], sectors: [], age: null, experience: 1, expected_pay: 600,
      home_place: null, willing_to_relocate: null, work_mode: null, lives_on_site: null, monthly_pay: 15600, language: 'hi',
    })
    expect(worker.expectedPay).toEqual({ amount: 15600, type: 'monthly' })
  })

  it('reads a sparse backend profile with safe defaults', () => {
    const worker = toWorker({
      id: ID, name: null, phone_number: '9876543210', type: 'worker', skills: ['driving'], sectors: ['farm', 'welding'],
      age: 0, experience: null, expected_pay: 500, home_place: null, willing_to_relocate: null, work_mode: 'group', lives_on_site: null,
    })
    expect(worker.sectors).toEqual(['farm']) // welding is not one of the six
    expect(worker.age).toBeNull()
    expect(worker.workMode).toBe('daily')
    expect(worker.expectedPay).toEqual({ amount: 500, type: 'daily' })
    expect(worker.phoneMasked).toBe('+91 98•••••210')
  })
})

describe('profile calls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearToken()
  })
  afterEach(() => vi.unstubAllGlobals())

  const body = {
    name: 'Asha', sectors: ['farm' as const], experienceYears: 4, expectedPay: { amount: 15600, type: 'monthly' as const }, phone: '9876543210',
    homePlace: 'Nashik', willingToRelocate: false, age: null, workMode: 'daily' as const, livesOnSite: true, consent: true as const, language: 'hi' as const,
  }

  it('registers, then fills the profile with one PATCH', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ success: true, id: ID }, 201)).mockResolvedValueOnce(reply({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(workerApi.register(body)).resolves.toEqual({ token: ID })
    const [registerUrl, registerInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(registerUrl).toMatch(/\/worker-profile\/register$/)
    expect(JSON.parse(registerInit.body as string)).toEqual({ phone_number: '9876543210', type: 'worker' })
    const patch = JSON.parse((fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string) as Record<string, unknown>
    expect(patch).toMatchObject({ id: ID, name: 'Asha', expected_pay: 600, monthly_pay: 15600, language: 'hi', experience: 4, lives_on_site: true, age: null })
    expect(patch).not.toHaveProperty('phone')
    expect(patch).not.toHaveProperty('consent')
  })

  it('uses the existing profile when the number is already registered (409)', async () => {
    const found = { success: true, found: true, id: ID, name: 'Old', phone_number: '9876543210', type: 'worker', skills: [], sectors: [], age: null, experience: null, expected_pay: null, home_place: null, willing_to_relocate: null, work_mode: null, lives_on_site: null }
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ success: false }, 409)).mockResolvedValueOnce(reply(found)).mockResolvedValueOnce(reply({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(workerApi.register(body)).resolves.toEqual({ token: ID })
    expect((fetchMock.mock.calls[1] as [string])[0]).toContain('phone_number=9876543210')
    expect(JSON.parse((fetchMock.mock.calls[2] as [string, RequestInit])[1].body as string)).toMatchObject({ id: ID })
  })

  it('reads the profile by the number kept on the phone', async () => {
    setContact({ name: 'Asha', phone: '9876543210' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ success: true, found: false })))
    await expect(workerApi.getMe()).rejects.toMatchObject({ kind: 'not_found' })
  })

  it('updates by id and reads the profile back; a phone-only change sends nothing', async () => {
    setContact({ name: 'Asha', phone: '9876543210' })
    setToken(ID)
    const found = { success: true, found: true, id: ID, name: 'Asha', phone_number: '9876543210', type: 'worker', skills: [], sectors: ['farm'], age: 30, experience: 5, expected_pay: 600, home_place: 'Nashik', willing_to_relocate: true, work_mode: 'daily', lives_on_site: false }
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ success: true })).mockResolvedValueOnce(reply(found))
    vi.stubGlobal('fetch', fetchMock)
    const worker = await workerApi.updateMe({ experienceYears: 5 })
    expect(worker.experienceYears).toBe(5)
    expect(JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)).toEqual({ id: ID, experience: 5 })
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].method).toBe('PATCH')
  })
})
