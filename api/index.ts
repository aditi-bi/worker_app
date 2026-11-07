/**
 * The live app's server side on Vercel: one Vercel Function (vercel.json sends every /api/* address to it) that answers them.
 *  - /api/profile/*          -> the existing backend (PROFILE_API_TARGET) with its bearer token added here, so the browser never
 *                               sees the token and the backend needs no CORS setup. Only the /worker-profile routes are reachable.
 *  - /api/jobs-api/api/jobs/ -> the job list server (JOBS_API_TARGET). Only the list is reachable, GET only.
 *  - /api/voice/transcribe and /api/voice/speak -> Sarvam directly with SARVAM_API_KEY (same rules as voice-proxy.ts).
 *  - /api/health             -> { status: "ok" }
 * Settings are Vercel environment variables (Project Settings -> Environment Variables); see server/README.md.
 * This file stands alone on purpose: a Vercel Function is bundled by itself, so it imports nothing from the app.
 */

const LANGUAGES = new Set(['hi-IN', 'mr-IN', 'en-IN'])
const STT_URL = 'https://api.sarvam.ai/speech-to-text'
const TTS_URL = 'https://api.sarvam.ai/text-to-speech'
const MAX_AUDIO_BYTES = 2 * 1024 * 1024
const MAX_TEXT_CHARS = 600
const MAX_PROFILE_BODY = 256 * 1024

const json = (status: number, data: unknown, cache = 'no-store'): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': cache } })

const setting = (name: string): string => (process.env[name] ?? '').trim()
const target = (name: string): string => setting(name).replace(/\/$/, '')

