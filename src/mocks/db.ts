import type { Application, HisaabEntry, Worker } from '@/api/workerTypes'
import { L } from '@/lib/localized'
import { maskPhone } from '@/api/profileContract'

/**
 * In-browser mock database for the signed-in features. It is kept in localStorage so a reload keeps
 * the mock worker, applications and hisaab. It exists only in mock mode and is never part of a real build.
 */
interface MockDb {
  token: string | null
  /** The 10-digit number the mock profile was registered with. */
  phone: string | null
  /** Mock phone call: when it was asked for and when its answers land on the profile. */
  callAt: number | null
  callFillAt: number | null
  tokenValid: boolean
  worker: Worker | null
  applications: Application[]
  hisaab: HisaabEntry[]
}

const KEY = 'phala:mockdb'
const empty = (): MockDb => ({ token: null, phone: null, callAt: null, callFillAt: null, tokenValid: false, worker: null, applications: [], hisaab: [] })

function load(): MockDb {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? { ...empty(), ...(JSON.parse(raw) as Partial<MockDb>) } : empty()
  } catch {
    return empty()
  }
}

let db: MockDb = load()

export function getDb(): MockDb {
  return db
}

export function saveDb(): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

export function resetDb(): void {
  db = empty()
  saveDb()
}

export { maskPhone }

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function createWorker(opts: { name: string; phone: string; sectors: Worker['sectors']; skills: Worker['skills']; experienceYears: number; expectedPay: Worker['expectedPay']; homePlace: string; willingToRelocate: boolean; age: number | null; workMode: Worker['workMode']; livesOnSite: boolean }): string {
  db.worker = {
    id: newId('w'),
    name: opts.name,
    phoneMasked: maskPhone(opts.phone),
    sectors: opts.sectors,
    skills: opts.skills,
    experienceYears: opts.experienceYears,
    expectedPay: opts.expectedPay,
    homePlace: opts.homePlace,
    willingToRelocate: opts.willingToRelocate,
    age: opts.age,
    workMode: opts.workMode,
    livesOnSite: opts.livesOnSite,
  }
  db.phone = opts.phone
  db.token = db.worker.id
  db.tokenValid = true
  saveDb()
  return db.token
}

/** Dev helper: a few sample applications and work days so the lists are not empty. */
export function seedDemo(): void {
  const now = Date.now()
  const day = 24 * 3600 * 1000
  if (db.applications.length === 0) {
    const mk = (jobId: string, status: Application['status'], daysAgo: number, title: ReturnType<typeof L>, sector: Application['job']['sector'], areaId: string, min: number, max: number): Application => ({
      id: newId('a'),
      jobId,
      status,
      appliedAt: new Date(now - daysAgo * day).toISOString(),
      job: { title, sector, areaId, talukaId: null, wage: { min, max, type: 'daily' } },
    })
    db.applications = [
      mk('s02', 'shortlisted', 1, L('मिस्त्री (चिनाई)', 'गवंडी', 'Mason'), 'construction', 'mumbai', 1100, 1300),
      mk('s01', 'seen', 2, L('साइट हेल्पर', 'साइट हेल्पर', 'Site helper'), 'construction', 'mumbai', 850, 950),
      mk('s14', 'sent', 3, L('लोडिंग, अनलोडिंग', 'लोडिंग, अनलोडिंग', 'Loading and unloading'), 'loading', 'navi-mumbai', 850, 950),
      mk('s03', 'not_selected', 6, L('सरिया का काम', 'सळईचे काम', 'Bar bending'), 'construction', 'mumbai', 1000, 1100),
    ]
  }
  if (db.hisaab.length === 0) {
    const iso = (d: number) => new Date(now - d * day).toISOString().slice(0, 10)
    db.hisaab = [
      { id: newId('h'), date: iso(1), place: 'Worli site', amount: 1100 },
      { id: newId('h'), date: iso(2), place: 'Worli site', amount: 1100 },
      { id: newId('h'), date: iso(3), place: 'Ghatkopar', amount: 950 },
    ]
  }
  saveDb()
}
