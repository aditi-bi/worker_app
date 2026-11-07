import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSpeechCache, getSpeech, transcribe } from '../sarvamApi'
import { createSilenceDetector } from '../silence'

describe('silence detector', () => {
  const feedMany = (d: ReturnType<typeof createSilenceDetector>, level: number, count: number) => {
    let last = 'wait'
    for (let i = 0; i < count; i += 1) last = d.feed(level)
    return last
  }

  it('stops after the worker finishes talking', () => {
    const d = createSilenceDetector()
    feedMany(d, 0.005, 3) // learns the room
    expect(feedMany(d, 0.2, 10)).toBe('wait') // speaking
    expect(d.heardSpeech).toBe(true)
    expect(feedMany(d, 0.005, 12)).toBe('wait')
    expect(d.feed(0.005)).toBe('stop') // 1300 ms of quiet
  })

  it('gives up when nothing is said', () => {
    const d = createSilenceDetector()
    expect(feedMany(d, 0.005, 69)).toBe('wait')
    expect(d.feed(0.005)).toBe('no_speech')
  })

  it('ignores a steady noisy room but still hears speech above it', () => {
    const d = createSilenceDetector()
    feedMany(d, 0.08, 3) // loud background
    expect(feedMany(d, 0.09, 30)).toBe('wait') // still just background
    expect(d.heardSpeech).toBe(false)
    feedMany(d, 0.5, 5)
    expect(d.heardSpeech).toBe(true)
  })

  it('never records longer than the limit', () => {
    const d = createSilenceDetector()
    feedMany(d, 0.005, 3)
    expect(feedMany(d, 0.3, 147)).toBe('stop')
  })
})

describe('Sarvam voice client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_VOICE_API_URL', 'https://voice.example/voice/')
    clearSpeechCache()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('posts the recording with its language and reads the text back', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: 'रमेश' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const text = await transcribe(new Blob(['x'], { type: 'audio/webm' }), 'mr')
    expect(text).toBe('रमेश')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://voice.example/voice/transcribe?language=mr-IN')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('audio/webm')
  })

  it('maps failures to errors the screen understands', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })))
    await expect(transcribe(new Blob(['x'], { type: 'audio/webm' }), 'hi')).rejects.toMatchObject({ kind: 'rate_limited' })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(transcribe(new Blob(['x'], { type: 'audio/webm' }), 'hi')).rejects.toMatchObject({ kind: 'network' })
  })

  it('fetches a question once and keeps its audio, but not a failed request', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response("mp3", { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)
    await getSpeech('आपका नाम क्या है?', 'hi', 0.9)
    await getSpeech('आपका नाम क्या है?', 'hi', 0.9)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
    await expect(getSpeech('दूसरा', 'hi', 0.9)).rejects.toBeTruthy()
    const retry = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }))
    vi.stubGlobal('fetch', retry)
    await getSpeech('दूसरा', 'hi', 0.9)
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
