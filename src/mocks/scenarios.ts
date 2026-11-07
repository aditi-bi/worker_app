/**
 * Mock scenarios let a developer see every UI state without a backend.
 * Pick one with ?scenario=<name> in the URL, or with the Dev panel (bottom-left).
 */
export const SCENARIOS = ['normal', 'empty', 'error', 'slow', 'network-down', 'area-not-found'] as const
export type Scenario = (typeof SCENARIOS)[number]

const KEY = 'phala:mockScenario'

export function isScenario(value: unknown): value is Scenario {
  return typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value)
}

export function getScenario(): Scenario {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('scenario')
    if (isScenario(fromUrl)) {
      window.sessionStorage.setItem(KEY, fromUrl)
      return fromUrl
    }
    const stored = window.sessionStorage.getItem(KEY)
    if (isScenario(stored)) return stored
  } catch {
    /* ignore */
  }
  return 'normal'
}

export function setScenario(value: Scenario): void {
  try {
    window.sessionStorage.setItem(KEY, value)
  } catch {
    /* ignore */
  }
}
