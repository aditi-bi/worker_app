import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applySheet, sheetEnabled } from '@/api/applySheet'
import { ApiError } from '@/api/errors'
import type { Application } from '@/api/workerTypes'
import { L } from '@/lib/localized'
import { addLocalApplication, clearLocalApplications, getLocalApplications, patchContact, setContact, getContact, setLocalStatus } from '../localStore'

const body = { applicationId: 'a1', jobId: 'j1', jobTitle: 'Mason', employer: 'ABC', workerName: 'Ramesh', phone: '9876543210' }
const reply = (data: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status }))

describe('google sheet applications', () => {
  beforeEach(() => vi.stubEnv('VITE_APPLY_SCRIPT_URL', 'https://script.example/exec'))
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is switched on only when the script url is set', () => {
    expect(sheetEnabled()).toBe(true)
    vi.stubEnv('VITE_APPLY_SCRIPT_URL', '')
    expect(sheetEnabled()).toBe(false)
  })

  it('posts plain text so the browser sends no preflight', async () => {
    const fetchMock = reply({ ok: true, applicationId: 'a1' })
    vi.stubGlobal('fetch', fetchMock)
    await applySheet.submit(body)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://script.example/exec')
    expect((init.headers as Record<string, string>)['Content-Type']).toContain('text/plain')
    expect(JSON.parse(init.body as string)).toMatchObject({ action: 'apply', jobId: 'j1', phone: '9876543210' })
  })

  it('turns already_applied into a conflict', async () => {
    vi.stubGlobal('fetch', reply({ ok: false, code: 'already_applied' }))
    await expect(applySheet.submit(body)).rejects.toMatchObject({ kind: 'conflict' })
  })

  it('reports a network failure as offline and a bad reply as invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')))
    await expect(applySheet.submit(body)).rejects.toMatchObject({ kind: 'network' })
    vi.stubGlobal('fetch', reply({ hello: 1 }))
    await expect(applySheet.submit(body)).rejects.toBeInstanceOf(ApiError)
  })
})

describe('phone-side application list', () => {
  const app = (id: string, jobId: string): Application => ({
    id,
    jobId,
    status: 'sent',
    appliedAt: '2026-11-04T00:00:00Z',
    job: { title: L('a', 'a', 'a'), sector: 'construction', areaId: 'mumbai', talukaId: null, wage: { min: 1, max: 2, type: 'daily' } },
  })
  beforeEach(() => clearLocalApplications())

  it('keeps one active application per job and can withdraw it', () => {
    addLocalApplication(app('1', 'j1'))
    addLocalApplication(app('2', 'j1'))
    expect(getLocalApplications()).toHaveLength(1)
    expect(setLocalStatus('1', 'withdrawn')?.status).toBe('withdrawn')
    addLocalApplication(app('3', 'j1'))
    expect(getLocalApplications()).toHaveLength(2)
  })

  it('keeps the contact in step with profile edits', () => {
    setContact({ name: 'Ramesh', phone: '9876543210' })
    patchContact({ phone: '9123456780' })
    expect(getContact()).toEqual({ name: 'Ramesh', phone: '9123456780' })
  })
})
