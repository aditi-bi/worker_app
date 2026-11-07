import { useSyncExternalStore } from 'react'
import { readStorage, writeStorage } from '@/lib/storage'
import type { Application, LiveLocation } from '@/api/workerTypes'
import type { LocalizedText } from '@/lib/localized'

/** An application saved on the phone while offline. It is sent when the internet is back. */
export interface PendingApplication {
  jobId: string
  title: LocalizedText
  note?: string
  /** Live location read when the worker tapped apply; removed with the item once sent. */
  location?: LiveLocation
  savedAt: string
  /** Only for Google Sheet applications: what the sheet row and the phone's own list need. */
  applicationId?: string
  employer?: string
  job?: Application['job']
}

const KEY = 'pendingApplications'
const listeners = new Set<() => void>()
let cache: PendingApplication[] = readStorage<PendingApplication[]>(KEY, [])

function set(next: PendingApplication[]): void {
  cache = next
  writeStorage(KEY, next)
  listeners.forEach((l) => l())
}

export const getPending = (): PendingApplication[] => cache

export function enqueueApplication(item: PendingApplication): void {
  if (cache.some((p) => p.jobId === item.jobId)) return
  set([...cache, item])
}

export function removePending(jobId: string): void {
  set(cache.filter((p) => p.jobId !== jobId))
}

export function clearPending(): void {
  set([])
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePendingApplications(): PendingApplication[] {
  return useSyncExternalStore(subscribe, getPending, getPending)
}
