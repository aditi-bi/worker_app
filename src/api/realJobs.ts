/**
 * Jobs from the real job list (VITE_JOBS_API_URL, GET /api/jobs/). The list has no title, wage type, place or posting
 * date as separate fields and some rows are wrong, so this file is the one place that turns it into the app's jobs:
 *  - the title, employer, place, wage type and pay cycle are read from the description text,
 *  - company_name is NOT used (from job 509 on it belongs to another row); the "Hiring Entity" line is,
 *  - the work type is worked out from the words of the job, not from the category,
 *  - jobs without a wage or description are left out,
 *  - the list is filtered, sorted and matched to the worker on the phone.
 */
import { z } from "zod";
import { AREAS } from "@/mocks/fixtures/areas";
import { SECTORS } from "@/mocks/fixtures/sectors";
import { L } from "@/lib/localized";
import { apiRequest } from "./client";
import { ApiError } from "./errors";
import type { GuestJob, JobFilters, SectorId, Wage } from "./types";
import type { FullJob, Rates, Worker } from "./workerTypes";

export const JOBS_BASE: string = (import.meta.env.VITE_JOBS_API_URL ?? "")
  .trim()
  .replace(/\/$/, "");
export const realJobsEnabled = (): boolean => JOBS_BASE !== "";

const DAYS_PER_MONTH = 26;
const DAY_MS = 24 * 3600 * 1000;

const rawJobSchema = z.object({
  job_id: z.number(),
  district_name: z.string().nullish(),
  min_wage: z.union([z.string(), z.number()]).nullish(),
  max_wage: z.union([z.string(), z.number()]).nullish(),
  is_active: z.boolean().nullish(),
  job_description: z.string().nullish(),
});
export const rawJobListSchema = z.object({
  total_jobs: z.number().optional(),
  jobs: z.array(rawJobSchema),
});
export type RawJob = z.infer<typeof rawJobSchema>;

/** A job in the app's shapes, plus the numbers the list is sorted by. */
export interface ParsedJob {
  guest: GuestJob;
  employer: string;
  address: string | null;
  payCycle: FullJob["payCycle"];
  stay: string | null;
  gear: string | null;
}

/* ---------- reading the description ---------- */

function field(description: string, label: string): string | null {
  const match = new RegExp(`^${label}:\\s*(.+)$`, "im").exec(description);
  return match ? match[1].trim() : null;
}

const num = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Work type from the words of the job. Order matters: the first group that matches wins. */
const SECTOR_WORDS: Array<[SectorId, RegExp]> = [
  ["hotel", /kitchen|scullery|catering|banquet|hotel|canteen|\bcook/],
  ["domestic", /laundry|housekeeping|society|domestic|maid/],
  ["farm", /sugarcane|\bcane\b|cotton|harvest|\bfarm|orchard|fertili[sz]er/],
  [
    "construction",
    /mason|mistri|beldar|brick|kiln|bar bender|rebar|shuttering|formwork|centering|scaffold|plumb|trench|excavat|earthwork|concret|road |canal|demolition|construction|tile|plaster|waterproof|well |septic|quarry|stone|roofing|\bpeb\b|rigger|sanitary/,
  ],
  [
    "loading",
    /load|hammal|packer|picker|stack|godown|warehouse|pallet|carton|\bsack|bale|logistic|porter|dock|cargo|lashing|head-load|crate|drum|tipping|material handl/,
  ],
  [
    "factory",
    /weld|fabricat|grind|machine|press|foundry|plant|\bmill\b|assembly|boiler|mould|vulcani|tyre|loom|\bdie\b|furnace|factory|helper|operator/,
  ],
];

export function sectorOf(text: string): SectorId {
  const lower = text.toLowerCase();
  for (const [sector, words] of SECTOR_WORDS)
    if (words.test(lower)) return sector;
  return "factory";
}

/** Areas the list uses, by district name. */
const DISTRICT_AREA: Record<string, string> = {
  "mumbai city": "mumbai",
  "mumbai suburban": "mumbai",
  thane: "thane",
  palghar: "palghar",
  pune: "pune",
  nashik: "nashik",
  "chhatrapati sambhajinagar": "sambhajinagar",
  latur: "latur",
  beed: "beed",
  nanded: "nanded",
  nagpur: "nagpur",
  raigad: "raigad",
  solapur: "solapur",
  chandrapur: "chandrapur",
  satara: "satara",
  jalgaon: "jalgaon",
  kolhapur: "kolhapur",
  ratnagiri: "ratnagiri",
};

