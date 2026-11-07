import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applySheet, sheetEnabled } from '@/api/applySheet'
import { ApiError, isOfflineError } from '@/api/errors'
import { workerApi } from '@/api/workerEndpoints'
import { ACTIVE_STATUSES, type Application, type FullJob, type LiveLocation } from '@/api/workerTypes'
import { useAuth } from '@/features/auth/AuthContext'
import { getCurrentPosition } from '@/features/location/hooks/useGeolocation'
import { useOnline } from '@/hooks/useOnline'
import { addLocalApplication, getContact, getLocalApplications, setLocalStatus } from './localStore'
import { enqueueApplication, getPending, removePending, type PendingApplication } from './pendingQueue'

export const APPLICATIONS_KEY = ['applications'] as const

export function useApplications() {
  const { signedIn } = useAuth()
  return useQuery({
    queryKey: APPLICATIONS_KEY,
    // With the Google Sheet the phone keeps its own list (the sheet cannot be read back per worker).
    queryFn: ({ signal }) => (sheetEnabled() ? Promise.resolve({ items: getLocalApplications() }) : workerApi.listApplications(signal)),
    enabled: signedIn,
    staleTime: 15_000,
  })
}

/** Sends one application: to the Google Sheet when it is set up, otherwise to the /applications API. */
async function deliver(item: PendingApplication): Promise<Application> {
  if (!sheetEnabled()) return workerApi.apply({ jobId: item.jobId, note: item.note, location: item.location })
  const contact = getContact()
  if (!contact || !item.job) throw new ApiError('unknown', { code: 'no_contact' })
  const id = item.applicationId ?? crypto.randomUUID()
  await applySheet.submit({
    applicationId: id,
    jobId: item.jobId,
    jobTitle: item.title.en,
    employer: item.employer ?? '',
    workerName: contact.name,
    phone: contact.phone,
    note: item.note,
    location: item.location,
  })
  const application: Application = { id, jobId: item.jobId, status: 'sent', appliedAt: new Date().toISOString(), job: item.job }
  addLocalApplication(application)
  return application
}

export type ApplyResult = ({ queued: false; application: Application } | { queued: true }) & { locationShared: boolean }

/** The worker's live position at the moment of applying. null when denied, off or too slow: the application still goes. */
async function readLiveLocation(): Promise<LiveLocation | undefined> {
  try {
    const { lat, lng } = await getCurrentPosition(8000, true)
    return { lat, lng, capturedAt: new Date().toISOString() }
  } catch {
    return undefined
  }
}

/** Sends an application. With no internet it is saved on the phone and sent later (see PendingApplicationsSync). */
export function useApply() {
  const queryClient = useQueryClient()
  return useMutation<ApplyResult, Error, { job: FullJob; note?: string }>({
    mutationFn: async ({ job, note }) => {
      const location = await readLiveLocation()
      const locationShared = location !== undefined
      const item: PendingApplication = {
        jobId: job.id,
        title: job.title,
        note,
        location,
        savedAt: new Date().toISOString(),
        applicationId: crypto.randomUUID(),
        employer: job.employer.name,
        job: { title: job.title, sector: job.sector, areaId: job.areaId, talukaId: job.talukaId, wage: job.wage },
      }
      const save = (): ApplyResult => {
        enqueueApplication(item)
        return { queued: true, locationShared }
      }
      if (!navigator.onLine) return save()
      try {
        return { queued: false, locationShared, application: await deliver({ ...item, note: note || undefined }) }
      } catch (error) {
        if (isOfflineError(error)) return save()
        throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useWithdraw() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Application> => {
      if (!sheetEnabled()) return workerApi.withdraw(id)
      await applySheet.withdraw(id)
      const updated = setLocalStatus(id, 'withdrawn')
      if (!updated) throw new ApiError('not_found')
      return updated
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/** Mounted once for signed-in workers: sends saved applications when the phone is online again. */
export function usePendingApplicationsSync(): void {
  const { signedIn } = useAuth()
  const online = useOnline()
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!signedIn || !online) return
    let cancelled = false
    void (async () => {
      for (const item of [...getPending()]) {
        if (cancelled) return
        try {
          await deliver(item)
          removePending(item.jobId)
        } catch (error) {
          // Already applied: nothing left to send. Other errors keep the item for the next try.
          if (error instanceof ApiError && error.kind === 'conflict') removePending(item.jobId)
        }
      }
      void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
    })()
    return () => {
      cancelled = true
    }
  }, [signedIn, online, queryClient])
}

export type ApplicationFilter = 'all' | 'active' | 'closed'

export function filterApplications(items: Application[], filter: ApplicationFilter): Application[] {
  if (filter === 'all') return items
  return items.filter((a) => (filter === 'active') === ACTIVE_STATUSES.includes(a.status))
}
