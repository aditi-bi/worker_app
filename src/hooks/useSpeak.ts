import { sarvamVoiceEnabled } from '@/features/voice/config'
import { useSarvamSpeak } from '@/features/voice/useSarvamSpeak'
import type { Language } from '@/i18n'
import { useBrowserSpeak } from './useBrowserSpeak'

/**
 * Read-aloud. With VITE_VOICE_API_URL set it uses Sarvam's voice (the phone's voice is the backup);
 * otherwise only the phone's own voice. The choice is fixed per build, so the hooks always run in the same order.
 */
export const useSpeak: (language: Language) => ReturnType<typeof useBrowserSpeak> = sarvamVoiceEnabled() ? useSarvamSpeak : useBrowserSpeak
