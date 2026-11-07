import { useCallback, useEffect, useRef, useState } from 'react'
import type { Language } from '@/i18n'

const BCP47: Record<Language, string> = { hi: 'hi-IN', mr: 'mr-IN', en: 'en-IN' }

function pickVoice(language: Language): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const exact = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === BCP47[language].toLowerCase())
  if (exact) return exact
  // Marathi voices are rare on Android; Hindi reads Devanagari acceptably (same fallback as the prototype).
  const base = language === 'mr' ? 'hi' : language
  return voices.find((v) => v.lang.toLowerCase().startsWith(base))
}

export interface SpeakOptions {
  /** Words per second feel: 0.9 is calm, 1.2 is quick. */
  rate?: number
  /** Called once when the voice finishes (or cannot speak), never after stop() or a newer speak(). */
  onEnd?: () => void
}

/** Browser voices need no preparation; same call shape as the Sarvam speaker. */
const noPreload: (text: string, rate?: number) => void = () => {}

/** Read-aloud using the phone's built-in voices. No audio files, works offline when the voice is installed. */
export function useBrowserSpeak(language: Language) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const token = useRef(0)
  const safety = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const stop = useCallback(() => {
    token.current += 1
    clearTimeout(safety.current)
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const mine = ++token.current
      clearTimeout(safety.current)
      const finish = () => {
        if (token.current !== mine) return
        clearTimeout(safety.current)
        setSpeaking(false)
        options.onEnd?.()
      }
      if (!supported) return finish()
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'mr' && !pickVoice('mr') ? BCP47.hi : BCP47[language]
      const voice = pickVoice(language)
      if (voice) utterance.voice = voice
      utterance.rate = options.rate ?? 0.9
      utterance.onend = finish
      utterance.onerror = finish
      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
      // Some phones never fire "end"; do not leave the conversation hanging.
      safety.current = setTimeout(finish, 3000 + text.length * 120)
    },
    [language, supported],
  )

  useEffect(
    () => () => {
      token.current += 1
      clearTimeout(safety.current)
      if (supported) window.speechSynthesis.cancel()
    },
    [supported],
  )

  return { supported, speaking, speak, stop, preload: noPreload }
}
