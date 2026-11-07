/**
 * Tiny, safe wrapper around localStorage. Storage can be blocked or empty
 * (private mode, cleared data), so every read/write is guarded and the app
 * must always render correctly without it.
 */
const PREFIX = 'phala:'

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable - ignore */
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  language: 'language',
  area: 'area',
  pendingJob: 'pendingJob',
  jobCache: 'jobCache',
  profileSkipped: 'profileSkipped',
} as const
