import { delay, http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/api/client'
import { PAGE_SIZE } from '@/api/endpoints'
import type { GuestJob } from '@/api/types'
import { distanceKm } from '@/lib/geo'
import { AREAS } from './fixtures/areas'
import { GUEST_JOBS } from './fixtures/jobs'
import { SECTORS } from './fixtures/sectors'
import { getScenario } from './scenarios'
import { workerHandlers } from './workerHandlers'

const url = (path: string) => `${API_BASE_URL}${path}`

/** Applies the scenario's failure/latency; returns a Response when the request should fail. */
async function applyScenario(): Promise<Response | null> {
  const scenario = getScenario()
  if (scenario === 'slow') await delay(3000)
  else await delay(350 + Math.random() * 350)
  if (scenario === 'network-down') return HttpResponse.error()
  if (scenario === 'error')
    return HttpResponse.json({ code: 'server_error', message_key: 'states.errorBody', retry_allowed: true }, { status: 500 })
  return null
}

const DAY = 24 * 3600 * 1000

const guestHandlers = [
  http.get(url('/areas'), async () => {
    const failure = await applyScenario()
    return failure ?? HttpResponse.json(AREAS)
  }),

  http.get(url('/sectors'), async () => {
    const failure = await applyScenario()
    return failure ?? HttpResponse.json(SECTORS)
  }),

  http.post(url('/areas/resolve'), async ({ request }) => {
    const failure = await applyScenario()
    if (failure) return failure
    if (getScenario() === 'area-not-found') return HttpResponse.json({ code: 'area_not_covered' }, { status: 404 })
    const { lat, lng } = (await request.json()) as { lat: number; lng: number }
    let best = AREAS[0]
    let bestKm = Infinity
    for (const area of AREAS) {
      const km = distanceKm({ lat, lng }, area)
      if (km < bestKm) {
        best = area
        bestKm = km
      }
    }
    // Real service area check: more than 120 km from any district centre is "not covered".
    if (bestKm > 120) return HttpResponse.json({ code: 'area_not_covered' }, { status: 404 })
    return HttpResponse.json({ area: best, talukaId: null })
  }),

  http.get(url('/jobs/public'), async ({ request }) => {
    const failure = await applyScenario()
    if (failure) return failure

    const q = new URL(request.url).searchParams
    const area = q.get('area')
    const sector = q.get('sector')
    const sort = q.get('sort') ?? 'newest'
    const wageType = q.get('wage_type')
    const posted = q.get('posted_within')
    const page = Math.max(1, Number(q.get('page') ?? 1))
    const pageSize = Number(q.get('page_size') ?? PAGE_SIZE)

    let jobs: GuestJob[] = getScenario() === 'empty' ? [] : GUEST_JOBS.filter((j) => j.areaId === area)
    if (sector) jobs = jobs.filter((j) => j.sector === sector)
    if (wageType) jobs = jobs.filter((j) => j.wage.type === wageType)
    if (posted) {
      const limit = Date.now() - (posted === 'today' ? DAY : 7 * DAY)
      jobs = jobs.filter((j) => new Date(j.postedAt ?? 0).getTime() >= limit)
    }
    const monthly = (j: GuestJob) => (j.wage.type === 'monthly' ? j.wage.max : j.wage.max * 26)
    jobs = [...jobs].sort((a, b) =>
      sort === 'pay' ? monthly(b) - monthly(a) : new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime(),
    )

    const start = (page - 1) * pageSize
    const items = jobs.slice(start, start + pageSize)
    return HttpResponse.json({ items, total: jobs.length, nextPage: start + pageSize < jobs.length ? page + 1 : null })
  }),
]

/** Guest handlers first: `/jobs/public` must match before `/jobs/:id`. */
export const handlers = [...guestHandlers, ...workerHandlers]
