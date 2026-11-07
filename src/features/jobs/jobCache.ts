import type { GuestJob, JobFilters } from '@/api/types'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/lib/storage'

/** The last first-page result per area+filters, kept so an offline worker still sees something useful. */
interface CacheEntry {
  jobs: GuestJob[]
  total: number
  savedAt: number
}
type CacheMap = Record<string, CacheEntry>

const MAX_ENTRIES = 12

export const cacheKey = (areaId: string, filters: JobFilters) =>
  [areaId, filters.sector, filters.sort, filters.wageType, filters.posted].join('|')

export function saveJobCache(key: string, jobs: GuestJob[], total: number): void {
  const map = readStorage<CacheMap>(STORAGE_KEYS.jobCache, {})
  map[key] = { jobs, total, savedAt: Date.now() }
  const keys = Object.keys(map)
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => map[a].savedAt - map[b].savedAt)
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((k) => delete map[k])
  }
  writeStorage(STORAGE_KEYS.jobCache, map)
}

export function loadJobCache(key: string): CacheEntry | null {
  return readStorage<CacheMap>(STORAGE_KEYS.jobCache, {})[key] ?? null
}