export function areaOfDistrict(name: string | null | undefined): string | null {
  return DISTRICT_AREA[(name ?? "").trim().toLowerCase()] ?? null;
}

function talukaOf(areaId: string, place: string | null): string | null {
  if (!place) return null;
  const lower = place.toLowerCase();
  const area = AREAS.find((a) => a.id === areaId);
  return (
    area?.talukas.find((x) => lower.includes(x.name.en.toLowerCase()))?.id ??
    null
  );
}

/** The list's wage numbers are per day or per month; the description says which. Without it, small figures are daily. */
function wageOf(raw: RawJob, description: string): Wage | null {
  const min = num(raw.min_wage);
  const max = num(raw.max_wage);
  if (min === null && max === null) return null;
  const low = min ?? (max as number);
  const high = max ?? (min as number);
  const pay = (
    field(description, "Prevailing Compensation") ?? ""
  ).toLowerCase();
  const type = /\/\s*(day|daily)|per day/.test(pay)
    ? "daily"
    : /\/\s*month|per month/.test(pay)
      ? "monthly"
      : high < 3000
        ? "daily"
        : "monthly";
  return { min: Math.min(low, high), max: Math.max(low, high), type };
}

function payCycleOf(description: string, wage: Wage): FullJob["payCycle"] {
  const pay = (
    field(description, "Prevailing Compensation") ?? ""
  ).toLowerCase();
  if (pay.includes("weekly")) return "weekly";
  return wage.type === "monthly" ? "monthly" : "daily";
}

/** One list row to the app's job. null = the row cannot be shown (inactive, no description or wage, unknown area). */
export function parseJob(raw: RawJob): ParsedJob | null {
  if (raw.is_active === false) return null;
  const description = (raw.job_description ?? "").trim();
  if (!description) return null;
  const role = field(description, "Trade / Role");
  const areaId = areaOfDistrict(raw.district_name);
  const wage = wageOf(raw, description);
  if (!role || !areaId || !wage) return null;

  const place = field(description, "Work Location / Area");
  const pay = field(description, "Prevailing Compensation") ?? "";
  const classification = field(description, "Skill Classification") ?? "";
  return {
    guest: {
      id: String(raw.job_id),
      title: L(role, role, role),
      sector: sectorOf(`${role} ${classification}`),
      areaId,
      talukaId: talukaOf(areaId, place),
      wage,
      postedAt: null,
    },
    employer: field(description, "Hiring Entity") ?? "",
    address: place,
    payCycle: payCycleOf(description, wage),
    stay: /\b(room|hostel|stay|accommodation)\b/i.test(pay) ? "Room" : null,
    gear: /gear|helmet|boots/i.test(pay) ? "Gear provided" : null,
  };
}

export function parseJobs(raws: RawJob[]): ParsedJob[] {
  const seen = new Set<string>();
  return raws.flatMap((raw) => {
    const job = parseJob(raw);
    if (!job || seen.has(job.guest.id)) return [];
    seen.add(job.guest.id);
    return [job];
  });
}

/* ---------- fetching (once, kept for a few minutes) ---------- */

const KEEP_MS = 5 * 60_000;
let cached: { at: number; jobs: Promise<ParsedJob[]> } | null = null;

export function resetJobsCache(): void {
  cached = null;
}

export function loadJobs(signal?: AbortSignal): Promise<ParsedJob[]> {
  if (cached && Date.now() - cached.at < KEEP_MS) return cached.jobs;
  const jobs = apiRequest("/api/jobs/", {
    schema: rawJobListSchema,
    base: JOBS_BASE,
    bearer: null,
    signal,
  })
    .then((list) => parseJobs(list.jobs))
    .catch((error: unknown) => {
      cached = null;
      throw error instanceof ApiError ? error : new ApiError("network");
    });
  cached = { at: Date.now(), jobs };
  return jobs;
}

/* ---------- what the screens ask for ---------- */

const monthlyTop = (wage: Wage) =>
  wage.type === "daily" ? wage.max * DAYS_PER_MONTH : wage.max;
const newest = (a: GuestJob, b: GuestJob) => Number(b.id) - Number(a.id); // the list has no dates: a higher id is a newer job

