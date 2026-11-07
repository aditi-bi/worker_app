import { beforeEach, describe, expect, it } from 'vitest'
import type { Application } from '@/api/workerTypes'
import { L } from '@/lib/localized'
import { clearPending, enqueueApplication, getPending, removePending } from '../pendingQueue'
import { filterApplications } from '../useApplications'

const app = (id: string, status: Application['status']): Application => ({
  id,
  jobId: id,
  status,
  appliedAt: '2026-11-01T00:00:00Z',
  job: { title: L('a', 'a', 'a'), sector: 'construction', areaId: 'mumbai', talukaId: null, wage: { min: 1, max: 2, type: 'daily' } },
})

describe('applications', () => {
  const items = [app('1', 'sent'), app('2', 'shortlisted'), app('3', 'not_selected'), app('4', 'withdrawn'), app('5', 'hired')]

  it('splits active and closed', () => {
    expect(filterApplications(items, 'active').map((a) => a.id)).toEqual(['1', '2', '5'])
    expect(filterApplications(items, 'closed').map((a) => a.id)).toEqual(['3', '4'])
    expect(filterApplications(items, 'all')).toHaveLength(5)
  })
})

describe('offline queue', () => {
  beforeEach(() => clearPending())
  it('keeps one saved application per job and removes it once sent', () => {
    const item = { jobId: 'j1', title: L('a', 'a', 'a'), savedAt: '2026-11-03T00:00:00Z' }
    enqueueApplication(item)
    enqueueApplication(item)
    expect(getPending()).toHaveLength(1)
    removePending('j1')
    expect(getPending()).toHaveLength(0)
  })
})
