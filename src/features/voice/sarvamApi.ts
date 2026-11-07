import { ApiError, type ApiErrorKind } from '@/api/errors'
import type { Language } from '@/i18n'
import { getVoiceApiUrl } from './config'

export const SARVAM_LANGUAGE: Record<Language, string> = { hi: 'hi-IN', mr: 'mr-IN', en: 'en-IN' }

/** The backend's /voice routes need the same bearer token as /worker-profile. Local dev servers ignore the header. */
const authHeader = (): Record<string, string> => {
  const token = (import.meta.env.VITE_PROFILE_API_TOKEN ?? '').trim()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function kindFor(status: number): ApiErrorKind {
  return status === 429 ? 'rate_limited' : status === 401 ? 'unauthorized' : status >= 500 ? 'server' : 'unknown'
}

/** Turns a recording into text. The audio is sent as it is (webm, ogg or mp4); the server passes it to Sarvam. */
export async function transcribe(audio: Blob, language: Language, signal?: AbortSignal): Promise<string> {
  let response: Response
  try {
    response = await fetch(`${getVoiceApiUrl()}/transcribe?language=${SARVAM_LANGUAGE[language]}`, {
      method: 'POST',
      headers: { 'Content-Type': audio.type || 'application/octet-stream', ...authHeader() },
      body: audio,
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('network')
  }
  if (!response.ok) throw new ApiError(kindFor(response.status), { status: response.status })
  const json = (await response.json().catch(() => null)) as { text?: unknown } | null
  if (!json || typeof json.text !== 'string') throw new ApiError('invalid_response', { status: response.status })
  return json.text
}

/** Turns a sentence into spoken audio (mp3). */
export async function synthesize(text: string, language: Language, pace: number, signal?: AbortSignal): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(`${getVoiceApiUrl()}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ text, language: SARVAM_LANGUAGE[language], pace }),
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('network')
  }
  if (!response.ok) throw new ApiError(kindFor(response.status), { status: response.status })
  const blob = await response.blob()
  if (blob.size === 0) throw new ApiError('invalid_response', { status: response.status })
  return blob
}

/** The same question is asked again and again, so its audio is kept for the session. */
const cache = new Map<string, Promise<Blob>>()
const CACHE_LIMIT = 60

export function getSpeech(text: string, language: Language, pace: number): Promise<Blob> {
  const key = `${language}|${pace}|${text}`
  const hit = cache.get(key)
  if (hit) return hit
  const request = synthesize(text, language, pace)
  request.catch(() => cache.delete(key)) // a failed request is not kept
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(key, request)
  return request
}

export function clearSpeechCache(): void {
  cache.clear()
}
