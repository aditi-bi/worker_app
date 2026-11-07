import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'

/**
 * The app's real profile calls against the mock server, which answers with the backend's /worker-profile contract.
 * It checks the whole path: register, fill, read back, ask for a call, wait, and the answers landing on the profile.
 */
vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
vi.stubEnv('VITE_USE_MOCKS', 'true')

const { workerHandlers } = await import('@/mocks/workerHandlers')
const { workerApi } = await import('../workerEndpoints')
const { setContact } = await import('@/features/applications/localStore')
const { setToken } = await import('@/features/auth/tokenStore')
const { getDb, resetDb } = await import('@/mocks/db')

const server = setupServer(...workerHandlers)
beforeAll(() => server.listen())
afterAll(() => server.close())
beforeEach(() => {
  window.localStorage.clear()
  resetDb()
})
afterEach(() => vi.useRealTimers())

const form = {
  name: 'Asha', sectors: ['farm' as const], experienceYears: 4, expectedPay: { amount: 15600, type: 'monthly' as const }, phone: '9876543210',
  homePlace: 'Nashik', willingToRelocate: false, age: null, workMode: 'daily' as const, livesOnSite: true, consent: true as const, language: 'hi' as const,
}

describe('fill the profile in the app', () => {
  it('registers, saves every answer and reads the same profile back', async () => {
    const { token } = await workerApi.register(form)
    setContact({ name: 'Asha', phone: form.phone })
    setToken(token)
    const worker = await workerApi.getMe()
    expect(worker).toMatchObject({ id: token, name: 'Asha', sectors: ['farm'], experienceYears: 4, homePlace: 'Nashik', livesOnSite: true, workMode: 'daily' })
    expect(worker.expectedPay).toEqual({ amount: 15600, type: 'monthly' })
    const edited = await workerApi.updateMe({ experienceYears: 5 })
    expect(edited.experienceYears).toBe(5)
  })

  it('registering a number that already has a profile updates that profile', async () => {
    const first = await workerApi.register(form)
    const second = await workerApi.register({ ...form, name: 'Asha K' })
    expect(second.token).toBe(first.token)
  })
})

describe('receive a call', () => {
  it('has no details until the call ends, then the answers appear on the profile', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const placed = await workerApi.requestCall('9876543210')
    expect(placed.alreadyCalling).toBe(false)
    expect(await workerApi.checkProfile('9876543210')).toMatchObject({ id: placed.profileId, filled: false })

    vi.setSystemTime(Date.now() + 15_000) // the mock call has ended
    const after = await workerApi.checkProfile('9876543210')
    expect(after).toMatchObject({ id: placed.profileId, filled: true })
    expect(after?.worker).toMatchObject({ name: 'Ramesh', sectors: ['construction'] })
  })

  it('a second request inside the cooldown finds the call already started', async () => {
    const first = await workerApi.requestCall('9876543210')
    const again = await workerApi.requestCall('9876543210')
    expect(again).toEqual({ profileId: first.profileId, alreadyCalling: true })
  })

  it('an unknown number has no profile', async () => {
    expect(await workerApi.checkProfile('9123456780')).toBeNull()
    expect(getDb().worker).toBeNull()
  })
})
