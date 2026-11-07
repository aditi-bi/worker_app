import { useCallback, useEffect, useRef, useState } from 'react'
import { useBrowserSpeak, type SpeakOptions } from '@/hooks/useBrowserSpeak'
import type { Language } from '@/i18n'
import { getSpeech } from './sarvamApi'

const clampPace = (rate: number): number => Math.min(2, Math.max(0.5, rate))

/**
 * Reads text aloud with Sarvam's voice. If the voice server cannot be reached the phone's own voice reads it instead,
 * so the conversation never stops. Same shape as the phone voice.
 */
export function useSarvamSpeak(language: Language) {
  const fallback = useBrowserSpeak(language)
  const [speaking, setSpeaking] = useState(false)
  const token = useRef(0)
  const audio = useRef<HTMLAudioElement | null>(null)
  const url = useRef<string | null>(null)
  const safety = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const release = useCallback(() => {
    clearTimeout(safety.current)
    if (audio.current) {
      audio.current.onended = null
      audio.current.onerror = null
      audio.current.pause()
      audio.current = null
    }
    if (url.current) {
      URL.revokeObjectURL(url.current)
      url.current = null
    }
  }, [])

  const stop = useCallback(() => {
    token.current += 1
    release()
    fallback.stop()
    setSpeaking(false)
  }, [release, fallback])

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const mine = ++token.current
      release()
      fallback.stop()
      const rate = options.rate ?? 0.9
      const finish = () => {
        if (token.current !== mine) return
        release()
        setSpeaking(false)
        options.onEnd?.()
      }
      const useFallback = () => {
        if (token.current !== mine) return
        release()
        fallback.speak(text, { rate, onEnd: finish })
      }
      setSpeaking(true)
      safety.current = setTimeout(finish, 20000 + text.length * 120)
      getSpeech(text, language, clampPace(rate))
        .then((blob) => {
          if (token.current !== mine) return
          const objectUrl = URL.createObjectURL(blob)
          url.current = objectUrl
          const player = new Audio(objectUrl)
          audio.current = player
          player.onended = finish
          player.onerror = useFallback
          player.play().catch(useFallback) // for example when the browser blocks sound before a tap
        })
        .catch(useFallback)
    },
    [language, release, fallback],
  )

  /** Fetches the audio of a sentence now so it plays without a pause later. */
  const preload = useCallback(
    (text: string, rate = 0.9) => {
      void getSpeech(text, language, clampPace(rate)).catch(() => undefined)
    },
    [language],
  )

  useEffect(
    () => () => {
      token.current += 1
      release()
    },
    [release],
  )

  return { supported: true, speaking: speaking || fallback.speaking, speak, stop, preload }
}
