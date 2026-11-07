import type { JobFilters } from '@/api/types'
import type { FullJob } from '@/api/workerTypes'

const DAY_MS = 24 * 3600 * 1000
const WORK_DAYS_PER_MONTH = 26

const postedTime = (job: FullJob) => (job.postedAt ? new Date(job.postedAt).getTime() : 0)
const monthlyTop = (job: FullJob) => (job.wage.type === 'daily' ? job.wage.max * WORK_DAYS_PER_MONTH : job.wage.max)

/**
 * Sort and filter the personalised list on the phone. The work type is not filtered here:
 * the list is already matched to the worker's trade. (Proposed: move this to the server with the same names.)
 */
export function filterFullJobs(jobs: FullJob[], filters: JobFilters, now = Date.now()): FullJob[] {
  const within = filters.posted === 'today' ? DAY_MS : filters.posted === 'week' ? 7 * DAY_MS : Infinity
  const list = jobs.filter((j) => (filters.wageType === 'any' || j.wage.type === filters.wageType) && (j.postedAt === null || now - new Date(j.postedAt).getTime() <= within))
  return list.sort((a, b) => (filters.sort === 'pay' ? monthlyTop(b) - monthlyTop(a) : postedTime(b) - postedTime(a) || Number(b.id) - Number(a.id)))
}
