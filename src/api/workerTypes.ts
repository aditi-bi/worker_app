/**
 * API contract for the profile part of the app (profile, personalised jobs,
 * applications, hisaab, rates). PROPOSED shapes - check against the FastAPI OpenAPI file
 * before wiring the real backend. Everything is validated with zod at the edge.
 */
import { z } from 'zod'
import { guestJobSchema, localizedTextSchema, sectorIdSchema } from './types'

export const expectedPaySchema = z.object({ amount: z.number(), type: z.enum(['daily', 'monthly']) })
export type ExpectedPay = z.infer<typeof expectedPaySchema>

/* ---------- creating a profile ---------- */

export const workModeSchema = z.enum(['daily', 'contract', 'permanent'])
export type WorkMode = z.infer<typeof workModeSchema>

export const PHONE_PATTERN = /^[6-9]\d{9}$/

/** Sent once when the worker finishes the voice (or tapped) profile. No verification call is involved. */
export const registerBodySchema = z.object({
  name: z.string().min(2),
  sectors: z.array(sectorIdSchema).min(1),
  experienceYears: z.number().min(0).max(60),
  expectedPay: expectedPaySchema,
  phone: z.string().regex(PHONE_PATTERN),
  /** Village or district the worker calls home. */
  homePlace: z.string().min(2),
  willingToRelocate: z.boolean(),
  /** null when the worker chose not to say. */
  age: z.number().min(14).max(80).nullable(),
  workMode: workModeSchema,
  /** true when the worker lives at the work site while working. */
  livesOnSite: z.boolean(),
  /** The worker agreed that employers may call this number about jobs they apply for. */
  consent: z.literal(true),
  language: z.enum(['hi', 'mr', 'en']),
})
export type RegisterBody = z.infer<typeof registerBodySchema>

/** The device token. Kept on the phone so the profile can be read and edited later. */
export const sessionSchema = z.object({ token: z.string() })

/* ---------- worker profile ---------- */

export const workerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneMasked: z.string(),
  sectors: z.array(sectorIdSchema),
  skills: z.array(localizedTextSchema),
  experienceYears: z.number(),
  expectedPay: expectedPaySchema,
  homePlace: z.string(),
  willingToRelocate: z.boolean(),
  age: z.number().nullable(),
  workMode: workModeSchema,
  livesOnSite: z.boolean(),
})
export type Worker = z.infer<typeof workerSchema>
export type WorkerPatch = Partial<Pick<Worker, 'name' | 'sectors' | 'experienceYears' | 'expectedPay' | 'homePlace' | 'willingToRelocate' | 'age' | 'workMode' | 'livesOnSite'>>

/* ---------- jobs for a worker with a profile ---------- */

export const payCycleSchema = z.enum(['daily', 'weekly', 'monthly'])

export const fullJobSchema = guestJobSchema.extend({
  employer: z.object({ name: z.string() }),
  distanceKm: z.number().nullable(),
  /** Why this job was picked for the worker, e.g. their trade. Null when it is just nearby. */
  matchReason: localizedTextSchema.nullable(),
  stay: localizedTextSchema.nullable(),
  hours: localizedTextSchema.nullable(),
  gear: localizedTextSchema.nullable(),
  payCycle: payCycleSchema,
  starts: localizedTextSchema.nullable(),
  /** Where the work is, in the employer's words, when the source gives it. */
  address: z.string().nullable().optional(),
  durationWeeks: z.number().nullable(),
  applied: z.boolean(),
})
export type FullJob = z.infer<typeof fullJobSchema>

export const fullJobPageSchema = z.object({ items: z.array(fullJobSchema), total: z.number(), nextPage: z.number().nullable() })

/* ---------- applications ---------- */

export const applicationStatusSchema = z.enum(['sent', 'seen', 'shortlisted', 'not_selected', 'hired', 'withdrawn'])
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>
export const ACTIVE_STATUSES: ApplicationStatus[] = ['sent', 'seen', 'shortlisted', 'hired']

export const applicationSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  status: applicationStatusSchema,
  appliedAt: z.string(),
  job: guestJobSchema.pick({ title: true, sector: true, areaId: true, talukaId: true, wage: true }),
})
export type Application = z.infer<typeof applicationSchema>
export const applicationListSchema = z.object({ items: z.array(applicationSchema) })

/* ---------- hisaab (personal work and pay log) ---------- */

export const hisaabEntrySchema = z.object({
  id: z.string(),
  /** YYYY-MM-DD */
  date: z.string(),
  place: z.string(),
  amount: z.number(),
})
export type HisaabEntry = z.infer<typeof hisaabEntrySchema>
export const hisaabListSchema = z.object({ items: z.array(hisaabEntrySchema) })

/* ---------- rates ---------- */

export const ratesSchema = z.object({
  areaId: z.string(),
  /** false = sample figures only. The UI shows a warning until the data is checked. */
  verified: z.boolean(),
  /** true when the figures are worked out from the listed jobs instead of a rates source. */
  fromJobs: z.boolean().optional(),
  items: z.array(z.object({ id: z.string(), name: localizedTextSchema, min: z.number(), max: z.number() })),
})
export type Rates = z.infer<typeof ratesSchema>

/** Where the worker was when they tapped apply. Sent with that one application; never kept on the phone after it is sent. */
export interface LiveLocation {
  lat: number
  lng: number
  capturedAt: string
}
