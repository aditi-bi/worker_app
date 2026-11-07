import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS } from '@/api/types'
import type { FullJob } from '@/api/workerTypes'
import { filterFullJobs } from '../filterJobs'

const NOW = new Date('2026-11-03T10:00:00Z').getTime()
const job = (id: string, hoursAgo: number, wage: FullJob['wage']) => ({ id, postedAt: new Date(NOW - hoursAgo * 3600_000).toISOString(), wage }) as FullJob
const jobs = [job('a', 50, { min: 900, max: 1000, type: 'daily' }), job('b', 2, { min: 14000, max: 16000, type: 'monthly' }), job('c', 30, { min: 1100, max: 1300, type: 'daily' })]

describe('filterFullJobs', () => {
  it('sorts newest first by default', () => {
    expect(filterFullJobs(jobs, DEFAULT_FILTERS, NOW).map((j) => j.id)).toEqual(['b', 'c', 'a'])
  })
  it('sorts by pay using monthly equivalents', () => {
    expect(filterFullJobs(jobs, { ...DEFAULT_FILTERS, sort: 'pay' }, NOW).map((j) => j.id)).toEqual(['c', 'a', 'b'])
  })
  it('filters by pay type and posted date', () => {
    expect(filterFullJobs(jobs, { ...DEFAULT_FILTERS, wageType: 'daily' }, NOW).map((j) => j.id)).toEqual(['c', 'a'])
    expect(filterFullJobs(jobs, { ...DEFAULT_FILTERS, posted: 'today' }, NOW).map((j) => j.id)).toEqual(['b'])
    expect(filterFullJobs(jobs, { ...DEFAULT_FILTERS, posted: 'week' }, NOW)).toHaveLength(3)
  })
})