/** Forward /api/profile/<rest> to the backend. Only the profile routes are reachable. */
async function profile(request: Request, rest: string, search: string): Promise<Response> {
  const base = target('PROFILE_API_TARGET')
  if (!base) return json(503, { error: 'PROFILE_API_TARGET is not set' })
  if (rest !== '/worker-profile' && !rest.startsWith('/worker-profile/')) return json(404, { error: 'not_found' })
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const body = hasBody ? new Uint8Array(await request.arrayBuffer()) : undefined
  if (body && body.byteLength > MAX_PROFILE_BODY) return json(413, { error: 'too_large' })
  const headers: Record<string, string> = { Accept: 'application/json' }
  const type = request.headers.get('content-type')
  if (type) headers['Content-Type'] = type
  const token = setting('PROFILE_API_TOKEN')
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const up = await fetch(base + rest + search, { method: request.method, headers, body: body && body.byteLength ? body : undefined })
    return new Response(await up.text(), {
      status: up.status,
      headers: { 'Content-Type': up.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch {
    return json(502, { error: 'backend_unreachable' })
  }
}

/** Forward /api/jobs-api/api/jobs/ to the job list server. The answer may be kept for a minute by Vercel's cache. */
async function jobs(request: Request, rest: string): Promise<Response> {
  if (request.method !== 'GET') return json(405, { error: 'method_not_allowed' })
  const base = target('JOBS_API_TARGET')
  if (!base) return json(503, { error: 'JOBS_API_TARGET is not set' })
  if (rest !== '/api/jobs/' && rest !== '/api/jobs') return json(404, { error: 'not_found' })
  const token = setting('JOBS_API_TOKEN')
  try {
    const up = await fetch(`${base}/api/jobs/`, { headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    return new Response(await up.text(), {
      status: up.status,
      headers: {
        'Content-Type': up.headers.get('content-type') ?? 'application/json',
        'Cache-Control': up.ok ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store',
      },
    })
  } catch {
    return json(502, { error: 'jobs_unreachable' })
  }
}

function extensionFor(contentType: string): string {
  if (contentType.includes('mp4')) return 'mp4'
  if (contentType.includes('ogg')) return 'ogg'
  return 'webm'
}

/** Audio in, words out. */
async function transcribe(request: Request, language: string, apiKey: string): Promise<Response> {
  if (!LANGUAGES.has(language)) return json(400, { error: 'invalid_language' })
  const audio = new Uint8Array(await request.arrayBuffer())
  if (audio.byteLength === 0 || audio.byteLength > MAX_AUDIO_BYTES) return json(400, { error: 'invalid_audio' })
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (!type.startsWith('audio/') && type !== 'video/webm') return json(400, { error: 'invalid_audio' })
  const form = new FormData()
  form.append('file', new Blob([audio as unknown as ArrayBuffer], { type }), `speech.${extensionFor(type)}`)
  form.append('language_code', language)
  let response: Response
  try {
    response = await fetch(STT_URL, { method: 'POST', headers: { 'api-subscription-key': apiKey }, body: form })
  } catch {
    return json(502, { error: 'sarvam_unreachable' })
  }
  if (!response.ok) return json(response.status === 429 ? 429 : 502, { error: 'sarvam_error', status: response.status })
  const data = (await response.json().catch(() => null)) as { transcript?: unknown } | null
  if (!data || typeof data.transcript !== 'string') return json(502, { error: 'sarvam_bad_reply' })
  return json(200, { text: data.transcript })
}

/** Text in, spoken mp3 out. */
async function speak(request: Request, apiKey: string): Promise<Response> {
  const raw = await request.text()
  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    /* answered with 400 below */
  }
  const input = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as { text?: unknown; language?: unknown; pace?: unknown }
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  const language = typeof input.language === 'string' ? input.language : ''
  if (!text || text.length > MAX_TEXT_CHARS) return json(400, { error: 'invalid_text' })
  if (!LANGUAGES.has(language)) return json(400, { error: 'invalid_language' })
  const pace = typeof input.pace === 'number' && Number.isFinite(input.pace) ? Math.min(2, Math.max(0.5, input.pace)) : 1
  const payload: Record<string, unknown> = { text, language_code: language, pace, output_audio_codec: 'mp3', speech_sample_rate: 22050 }
  if (setting('SARVAM_TTS_MODEL')) payload.model = setting('SARVAM_TTS_MODEL')
  if (setting('SARVAM_TTS_SPEAKER')) payload.speaker = setting('SARVAM_TTS_SPEAKER')
  let response: Response
  try {
    response = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'api-subscription-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return json(502, { error: 'sarvam_unreachable' })
  }
  if (!response.ok) return json(response.status === 429 ? 429 : 502, { error: 'sarvam_error', status: response.status })
  const data = (await response.json().catch(() => null)) as { audios?: unknown } | null
  const first = Array.isArray(data?.audios) ? data.audios[0] : undefined
  if (typeof first !== 'string' || first === '') return json(502, { error: 'sarvam_bad_reply' })
  const binary = atob(first)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Response(bytes, { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
}

async function voice(request: Request, url: URL): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  const apiKey = setting('SARVAM_API_KEY')
  if (!apiKey) return json(503, { error: 'SARVAM_API_KEY is not set' })
  if (url.pathname === '/api/voice/transcribe') return transcribe(request, url.searchParams.get('language') ?? '', apiKey)
  return speak(request, apiKey)
}

async function route(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const { pathname } = url
  if (pathname === '/api/health') return json(200, { status: 'ok' })
  if (pathname.startsWith('/api/profile/')) return profile(request, pathname.slice('/api/profile'.length), url.search)
  if (pathname.startsWith('/api/jobs-api/')) return jobs(request, pathname.slice('/api/jobs-api'.length))
  if (pathname === '/api/voice/transcribe' || pathname === '/api/voice/speak') return voice(request, url)
  return json(404, { error: 'not_found' })
}

async function handle(request: Request): Promise<Response> {
  try {
    return await route(request)
  } catch {
    return json(500, { error: 'server_error' })
  }
}

export const GET = handle
export const HEAD = handle
export const POST = handle
export const PATCH = handle
