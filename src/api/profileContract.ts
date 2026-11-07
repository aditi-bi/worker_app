/**
 * The profile contract of the real backend (/worker-profile). The app keeps its own Worker shape, so this file is the
 * only place that translates between the two. Backend facts: expected_pay is a DAILY wage in rupees, work_mode is free
 * text, the phone number cannot be edited, and there is no delete.
 */
import { z } from 'zod'
import { sectorIdSchema } from './types'
import { workModeSchema, type RegisterBody, type Worker, type WorkerPatch } from './workerTypes'

export const DAYS_PER_MONTH = 26

export const backendProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phone_number: z.string(),
  type: z.enum(['worker', 'contractor']).nullable(),
  skills: z.array(z.string()),
  sectors: z.array(z.string()),
  age: z.number().nullable(),
  experience: z.number().nullable(),
  expected_pay: z.number().nullable(),
  home_place: z.string().nullable(),
  willing_to_relocate: z.boolean().nullable(),
  work_mode: z.string().nullable(),
  lives_on_site: z.boolean().nullable(),
  // Newer backends also store the monthly figure and the app language; older ones leave them out.
  monthly_pay: z.number().nullish(),
  language: z.enum(['hi', 'mr', 'en']).nullish(),
})
export type BackendProfile = z.infer<typeof backendProfileSchema>

/** GET /worker-profile?phone_number= answers either "found" with the profile or "not found". */
export const lookupSchema = z.union([
  backendProfileSchema.extend({ found: z.literal(true) }),
  z.object({ found: z.literal(false) }),
])
export type LookupReply = z.infer<typeof lookupSchema>

/** POST /worker-profile/register */
export const registerReplySchema = z.object({ id: z.string() })

/** POST /worker-profile/call answers 202 with the profile it is calling for. */
export const callReplySchema = z.object({ profile_id: z.string() })

/** The call fills the profile in once it ends. A name plus at least one detail means the answers have arrived. */
export function isFilledByCall(p: BackendProfile): boolean {
  const named = (p.name ?? '').trim().length >= 2
  const detail = p.sectors.length > 0 || p.skills.length > 0 || p.experience !== null || p.expected_pay !== null || !!p.home_place
  return named && detail
}

export function maskPhone(phone: string): string {
  return `+91 ${phone.slice(0, 2)}•••••${phone.slice(-3)}`
}

/** The backend stores one daily wage; a monthly figure is turned into a daily one. */
export const toDailyPay = (pay: { amount: number; type: 'daily' | 'monthly' }): number =>
  pay.type === 'monthly' ? Math.round(pay.amount / DAYS_PER_MONTH) : pay.amount

type Fields = Partial<Omit<Worker, 'id' | 'phoneMasked' | 'skills'>> & { language?: 'hi' | 'mr' | 'en' }

/** App fields to the PATCH body (without the id). Only the fields that are present are sent. */
export function toBackendFields(fields: Fields): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (fields.name !== undefined) body.name = fields.name
  if (fields.sectors !== undefined) body.sectors = fields.sectors
  if (fields.experienceYears !== undefined) body.experience = fields.experienceYears
  if (fields.expectedPay !== undefined) {
    body.expected_pay = toDailyPay(fields.expectedPay)
    // The monthly figure is kept as typed, so it is shown back as monthly. A daily figure clears it.
    body.monthly_pay = fields.expectedPay.type === 'monthly' ? fields.expectedPay.amount : null
  }
  if (fields.language !== undefined) body.language = fields.language
  if (fields.homePlace !== undefined) body.home_place = fields.homePlace
  if (fields.willingToRelocate !== undefined) body.willing_to_relocate = fields.willingToRelocate
  if (fields.age !== undefined) body.age = fields.age
  if (fields.workMode !== undefined) body.work_mode = fields.workMode
  if (fields.livesOnSite !== undefined) body.lives_on_site = fields.livesOnSite
  return body
}

export const registerToFields = (body: RegisterBody): Fields => ({
  name: body.name,
  sectors: body.sectors,
  experienceYears: body.experienceYears,
  expectedPay: body.expectedPay,
  homePlace: body.homePlace,
  willingToRelocate: body.willingToRelocate,
  age: body.age,
  workMode: body.workMode,
  livesOnSite: body.livesOnSite,
  language: body.language,
})

export const patchToFields = (patch: WorkerPatch): Fields => patch

/** Backend profile to the app's Worker. Missing values get safe defaults; unknown sectors are dropped. */
export function toWorker(p: BackendProfile): Worker {
  const sectors = p.sectors.flatMap((s) => {
    const parsed = sectorIdSchema.safeParse(s.trim().toLowerCase())
    return parsed.success ? [parsed.data] : []
  })
  const mode = workModeSchema.safeParse(p.work_mode)
  return {
    id: p.id,
    name: p.name ?? '',
    phoneMasked: maskPhone(p.phone_number),
    sectors,
    skills: p.skills.map((s) => ({ hi: s, mr: s, en: s })),
    experienceYears: p.experience ?? 0,
    expectedPay: p.monthly_pay ? { amount: p.monthly_pay, type: 'monthly' } : { amount: p.expected_pay ?? 0, type: 'daily' },
    homePlace: p.home_place ?? '',
    willingToRelocate: p.willing_to_relocate ?? false,
    // The backend returns 0 for "unknown" in some rows.
    age: p.age && p.age > 0 ? p.age : null,
    workMode: mode.success ? mode.data : 'daily',
    livesOnSite: p.lives_on_site ?? false,
  }
}
