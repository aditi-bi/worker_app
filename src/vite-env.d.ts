/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_PROXY_TARGET?: string
  /** Number of the existing inbound call setup. The Ask Phala button opens the dialler with it. */
  readonly VITE_PHALA_INBOUND_NUMBER?: string
  readonly VITE_SUPPORT_PHONE?: string
  /** Google Apps Script web app that receives job applications and adds them to a Google Sheet. Empty = use the /applications API. */
  readonly VITE_APPLY_SCRIPT_URL?: string
  /** Server that holds the Sarvam key and answers /transcribe and /speak. Empty = the phone's own voice. */
  readonly VITE_VOICE_API_URL?: string
  /** Interim: the bearer token the backend's /worker-profile routes require. Empty = none. Replace with a per-profile token or code. */
  readonly VITE_PROFILE_API_TOKEN?: string
  /** Where the /worker-profile calls go (the real backend). Empty = same as VITE_API_BASE_URL. Jobs, hisaab and rates are not affected. */
  readonly VITE_PROFILE_API_URL?: string
  readonly VITE_JOBS_API_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
