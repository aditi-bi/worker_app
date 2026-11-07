import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sample from './fixtures/jobsSample.json'
import { DEFAULT_FILTERS } from '../types'
import type { Worker } from '../workerTypes'
import { clearToken, setToken } from '@/features/auth/tokenStore'

vi.stubEnv('VITE_JOBS_API_URL', 'https://jobs.example')
const mod = await import('../realJobs')
const { parseJob, parseJobs, guestPage, jobsForMePage, findJob, ratesFromJobs, sectorOf, loadJobs, resetJobsCache, rawJobListSchema } = mod

const raws = rawJobListSchema.parse(sample).jobs
const byId = (id: number) => raws.find((r) => r.job_id === id)!
const jobs = parseJobs(raws)

const worker = (sectors: Worker['sectors']): Worker => ({
  id: 'w1', name: 'Asha', phoneMasked: '', sectors, skills: [], experienceYears: 1, expectedPay: { amount: 600, type: 'daily' },
  homePlace: '', willingToRelocate: false, age: null, workMode: 'daily', livesOnSite: false,
})

describe('reading one listed job', () => {
  it('takes title, employer, place and wage from the description', () => {
    const job = parseJob(byId(485))!
    expect(job.guest.title.en).toBe('Warehouse Heavy Material Picker / Packer')
    expect(job.employer).toBe('Major Desire Outsourcing')
    expect(job.address).toBe('Ghatkopar West, Mumbai')
    expect(job.guest).toMatchObject({ id: '485', areaId: 'mumbai', talukaId: 'ghatkopar', sector: 'loading', wage: { min: 17000, max: 18000, type: 'monthly' }, postedAt: null })
  })

  it('uses the Hiring Entity, never the wrong company_name', () => {
    expect(parseJob(byId(512))!.employer).toBe('Central Railway Civil Maintenance Contractor')
  })

  it('reads daily pay and the weekly pay cycle', () => {
    const daily = parseJob(byId(494))!
    expect(daily.guest.wage).toEqual({ min: 500, max: 650, type: 'daily' })
    expect(daily.payCycle).toBe('daily')
    expect(parseJob(byId(495))!.payCycle).toBe('weekly')
  })

  it('leaves out jobs that cannot be shown', () => {
    expect(parseJob(byId(583))).toBeNull() // no description or wage
    expect(parseJob(byId(999))).toBeNull() // not active
    expect(jobs.map((j) => j.guest.id)).not.toContain('583')
  })

  it('works out the work type from the words of the job', () => {
    expect(sectorOf('Commercial Kitchen Scullery Helper')).toBe('hotel')
    expect(sectorOf('Commercial Industrial Laundry Helper')).toBe('domestic')
    expect(sectorOf('Sugarcane Harvesting & Field Truck Loading Labourer')).toBe('farm')
    expect(sectorOf('Building Construction Site Beldar / Labourer')).toBe('construction')
    expect(sectorOf('Brick Kiln Heavy Stacking Labourer')).toBe('construction')
    expect(sectorOf('Warehouse Heavy Loader & Unloader')).toBe('loading')
    expect(sectorOf('Industrial Die Works Machine Operator Helper')).toBe('factory')
  })
})

describe('what the screens get', () => {
  it('lists one area, newest id first, in pages', () => {
    const first = guestPage(jobs, { areaId: 'mumbai', filters: DEFAULT_FILTERS, page: 1 }, 2)
    expect(first.items.map((j) => j.id)).toEqual(['577', '576'])
    expect(first.total).toBe(5)
    expect(first.nextPage).toBe(2)
    expect(guestPage(jobs, { areaId: 'mumbai', filters: DEFAULT_FILTERS, page: 3 }, 2).nextPage).toBeNull()
  })

  it('filters by work type and pay type, and sorts by pay', () => {
    const loading = guestPage(jobs, { areaId: 'mumbai', filters: { ...DEFAULT_FILTERS, sector: 'loading' }, page: 1 }, 10)
    expect(loading.items.map((j) => j.id).sort()).toEqual(['485', '486', '500'])
    const daily = guestPage(jobs, { areaId: 'mumbai', filters: { ...DEFAULT_FILTERS, wageType: 'daily' }, page: 1 }, 10)
    expect(daily.items.every((j) => j.wage.type === 'daily')).toBe(true)
    const byPay = guestPage(jobs, { areaId: 'mumbai', filters: { ...DEFAULT_FILTERS, sort: 'pay' }, page: 1 }, 10)
    expect(byPay.items[0].id).toBe('486') // 20,000 a month beats every daily wage
  })

  it('has no posting date, so a date filter does not hide jobs', () => {
    const week = guestPage(jobs, { areaId: 'palghar', filters: { ...DEFAULT_FILTERS, posted: 'week' }, page: 1 }, 10)
    expect(week.total).toBe(2)
  })

  it('shows a worker the jobs for their trade, or the whole area when none fit', () => {
    const fits = jobsForMePage(jobs, worker(['hotel']), { areaId: 'mumbai', page: 1 }, 6)
    expect(fits.items.map((j) => j.id)).toEqual(['576'])
    expect(fits.items[0].matchReason?.en).toBe('Hotel, kitchen')
    const none = jobsForMePage(jobs, worker(['domestic']), { areaId: 'mumbai', page: 1 }, 6)
    expect(none.total).toBe(5)
    expect(none.items[0].matchReason).toBeNull()
    expect(jobsForMePage(jobs, null, { areaId: 'mumbai', page: 1 }, 6).total).toBe(5)
  })

  it('opens one job with what is known and "not given" for the rest', () => {
    const job = findJob(jobs, '485', null)!
    expect(job.employer.name).toBe('Major Desire Outsourcing')
    expect(job).toMatchObject({ hours: null, starts: null, distanceKm: null, applied: false })
    expect(findJob(jobs, '583', null)).toBeNull()
  })
})

describe('rates from the listed jobs', () => {
  it('gives a daily range per work type with at least three jobs, and marks it as not official', () => {
    const rates = ratesFromJobs(jobs, 'mumbai')
    expect(rates).toMatchObject({ areaId: 'mumbai', verified: false, fromJobs: true })
    const loading = rates.items.find((r) => r.id === 'loading')!
    expect(loading.min).toBeGreaterThan(0)
    expect(loading.max).toBeGreaterThanOrEqual(loading.min)
    expect(loading.max).toBeLessThan(1500) // monthly pay was turned into a daily figure
    expect(rates.items.find((r) => r.id === 'hotel')).toBeUndefined() // only one job
  })

  it('has nothing for an area without listed jobs', () => {
    expect(ratesFromJobs(jobs, 'latur').items).toEqual([])
  })
})

describe('loading the list', () => {
  beforeEach(() => resetJobsCache())
  afterEach(() => {
    vi.unstubAllGlobals()
    clearToken()
  })

  it('fetches once, sends no login token, and reuses the answer', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(sample), { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)
    setToken('worker-session-secret')
    const first = await loadJobs()
    await loadJobs()
    expect(first.length).toBe(jobs.length)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://jobs.example/api/jobs/')
    expect(JSON.stringify(init?.headers ?? {})).not.toMatch(/authorization|worker-session-secret/i)
  })

  it('reports a failure and tries again next time', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('down')))
    await expect(loadJobs()).rejects.toMatchObject({ kind: 'network' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(sample), { status: 200 })))
    await expect(loadJobs()).resolves.toHaveLength(jobs.length)
  })
})
