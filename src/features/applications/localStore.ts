import { useSyncExternalStore } from 'react'
import type { Application } from '@/api/workerTypes'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'

/**
 * Used when applications go to the Google Sheet (see api/applySheet.ts). The sheet cannot be read back per worker,
 * so the phone keeps its own list for the "Applied" screen, and the worker's contact for the sheet row.
 */

export interface WorkerContact {
  name: string
  /** 10 digits. Kept on this phone only; the server returns just a masked number. */
  phone: string
}

const CONTACT_KEY = 'workerContact'
const APPS_KEY = 'localApplications'
const listeners = new Set<() => void>()
let apps: Application[] = readStorage<Application[]>(APPS_KEY, [])

const notify = () => listeners.forEach((l) => l())
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/* ---- contact ---- */
export const getContact = (): WorkerContact | null => readStorage<WorkerContact | null>(CONTACT_KEY, null)
export const setContact = (contact: WorkerContact): void => writeStorage(CONTACT_KEY, contact)
/** Keeps the contact in step with profile edits. Does nothing when no contact was saved. */
export function patchContact(patch: Partial<WorkerContact>): void {
  const current = getContact()
  if (current) setContact({ ...current, ...patch })
}
export const clearContact = (): void => removeStorage(CONTACT_KEY)

/* ---- applications ---- */
export const getLocalApplications = (): Application[] => apps

function setApps(next: Application[]): void {
  apps = next
  writeStorage(APPS_KEY, next)
  notify()
}

export function addLocalApplication(application: Application): void {
  if (apps.some((a) => a.jobId === application.jobId && a.status !== 'withdrawn')) return
  setApps([application, ...apps])
}

export function setLocalStatus(id: string, status: Application['status']): Application | undefined {
  const found = apps.find((a) => a.id === id)
  if (!found) return undefined
  const updated = { ...found, status }
  setApps(apps.map((a) => (a.id === id ? updated : a)))
  return updated
}

export function clearLocalApplications(): void {
  setApps([])
}

/** true when this phone has an active application for the job (used because the jobs server does not know about sheet applications). */
export function useAppliedLocally(jobId: string): boolean {
  return useSyncExternalStore(subscribe, () => apps.some((a) => a.jobId === jobId && a.status !== 'withdrawn'))
}
