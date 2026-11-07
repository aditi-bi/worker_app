import { afterEach, describe, expect, it, vi } from 'vitest'

describe('profile base address', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('sends only profile calls to the real backend when VITE_PROFILE_API_URL is set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/api/v1')
    vi.stubEnv('VITE_PROFILE_API_URL', 'https://backend.example/')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, found: false })))
    vi.stubGlobal('fetch', fetchMock)
    const { workerApi } = await import('../workerEndpoints')
    const { profileIsReal } = await import('../client')
    expect(profileIsReal()).toBe(true)
    await workerApi.checkProfile('9876543210')
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe('https://backend.example/worker-profile?phone_number=9876543210')
  })

  it('uses the normal base when it is not set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/api/v1')
    vi.stubEnv('VITE_PROFILE_API_URL', '')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, found: false })))
    vi.stubGlobal('fetch', fetchMock)
    const { workerApi } = await import('../workerEndpoints')
    const { profileIsReal } = await import('../client')
    expect(profileIsReal()).toBe(false)
    await workerApi.checkProfile('9876543210')
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe('/api/v1/worker-profile?phone_number=9876543210')
  })
})