function page<T>(list: T[], pageNumber: number, size: number) {
  const start = (Math.max(1, pageNumber) - 1) * size;
  return {
    items: list.slice(start, start + size),
    total: list.length,
    nextPage: start + size < list.length ? Math.max(1, pageNumber) + 1 : null,
  };
}

export function guestPage(
  jobs: ParsedJob[],
  params: { areaId: string; filters: JobFilters; page: number },
  size: number,
  now = Date.now(),
) {
  const { filters } = params;
  const within =
    filters.posted === "today"
      ? DAY_MS
      : filters.posted === "week"
        ? 7 * DAY_MS
        : Infinity;
  const list = jobs
    .map((j) => j.guest)
    .filter((j) => j.areaId === params.areaId)
    .filter((j) => filters.sector === "all" || j.sector === filters.sector)
    .filter(
      (j) => filters.wageType === "any" || j.wage.type === filters.wageType,
    )
    // No posting date is known, so a date filter cannot rule a job out.
    .filter(
      (j) =>
        j.postedAt === null || now - new Date(j.postedAt).getTime() <= within,
    )
    .sort(
      filters.sort === "pay"
        ? (a, b) => monthlyTop(b.wage) - monthlyTop(a.wage)
        : newest,
    );
  return page(list, params.page, size);
}

export function toFullJob(parsed: ParsedJob, worker: Worker | null): FullJob {
  const sectorName =
    SECTORS.find((s) => s.id === parsed.guest.sector)?.name ?? null;
  const matches = !!worker && worker.sectors.includes(parsed.guest.sector);
  return {
    ...parsed.guest,
    employer: { name: parsed.employer },
    address: parsed.address,
    distanceKm: null,
    matchReason: matches ? sectorName : null,
    stay: parsed.stay ? L(parsed.stay, parsed.stay, parsed.stay) : null,
    hours: null,
    gear: parsed.gear ? L(parsed.gear, parsed.gear, parsed.gear) : null,
    payCycle: parsed.payCycle,
    starts: null,
    durationWeeks: null,
    applied: false,
  };
}

/** Jobs in the worker's area that fit their trades; when none fit, every job in the area (as the mock did). */
export function jobsForMePage(
  jobs: ParsedJob[],
  worker: Worker | null,
  params: { areaId: string; page: number },
  size: number,
) {
  const inArea = jobs.filter((j) => j.guest.areaId === params.areaId);
  const fitting = worker
    ? inArea.filter((j) => worker.sectors.includes(j.guest.sector))
    : [];
  const list = (fitting.length > 0 ? fitting : inArea)
    .sort((a, b) => newest(a.guest, b.guest))
    .map((j) => toFullJob(j, worker));
  return page(list, params.page, size);
}

export function findJob(
  jobs: ParsedJob[],
  id: string,
  worker: Worker | null,
): FullJob | null {
  const found = jobs.find((j) => j.guest.id === id);
  return found ? toFullJob(found, worker) : null;
}

/* ---------- rates from the job list ---------- */

const MIN_JOBS_FOR_A_RATE = 3;
const round50 = (n: number) => Math.round(n / 50) * 50;
const dailyOf = (amount: number, wage: Wage) =>
  wage.type === "monthly" ? amount / DAYS_PER_MONTH : amount;

function quantile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const below = Math.floor(position);
  const above = Math.ceil(position);
  return sorted[below] + (sorted[above] - sorted[below]) * (position - below);
}

/**
 * Typical daily pay per work type in one district, from the jobs listed there: the low end is the lower quarter of the
 * listed minimums, the high end the upper quarter of the listed maximums. A work type with fewer than three jobs is left out.
 */
export function ratesFromJobs(jobs: ParsedJob[], areaId: string): Rates {
  const items = SECTORS.flatMap((sector) => {
    const wages = jobs
      .filter((j) => j.guest.areaId === areaId && j.guest.sector === sector.id)
      .map((j) => j.guest.wage);
    if (wages.length < MIN_JOBS_FOR_A_RATE) return [];
    const mins = wages.map((w) => dailyOf(w.min, w)).sort((a, b) => a - b);
    const maxs = wages.map((w) => dailyOf(w.max, w)).sort((a, b) => a - b);
    const min = round50(quantile(mins, 0.25));
    const max = Math.max(round50(quantile(maxs, 0.75)), min);
    return [{ id: sector.id, name: sector.name, min, max }];
  });
  return { areaId, verified: false, fromJobs: true, items };
}
