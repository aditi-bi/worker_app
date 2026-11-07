import { z } from "zod";
import { apiRequest } from "./client";
import { guestPage, loadJobs, realJobsEnabled } from "./realJobs";
import {
  areaSchema,
  guestJobPageSchema,
  resolveAreaResponseSchema,
  sectorSchema,
  type JobFilters,
} from "./types";

/**
 * Phase 1 endpoints. Paths are PLACEHOLDERS until checked against the
 * FastAPI OpenAPI file (see the "API integration plan" in the spec).
 */
export const PAGE_SIZE = 5;

export const api = {
  /** GET /areas - districts with talukas, labels in hi/mr/en */
  listAreas: (signal?: AbortSignal) =>
    apiRequest("/areas", { schema: z.array(areaSchema), signal }),

  /** GET /sectors - the six work categories */
  listSectors: (signal?: AbortSignal) =>
    apiRequest("/sectors", { schema: z.array(sectorSchema), signal }),

  /** POST /areas/resolve - latitude/longitude -> district (+ taluka) */
  resolveArea: (coords: { lat: number; lng: number }, signal?: AbortSignal) =>
    apiRequest("/areas/resolve", {
      method: "POST",
      body: coords,
      schema: resolveAreaResponseSchema,
      signal,
    }),

  /** GET /jobs/public - limited fields only; the server must enforce that, not the app */
  listGuestJobs: async (
    params: { areaId: string; filters: JobFilters; page: number },
    signal?: AbortSignal,
  ) =>
    realJobsEnabled()
      ? guestPage(await loadJobs(signal), params, PAGE_SIZE)
      : apiRequest("/jobs/public", {
          schema: guestJobPageSchema,
          signal,
          query: {
            area: params.areaId,
            sector:
              params.filters.sector === "all"
                ? undefined
                : params.filters.sector,
            sort: params.filters.sort,
            wage_type:
              params.filters.wageType === "any"
                ? undefined
                : params.filters.wageType,
            posted_within:
              params.filters.posted === "any"
                ? undefined
                : params.filters.posted,
            page: params.page,
            page_size: PAGE_SIZE,
          },
        }),
};
