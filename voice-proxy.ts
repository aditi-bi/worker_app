/**
 * Local voice server for development and previews: it adds /voice/transcribe and /voice/speak to the Vite server and
 * calls Sarvam with the key from SARVAM_API_KEY (in .env.local, NOT a VITE_ name, so it never reaches the browser).
 * A live site needs the same two endpoints on a real server; see design/voice-proxy/README.md.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const LANGUAGES = new Set(['hi-IN', 'mr-IN', 'en-IN'])
const STT_URL = 'https://api.sarvam.ai/speech-to-text'
const TTS_URL = 'https://api.sarvam.ai/text-to-speech'

export const MAX_AUDIO_BYTES = 2 * 1024 * 1024
export const MAX_TEXT_CHARS = 600

export interface VoiceConfig {
  apiKey: string
  /** Optional: a Sarvam voice and model name (for example speaker "shubh", model "bulbul:v3"). */
  speaker?: string
  model?: string
  fetchImpl?: typeof fetch
}

export interface VoiceReply {
  status: number
  contentType: string
  body: Uint8Array | string
}

const json = (status: number, data: unknown): VoiceReply => ({ status, contentType: 'application/json', body: JSON.stringify(data) })

function extensionFor(contentType: string): string {
  if (contentType.includes('mp4')) return 'mp4'
  if (contentType.includes('ogg')) return 'ogg'
  return 'webm'
}

function decodeBase64(data: string): Uint8Array {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Audio in, words out. */
export async function transcribeAudio(audio: Uint8Array, contentType: string, language: string, config: VoiceConfig): Promise<VoiceReply> {
  if (!LANGUAGES.has(language)) return json(400, { error: 'invalid_language' })
  if (audio.byteLength === 0 || audio.byteLength > MAX_AUDIO_BYTES) return json(400, { error: 'invalid_audio' })
  const type = contentType.split(';')[0].trim().toLowerCase()
  if (!type.startsWith('audio/') && type !== 'video/webm') return json(400, { error: 'invalid_audio' })

  const form = new FormData()
  form.append('file', new Blob([audio as unknown as ArrayBuffer], { type }), `speech.${extensionFor(type)}`)
  form.append('language_code', language)
  const send = config.fetchImpl ?? fetch
  let response: Response
  try {
    response = await send(STT_URL, { method: 'POST', headers: { 'api-subscription-key': config.apiKey }, body: form })
  } catch {
    return json(502, { error: 'sarvam_unreachable' })
  }
  if (!response.ok) return json(response.status === 429 ? 429 : 502, { error: 'sarvam_error', status: response.status })
  const data = (await response.json().catch(() => null)) as { transcript?: unknown } | null
  if (!data || typeof data.transcript !== 'string') return json(502, { error: 'sarvam_bad_reply' })
  return json(200, { text: data.transcript })
}

/** Text in, spoken mp3 out. */
export async function speakText(body: unknown, config: VoiceConfig): Promise<VoiceReply> {
  const input = (typeof body === 'object' && body !== null ? body : {}) as { text?: unknown; language?: unknown; pace?: unknown }
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  const language = typeof input.language === 'string' ? input.language : ''
  if (!text || text.length > MAX_TEXT_CHARS) return json(400, { error: 'invalid_text' })
  if (!LANGUAGES.has(language)) return json(400, { error: 'invalid_language' })
  const pace = typeof input.pace === 'number' && Number.isFinite(input.pace) ? Math.min(2, Math.max(0.5, input.pace)) : 1

  const payload: Record<string, unknown> = { text, language_code: language, pace, output_audio_codec: 'mp3', speech_sample_rate: 22050 }
  if (config.model) payload.model = config.model
  if (config.speaker) payload.speaker = config.speaker
  const send = config.fetchImpl ?? fetch
  let response: Response
  try {
    response = await send(TTS_URL, {
      method: 'POST',
      headers: { 'api-subscription-key': config.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return json(502, { error: 'sarvam_unreachable' })
  }
  if (!response.ok) return json(response.status === 429 ? 429 : 502, { error: 'sarvam_error', status: response.status })
  const data = (await response.json().catch(() => null)) as { audios?: unknown } | null
  const first = Array.isArray(data?.audios) ? data.audios[0] : undefined
  if (typeof first !== 'string' || first === '') return json(502, { error: 'sarvam_bad_reply' })
  return { status: 200, contentType: 'audio/mpeg', body: decodeBase64(first) }
}

function readBody(req: IncomingMessage, limit: number): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > limit) {
        resolve(null)
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))))
    req.on('error', () => resolve(null))
  })
}

function send(res: ServerResponse, reply: VoiceReply): void {
  res.statusCode = reply.status
  res.setHeader('Content-Type', reply.contentType)
  res.setHeader('Cache-Control', 'no-store')
  res.end(typeof reply.body === 'string' ? reply.body : Buffer.from(reply.body))
}

export function voiceProxy(env: Record<string, string>): Plugin {
  const config: VoiceConfig = { apiKey: env.SARVAM_API_KEY ?? '', speaker: env.SARVAM_TTS_SPEAKER || undefined, model: env.SARVAM_TTS_MODEL || undefined }

  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname !== '/transcribe' && url.pathname !== '/speak') return next()
    if (req.method !== 'POST') return send(res, json(405, { error: 'method_not_allowed' }))
    if (!config.apiKey) return send(res, json(503, { error: 'SARVAM_API_KEY is not set' }))
    const body = await readBody(req, MAX_AUDIO_BYTES)
    if (!body) return send(res, json(413, { error: 'too_large' }))
    if (url.pathname === '/transcribe') {
      return send(res, await transcribeAudio(body, String(req.headers['content-type'] ?? ''), url.searchParams.get('language') ?? '', config))
    }
    let parsed: unknown = null
    try {
      parsed = JSON.parse(new TextDecoder().decode(body))
    } catch {
      /* not JSON: speakText answers 400 */
    }
    return send(res, await speakText(parsed, config))
  }

  return {
    name: 'phala-voice-proxy',
    configureServer(server) {
      if (!config.apiKey) server.config.logger.warn('[voice] SARVAM_API_KEY is not set: /voice answers 503 until you add it to .env.local')
      server.middlewares.use('/voice', middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/voice', middleware)
    },
  }
}
