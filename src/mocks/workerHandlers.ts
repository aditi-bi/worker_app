import { delay, http, HttpResponse } from 'msw'
import { API_BASE_URL, profileIsReal } from '@/api/client'
import type { Application, ApplicationStatus, FullJob, Worker } from '@/api/workerTypes'
import { FOR_ME_PAGE_SIZE } from '@/api/workerEndpoints'
import { L } from '@/lib/localized'
import { AREAS } from './fixtures/areas'
import { toFullJob } from './fixtures/fullJobs'
import { GUEST_JOBS } from './fixtures/jobs'
import { createWorker, getDb, newId, saveDb } from './db'
import { getScenario } from './scenarios'

const url = (path: string) => `${API_BASE_URL}${path}`
const json = (body: unknown, init?: ResponseInit) => HttpResponse.json(body as Record<string, unknown>, init)

async function latency(): Promise<Response | null> {
  const scenario = getScenario()
  await delay(scenario === 'slow' ? 2500 : 250 + Math.random() * 250)
  if (scenario === 'network-down') return HttpResponse.error()
  if (scenario === 'error') return json({ code: 'server_error', retry_allowed: true }, { status: 500 })
  return null
}

/** Returns a 401 Response when the request has no valid session. */
function authFailure(request: Request): Response | null {
  const db = getDb()
  const header = request.headers.get('Authorization')
  // The profile is on a real server, so the mock cannot know the session; any signed-in phone is accepted here.
  if (profileIsReal()) return header?.startsWith('Bearer ') ? null : json({ code: 'unauthorized' }, { status: 401 })
  if (!db.token || !db.tokenValid || header !== `Bearer ${db.token}`) return json({ code: 'unauthorized' }, { status: 401 })
  return null
}

/* ---------- applications ---------- */

/** Status moves on with time so the list shows more than "sent" during a demo (mock only). */
function applicationView(a: Application): Application {
  if (a.status === 'withdrawn' || a.status === 'not_selected' || a.status === 'hired' || a.status === 'shortlisted') return a
  const age = Date.now() - new Date(a.appliedAt).getTime()
  const status: ApplicationStatus = age > 60_000 ? 'seen' : 'sent'
  return a.status === 'seen' ? a : { ...a, status }
}

function activeJobIds(): Set<string> {
  return new Set(
    getDb()
      .applications.filter((a) => a.status !== 'withdrawn')
      .map((a) => a.jobId),
  )
}

function jobsForWorker(worker: Worker | null, areaId: string): FullJob[] {
  const applied = activeJobIds()
  const inArea = getScenario() === 'empty' ? [] : GUEST_JOBS.filter((j) => j.areaId === areaId)
  const matching = worker ? inArea.filter((j) => worker.sectors.includes(j.sector)) : []
  const list = (matching.length > 0 ? matching : inArea).map((j) => toFullJob(j, worker, applied))
  return list.sort((a, b) => new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime())
}

/* ---------- rates ---------- */

const BASE_RATES: Array<[string, [string, string, string], number, number]> = [
  ['helper', ['हेल्पर', 'हेल्पर', 'Helper'], 800, 900],
  ['mason', ['मिस्त्री', 'गवंडी', 'Mason'], 1000, 1200],
  ['bar', ['सरिया', 'सळई', 'Bar bending'], 950, 1100],
  ['painter', ['पेंटर', 'पेंटर', 'Painter'], 900, 1000],
  ['loader', ['लोडर', 'लोडर', 'Loader'], 750, 850],
]
const AREA_FACTOR: Record<string, number> = { mumbai: 1.1, thane: 1, pune: 1, 'navi-mumbai': 1.05 }
const round50 = (n: number) => Math.round(n / 50) * 50

