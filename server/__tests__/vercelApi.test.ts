// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH, POST } from '../../api/[...path].ts'

const origin = 'https://app.example'
const ok = (body: unknown, status = 200, type = 'application/json') =>
  vi.fn().mockResolvedValue(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': type } }))

beforeEach(() => {
  process.env.PROFILE_API_TARGET = 'https://backend.example/'
  process.env.PROFILE_API_TOKEN = 'secret-token'
  process.env.JOBS_API_TARGET = 'https://jobs.example'
  process.env.SARVAM_API_KEY = 'sarvam-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const k of ['PROFILE_API_TARGET', 'PROFILE_API_TOKEN', 'JOBS_API_TARGET', 'JOBS_API_TOKEN', 'SARVAM_API_KEY']) delete process.env[k]
})

describe('vercel function: health', () => {
  it('answers ok', async () => {
    const res = await GET(new Request(`${origin}/api/health`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
  it('does not know other addresses', async () => {
    expect((await GET(new Request(`${origin}/api/anything`))).status).toBe(404)
  })
})

describe('vercel function: profile', () => {
  it('forwards a lookup with the token added and the query kept', async () => {
    const fetchMock = ok({ found: false })
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(new Request(`${origin}/api/profile/worker-profile?phone_number=9632529184`))
    expect(res.status).toBe(200)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://backend.example/worker-profile?phone_number=9632529184')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret-token')
  })

  it('forwards a PATCH body and its type', async () => {
    const fetchMock = ok({ success: true })
    vi.stubGlobal('fetch', fetchMock)
    const body = JSON.stringify({ id: '2529e1e1-6f63-54f2-b382-b845946cfa7b', home_place: 'Nashik' })
    const res = await PATCH(new Request(`${origin}/api/profile/worker-profile`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body }))
    expect(res.status).toBe(200)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('PATCH')
    expect(new TextDecoder().decode(init.body as Uint8Array)).toBe(body)
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('passes the backend status and message through (for example 409)', async () => {
    vi.stubGlobal('fetch', ok({ success: false, error: 'A profile already exists' }, 409))
    const res = await POST(new Request(`${origin}/api/profile/worker-profile/register`, { method: 'POST', body: '{}' }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('already exists')
  })

  it('reaches nothing except the profile routes', async () => {
    const fetchMock = ok({})
    vi.stubGlobal('fetch', fetchMock)
    for (const path of ['/campaigns', '/dashboard-api', '/worker-profileX', '/telephony-lines']) {
      expect((await GET(new Request(`${origin}/api/profile${path}`))).status).toBe(404)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('says so when the backend address is missing or the backend is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    expect((await GET(new Request(`${origin}/api/profile/worker-profile?phone_number=1`))).status).toBe(502)
    delete process.env.PROFILE_API_TARGET
    expect((await GET(new Request(`${origin}/api/profile/worker-profile?phone_number=1`))).status).toBe(503)
  })
})

describe('vercel function: jobs', () => {
  it('forwards the list and lets Vercel keep it for a minute', async () => {
    const fetchMock = ok({ total_jobs: 1, jobs: [] })
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(new Request(`${origin}/api/jobs-api/api/jobs/`))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('s-maxage=60')
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe('https://jobs.example/api/jobs/')
  })

  it('adds the jobs token only when one is set', async () => {
    process.env.JOBS_API_TOKEN = 'jobs-secret'
    const fetchMock = ok({ jobs: [] })
    vi.stubGlobal('fetch', fetchMock)
    await GET(new Request(`${origin}/api/jobs-api/api/jobs/`))
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jobs-secret')
  })

  it('reaches only the list, and only by GET', async () => {
    const fetchMock = ok({})
    vi.stubGlobal('fetch', fetchMock)
    expect((await GET(new Request(`${origin}/api/jobs-api/api/jobs/5/`))).status).toBe(404)
    expect((await POST(new Request(`${origin}/api/jobs-api/api/jobs/`, { method: 'POST', body: '{}' }))).status).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not cache an error', async () => {
    vi.stubGlobal('fetch', ok('bad', 500, 'text/plain'))
    const res = await GET(new Request(`${origin}/api/jobs-api/api/jobs/`))
    expect(res.status).toBe(500)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})

describe('vercel function: voice', () => {
  it('sends audio to Sarvam with the key and returns the words', async () => {
    const fetchMock = ok({ transcript: 'मेरा नाम रमेश है' })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(new Request(`${origin}/api/voice/transcribe?language=hi-IN`, { method: 'POST', headers: { 'content-type': 'audio/webm;codecs=opus' }, body: new Uint8Array([1, 2, 3]) }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ text: 'मेरा नाम रमेश है' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.sarvam.ai/speech-to-text')
    expect((init.headers as Record<string, string>)['api-subscription-key']).toBe('sarvam-key')
    expect((init.body as FormData).get('language_code')).toBe('hi-IN')
  })

  it('refuses a bad language, a non-audio file and a missing key', async () => {
    const fetchMock = ok({})
    vi.stubGlobal('fetch', fetchMock)
    const audio = { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: new Uint8Array([1]) }
    expect((await POST(new Request(`${origin}/api/voice/transcribe?language=fr-FR`, audio))).status).toBe(400)
    expect((await POST(new Request(`${origin}/api/voice/transcribe?language=mr-IN`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' }))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    delete process.env.SARVAM_API_KEY
    expect((await POST(new Request(`${origin}/api/voice/transcribe?language=mr-IN`, audio))).status).toBe(503)
  })

  it('turns text into mp3 with language_code', async () => {
    const mp3 = Buffer.from([1, 2, 3]).toString('base64')
    const fetchMock = ok({ audios: [mp3] })
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(new Request(`${origin}/api/voice/speak`, { method: 'POST', body: JSON.stringify({ text: 'नमस्कार', language: 'mr-IN' }) }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual([1, 2, 3])
    const payload = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(payload.language_code).toBe('mr-IN')
  })

  it('rejects empty text and wrong methods', async () => {
    vi.stubGlobal('fetch', ok({}))
    expect((await POST(new Request(`${origin}/api/voice/speak`, { method: 'POST', body: JSON.stringify({ text: ' ', language: 'hi-IN' }) }))).status).toBe(400)
    expect((await GET(new Request(`${origin}/api/voice/speak`))).status).toBe(405)
  })
})
