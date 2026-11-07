import { describe, expect, it, vi } from 'vitest'
import { MAX_AUDIO_BYTES, speakText, transcribeAudio } from './voice-proxy'

const ok = (data: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }))
const config = (fetchImpl: typeof fetch) => ({ apiKey: 'secret-key', fetchImpl })
const audio = new Uint8Array([1, 2, 3])

describe('voice proxy: speech to text', () => {
  it('sends the audio to Sarvam with the key and returns the words', async () => {
    const fetchImpl = ok({ transcript: 'मेरा नाम रमेश है', language_code: 'hi-IN' })
    const reply = await transcribeAudio(audio, 'audio/webm;codecs=opus', 'hi-IN', config(fetchImpl as unknown as typeof fetch))
    expect(reply.status).toBe(200)
    expect(JSON.parse(reply.body as string)).toEqual({ text: 'मेरा नाम रमेश है' })
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.sarvam.ai/speech-to-text')
    expect((init.headers as Record<string, string>)['api-subscription-key']).toBe('secret-key')
    const form = init.body as FormData
    expect(form.get('language_code')).toBe('hi-IN')
    expect((form.get('file') as File).name).toBe('speech.webm')
  })

  it('refuses a language, an empty file and a file that is not audio', async () => {
    const never = vi.fn()
    const c = config(never as unknown as typeof fetch)
    expect((await transcribeAudio(audio, 'audio/webm', 'fr-FR', c)).status).toBe(400)
    expect((await transcribeAudio(new Uint8Array(), 'audio/webm', 'hi-IN', c)).status).toBe(400)
    expect((await transcribeAudio(new Uint8Array(MAX_AUDIO_BYTES + 1), 'audio/webm', 'hi-IN', c)).status).toBe(400)
    expect((await transcribeAudio(audio, 'text/html', 'hi-IN', c)).status).toBe(400)
    expect(never).not.toHaveBeenCalled()
  })

  it('does not pass Sarvam errors or the key to the app', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"error":{"message":"bad key secret-key"}}', { status: 403 }))
    const reply = await transcribeAudio(audio, 'audio/webm', 'hi-IN', config(fetchImpl as unknown as typeof fetch))
    expect(reply.status).toBe(502)
    expect(String(reply.body)).not.toContain('secret-key')
  })
})

describe('voice proxy: text to speech', () => {
  it('returns mp3 bytes decoded from Sarvam', async () => {
    const fetchImpl = ok({ audios: [btoa('MP3DATA')] })
    const reply = await speakText({ text: 'आपका नाम क्या है?', language: 'hi-IN', pace: 0.9 }, config(fetchImpl as unknown as typeof fetch))
    expect(reply.status).toBe(200)
    expect(reply.contentType).toBe('audio/mpeg')
    expect(new TextDecoder().decode(reply.body as Uint8Array)).toBe('MP3DATA')
    const sent = JSON.parse((fetchImpl.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(sent).toMatchObject({ language_code: 'hi-IN', pace: 0.9, output_audio_codec: 'mp3' })
  })

  it('keeps pace in range and refuses bad input', async () => {
    const fetchImpl = ok({ audios: [btoa('x')] })
    await speakText({ text: 'hi', language: 'en-IN', pace: 9 }, config(fetchImpl as unknown as typeof fetch))
    expect(JSON.parse((fetchImpl.mock.calls[0] as [string, RequestInit])[1].body as string).pace).toBe(2)
    const never = vi.fn()
    const c = config(never as unknown as typeof fetch)
    expect((await speakText({ text: '', language: 'hi-IN' }, c)).status).toBe(400)
    expect((await speakText({ text: 'x'.repeat(601), language: 'hi-IN' }, c)).status).toBe(400)
    expect((await speakText({ text: 'hello', language: 'xx' }, c)).status).toBe(400)
    expect((await speakText(null, c)).status).toBe(400)
    expect(never).not.toHaveBeenCalled()
  })
})
