import { useCallback, useEffect, useRef, useState } from 'react'
import type { Language } from '@/i18n'
import type { ListenOptions, Listener } from './listen'

/** Minimal typing for the browser speech recogniser (not in TypeScript's DOM types). */
interface RecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>
}
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

const BCP47: Record<Language, string> = { hi: 'hi-IN', mr: 'mr-IN', en: 'en-IN' }

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Listen to the worker with the phone's own speech recogniser. No audio is recorded or uploaded by the app.
 * `supported` is false on browsers without it; the screen then shows the tapped form.
 */
export function useBrowserRecognition({ language, onResult, onError }: ListenOptions): Listener {
  const ctor = getCtor()
  const supported = ctor !== null
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const ref = useRef<Recognition | null>(null)
  const handled = useRef(false)
  const latest = useRef({ onResult, onError })
  useEffect(() => {
    latest.current = { onResult, onError }
  })

  const stop = useCallback(() => {
    const current = ref.current
    ref.current = null // late events of this instance are ignored
    current?.abort()
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) return latest.current.onError('failed')
    const previous = ref.current
    ref.current = null
    previous?.abort()
    const recognition = new Ctor()
    handled.current = false
    recognition.lang = BCP47[language]
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (e) => {
      if (ref.current !== recognition) return
      const last = e.results[e.results.length - 1]
      const text = last?.[0]?.transcript ?? ''
      setInterim(text)
      if (last?.isFinal && text.trim()) {
        handled.current = true
        latest.current.onResult(text.trim())
      }
    }
    recognition.onerror = (e) => {
      if (ref.current !== recognition) return
      handled.current = true
      latest.current.onError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? 'no_speech' : 'failed')
    }
    recognition.onend = () => {
      if (ref.current !== recognition) return
      setListening(false)
      setInterim('')
      if (!handled.current) latest.current.onError('no_speech')
      ref.current = null
    }
    ref.current = recognition
    setListening(true)
    try {
      recognition.start()
    } catch {
      setListening(false)
      latest.current.onError('failed')
    }
  }, [language])

  useEffect(
    () => () => {
      const current = ref.current
      ref.current = null
      current?.abort()
    },
    [],
  )

  return { supported, listening, thinking: false, interim, start, stop }
}