export const workerHandlers = [
  /* ---- the backend's /worker-profile routes (see src/api/profileContract.ts) ---- */
  http.post(url('/worker-profile/register'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const body = (await request.json()) as { phone_number?: string; type?: string }
    const phone = (body.phone_number ?? '').replace(/\D/g, '').slice(-10)
    if (phone.length < 10 || body.type !== 'worker') return json({ success: false, error: 'Invalid request body' }, { status: 400 })
    if (getDb().worker && getDb().phone === phone) return json({ success: false, error: 'A profile already exists for this phone number' }, { status: 409 })
    createWorker({ name: '', phone, sectors: [], skills: [], experienceYears: 0, expectedPay: { amount: 0, type: 'daily' }, homePlace: '', willingToRelocate: false, age: null, workMode: 'daily', livesOnSite: false })
    return json({ success: true, id: getDb().worker?.id }, { status: 201 })
  }),

  http.get(url('/worker-profile'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const phone = (new URL(request.url).searchParams.get('phone_number') ?? '').replace(/\D/g, '').slice(-10)
    const db = getDb()
    if (phone.length < 10) return json({ success: false, error: 'phone_number must contain at least 10 digits' }, { status: 400 })
    if (db.worker && db.phone === phone && db.callFillAt !== null && Date.now() >= db.callFillAt) {
      // The mock "call" has ended: its answers are now on the profile, as the webhook would leave them.
      db.worker = { ...db.worker, name: 'Ramesh', sectors: ['construction'], experienceYears: 6, expectedPay: { amount: 800, type: 'daily' }, homePlace: 'Bhiwandi', willingToRelocate: true, workMode: 'daily', livesOnSite: false }
      db.callFillAt = null
      saveDb()
    }
    const w = db.worker
    if (!w || db.phone !== phone) return json({ success: true, found: false })
    return json({
      success: true,
      found: true,
      id: w.id,
      name: w.name || null,
      phone_number: phone,
      type: 'worker',
      skills: [],
      sectors: w.sectors,
      age: w.age,
      experience: w.experienceYears,
      expected_pay: (w.expectedPay.type === 'monthly' ? Math.round(w.expectedPay.amount / 26) : w.expectedPay.amount) || null,
      monthly_pay: w.expectedPay.type === 'monthly' ? w.expectedPay.amount : null,
      home_place: w.homePlace || null,
      willing_to_relocate: w.willingToRelocate,
      work_mode: w.workMode,
      lives_on_site: w.livesOnSite,
    })
  }),

  http.post(url('/worker-profile/call'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const body = (await request.json()) as { phone_number?: string }
    const phone = (body.phone_number ?? '').replace(/\D/g, '').slice(-10)
    if (phone.length < 10) return json({ success: false, error: 'phone_number must contain at least 10 digits' }, { status: 400 })
    const db = getDb()
    if (db.worker && db.phone === phone && db.callAt !== null && Date.now() - db.callAt < 2 * 60_000) {
      return json({ success: false, error: 'A call to this number was already triggered in the last 2 minutes' }, { status: 409 })
    }
    if (!db.worker || db.phone !== phone) {
      createWorker({ name: '', phone, sectors: [], skills: [], experienceYears: 0, expectedPay: { amount: 0, type: 'daily' }, homePlace: '', willingToRelocate: false, age: null, workMode: 'daily', livesOnSite: false })
    }
    db.callAt = Date.now()
    db.callFillAt = Date.now() + 12_000
    saveDb()
    return json({ success: true, id: newId('call'), profile_id: getDb().worker?.id, phone_number: phone, sarvam: {} }, { status: 202 })
  }),

  http.patch(url('/worker-profile'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const { id, ...f } = (await request.json()) as { id?: string } & Record<string, unknown>
    const db = getDb()
    if (Object.keys(f).length === 0) return json({ success: false, error: 'Nothing to change: send at least one field besides id' }, { status: 400 })
    if (!db.worker || id !== db.worker.id) return json({ success: false, error: 'Profile not found' }, { status: 404 })
    const w = db.worker
    db.worker = {
      ...w,
      ...(f.name !== undefined ? { name: f.name as string } : {}),
      ...(f.sectors !== undefined ? { sectors: f.sectors as Worker['sectors'] } : {}),
      ...(f.experience !== undefined ? { experienceYears: f.experience as number } : {}),
      ...(typeof f.monthly_pay === 'number'
        ? { expectedPay: { amount: f.monthly_pay, type: 'monthly' as const } }
        : f.expected_pay !== undefined
          ? { expectedPay: { amount: f.expected_pay as number, type: 'daily' as const } }
          : {}),
      ...(f.home_place !== undefined ? { homePlace: f.home_place as string } : {}),
      ...(f.willing_to_relocate !== undefined ? { willingToRelocate: f.willing_to_relocate as boolean } : {}),
      ...(f.age !== undefined ? { age: f.age as number | null } : {}),
      ...(f.work_mode !== undefined ? { workMode: f.work_mode as Worker['workMode'] } : {}),
      ...(f.lives_on_site !== undefined ? { livesOnSite: f.lives_on_site as boolean } : {}),
    }
    saveDb()
    return json({ success: true })
  }),

  http.get(url('/jobs/for-me'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const denied = authFailure(request)
    if (denied) return denied
    const q = new URL(request.url).searchParams
    const page = Math.max(1, Number(q.get('page') ?? 1))
    const size = Number(q.get('page_size') ?? FOR_ME_PAGE_SIZE)
    const list = jobsForWorker(getDb().worker, q.get('area') ?? '')
    const start = (page - 1) * size
    return json({ items: list.slice(start, start + size), total: list.length, nextPage: start + size < list.length ? page + 1 : null })
  }),

  http.get(url('/jobs/:id'), async ({ params, request }) => {
    const failure = await latency()
    if (failure) return failure
    const denied = authFailure(request)
    if (denied) return denied
    const job = GUEST_JOBS.find((j) => j.id === params.id)
    if (!job) return json({ code: 'not_found' }, { status: 404 })
    return json(toFullJob(job, getDb().worker, activeJobIds()))
  }),

  http.post(url('/applications'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const denied = authFailure(request)
    if (denied) return denied
    const db = getDb()
    const body = (await request.json()) as { jobId: string; note?: string; location?: { lat: number; lng: number } }
    const job = GUEST_JOBS.find((j) => j.id === body.jobId)
    if (!job) return json({ code: 'not_found' }, { status: 404 })
    if (activeJobIds().has(job.id)) return json({ code: 'already_applied' }, { status: 409 })
    const application: Application = {
      id: newId('a'),
      jobId: job.id,
      status: 'sent',
      appliedAt: new Date().toISOString(),
      job: { title: job.title, sector: job.sector, areaId: job.areaId, talukaId: job.talukaId, wage: job.wage },
    }
    db.applications = [application, ...db.applications]
    saveDb()
    return json(application, { status: 201 })
  }),

  http.get(url('/applications'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    return authFailure(request) ?? json({ items: getDb().applications.map(applicationView) })
  }),

  http.post(url('/applications/:id/withdraw'), async ({ params, request }) => {
    const failure = await latency()
    if (failure) return failure
    const denied = authFailure(request)
    if (denied) return denied
    const db = getDb()
    const found = db.applications.find((a) => a.id === params.id)
    if (!found) return json({ code: 'not_found' }, { status: 404 })
    found.status = 'withdrawn'
    saveDb()
    return json(found)
  }),

  http.get(url('/hisaab'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const denied = authFailure(request)
    if (denied) return denied
    const month = new URL(request.url).searchParams.get('month') ?? ''
    return json({ items: getDb().hisaab.filter((h) => h.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)) })
  }),

  http.post(url('/hisaab'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const denied = authFailure(request)
    if (denied) return denied
    const body = (await request.json()) as { date: string; place: string; amount: number }
    const entry = { id: newId('h'), ...body }
    getDb().hisaab.push(entry)
    saveDb()
    return json(entry, { status: 201 })
  }),

  http.delete(url('/hisaab/:id'), async ({ params, request }) => {
    const failure = await latency()
    if (failure) return failure
    const denied = authFailure(request)
    if (denied) return denied
    const db = getDb()
    db.hisaab = db.hisaab.filter((h) => h.id !== params.id)
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(url('/rates'), async ({ request }) => {
    const failure = await latency()
    if (failure) return failure
    const areaId = new URL(request.url).searchParams.get('area') ?? 'thane'
    if (!AREAS.some((a) => a.id === areaId)) return json({ code: 'not_found' }, { status: 404 })
    const factor = AREA_FACTOR[areaId] ?? 0.85
    return json({
      areaId,
      verified: false,
      items: BASE_RATES.map(([id, [hi, mr, en], min, max]) => ({ id, name: L(hi, mr, en), min: round50(min * factor), max: round50(max * factor) })),
    })
  }),
]
