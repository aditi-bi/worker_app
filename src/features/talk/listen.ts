import type { Language } from '@/i18n'

export type ListenError = 'denied' | 'no_speech' | 'failed'

export interface ListenOptions {
  language: Language
  /** Called once with the final sentence. */
  onResult: (text: string) => void
  onError: (error: ListenError) => void
}

/** What every listening implementation (phone recogniser or Sarvam) gives the screen. */
export interface Listener {
  supported: boolean
  listening: boolean
  /** true while the recording is being turned into text (Sarvam only). */
  thinking: boolean
  /** Words heard so far (phone recogniser only). */
  interim: string
  start: () => void
  stop: () => void
}
