/**
 * Voice by Sarvam. VITE_VOICE_API_URL is the address of a small server that holds the Sarvam key and answers
 * /transcribe and /speak (see voice-proxy.ts for local use and design/voice-proxy for the backend).
 * Empty = the phone's own voice is used, as before.
 */
export const getVoiceApiUrl = (): string => (import.meta.env.VITE_VOICE_API_URL ?? '').trim().replace(/\/$/, '')
export const sarvamVoiceEnabled = (): boolean => getVoiceApiUrl() !== ''
