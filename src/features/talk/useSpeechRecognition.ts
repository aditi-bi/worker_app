import { sarvamVoiceEnabled } from '@/features/voice/config'
import { useSarvamRecognition } from '@/features/voice/useSarvamRecognition'
import { useBrowserRecognition } from './useBrowserRecognition'
import type { ListenOptions, Listener } from './listen'

export type { ListenError } from './listen'

/**
 * Listens to the worker. With VITE_VOICE_API_URL set it records and sends the audio to Sarvam; otherwise it uses the
 * phone's own recogniser. Fixed per build, so the hooks always run in the same order.
 */
export const useSpeechRecognition: (options: ListenOptions) => Listener = sarvamVoiceEnabled() ? useSarvamRecognition : useBrowserRecognition
