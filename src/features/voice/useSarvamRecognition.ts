import { useCallback, useEffect, useRef, useState } from 'react'
import type { ListenOptions, Listener } from '@/features/talk/listen'
import { createSilenceDetector, type Verdict } from './silence'
import { transcribe } from './sarvamApi'

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m))
}

const isDenied = (e: unknown): boolean => e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')

/**
 * Listens with the microphone, stops by itself when the worker stops talking, and gets the words from Sarvam.
 * Same shape as the phone recogniser, so the screen does not change.
 */
export function useSarvamRecognition({ language, onResult, onError }: ListenOptions): Listener {
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
  const [listening, setListening] = useState(false)
  const [thinking, setThinking] = useState(false)
  const session = useRef(0)
  const cleanup = useRef<(() => void) | null>(null)
  const latest = useRef({ onResult, onError })
  useEffect(() => {
    latest.current = { onResult, onError }
  })

  const stop = useCallback(() => {
    session.current += 1 // late answers of this recording are ignored
    cleanup.current?.()
    cleanup.current = null
    setListening(false)
    setThinking(false)
  }, [])

  const start = useCallback(() => {
    const mine = ++session.current
    cleanup.current?.()
    cleanup.current = null
    setListening(true)
    setThinking(false)

    void (async () => {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      } catch (error) {
        if (session.current !== mine) return
        setListening(false)
        return latest.current.onError(isDenied(error) ? 'denied' : 'failed')
      }
      if (session.current !== mine) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const mimeType = pickMime()
      let recorder: MediaRecorder
      let audioContext: AudioContext
      try {
        recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 24000 } : undefined)
        audioContext = new AudioContext()
      } catch {
        stream.getTracks().forEach((t) => t.stop())
        setListening(false)
        return latest.current.onError('failed')
      }
      void audioContext.resume().catch(() => undefined)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      audioContext.createMediaStreamSource(stream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      const chunks: Blob[] = []
      const abort = new AbortController()
      const detector = createSilenceDetector()
      let verdict: Verdict = 'wait'
      let released = false

      const release = () => {
        if (released) return
        released = true
        clearInterval(timer)
        stream.getTracks().forEach((t) => t.stop())
        void audioContext.close().catch(() => undefined)
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      recorder.onstop = () => {
        release()
        if (session.current !== mine) return
        setListening(false)
        if (verdict !== 'stop') return latest.current.onError('no_speech')
        setThinking(true)
        const audio = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
        transcribe(audio, language, abort.signal)
          .then((text) => {
            if (session.current !== mine) return
            setThinking(false)
            if (text.trim()) latest.current.onResult(text.trim())
            else latest.current.onError('no_speech')
          })
          .catch(() => {
            if (session.current !== mine) return
            setThinking(false)
            latest.current.onError('failed')
          })
      }

      const timer = setInterval(() => {
        analyser.getByteTimeDomainData(samples)
        let sum = 0
        for (const v of samples) {
          const x = (v - 128) / 128
          sum += x * x
        }
        const result = detector.feed(Math.sqrt(sum / samples.length))
        if (result === 'wait') return
        verdict = result
        clearInterval(timer)
        if (recorder.state !== 'inactive') recorder.stop()
      }, 100)

      cleanup.current = () => {
        abort.abort()
        recorder.onstop = null
        if (recorder.state !== 'inactive') recorder.stop()
        release()
      }
      recorder.start()
    })()
  }, [language])

  useEffect(
    () => () => {
      session.current += 1
      cleanup.current?.()
      cleanup.current = null
    },
    [],
  )

  return { supported, listening, thinking, interim: '', start, stop }
}
