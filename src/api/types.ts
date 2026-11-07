/**
 * API contract for Phase 1 (guest browsing).
 *
 * These shapes are PROPOSED. Once the FastAPI `/openapi.json` is available they
 * should be replaced by (or checked against) the generated client types.
 * Responses are validated with zod at the edge so a mismatch fails loudly in
 * one place instead of breaking screens at random.
 */
import { z } from 'zod'

export const languageSchema = z.enum(['hi', 'mr', 'en'])

export const localizedTextSchema = z.object({ hi: z.string(), mr: z.string(), en: z.string() })

export const talukaSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
})

export const areaSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
  talukas: z.array(talukaSchema),
  /** Centre point of the district; used only for display/ordering, never for tracking. */
  lat: z.number(),
  lng: z.number(),
})
export type Area = z.infer<typeof areaSchema>
export type Taluka = z.infer<typeof talukaSchema>

export const sectorIdSchema = z.enum(['construction', 'loading', 'factory', 'hotel', 'domestic', 'farm'])
export type SectorId = z.infer<typeof sectorIdSchema>

export const sectorSchema = z.object({
  id: sectorIdSchema,
  name: localizedTextSchema,
})
export type Sector = z.infer<typeof sectorSchema>

export const wageSchema = z.object({
  min: z.number(),
  max: z.number(),
  type: z.enum(['daily', 'monthly']),
})
export type Wage = z.infer<typeof wageSchema>

/** What a worker who is NOT logged in may see. Nothing more. */
export const guestJobSchema = z.object({
  id: z.string(),
  title: localizedTextSchema,
  sector: sectorIdSchema,
  areaId: z.string(),
  talukaId: z.string().nullable(),
  wage: wageSchema,
  /** null when the source gives no posting date (the real job list has none). */
  postedAt: z.string().nullable(),
})
export type GuestJob = z.infer<typeof guestJobSchema>

export const guestJobPageSchema = z.object({
  items: z.array(guestJobSchema),
  total: z.number(),
  nextPage: z.number().nullable(),
})
export type GuestJobPage = z.infer<typeof guestJobPageSchema>

export const resolveAreaResponseSchema = z.object({
  area: areaSchema,
  talukaId: z.string().nullable(),
})
export type ResolveAreaResponse = z.infer<typeof resolveAreaResponseSchema>

export type SortOrder = 'newest' | 'pay'
export type WageTypeFilter = 'any' | 'daily' | 'monthly'
export type PostedWithin = 'any' | 'today' | 'week'

export interface JobFilters {
  sector: SectorId | 'all'
  sort: SortOrder
  wageType: WageTypeFilter
  posted: PostedWithin
}

export const DEFAULT_FILTERS: JobFilters = { sector: 'all', sort: 'newest', wageType: 'any', posted: 'any' }

/** Error body the backend should return (proposed; to confirm with the backend owner). */
export const apiErrorBodySchema = z.object({
  code: z.string(),
  message_key: z.string().optional(),
  retry_allowed: z.boolean().optional(),
})
