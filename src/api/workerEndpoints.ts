import { z } from "zod";
import { getToken, setToken } from "@/features/auth/tokenStore";
import { getContact } from "@/features/applications/localStore";
import { PROFILE_API_BASE, apiRequest, profileIsReal } from "./client";
import {
  findJob,
  jobsForMePage,
  loadJobs,
  ratesFromJobs,
  realJobsEnabled,
} from "./realJobs";
import { ApiError } from "./errors";
import {
  callReplySchema,
  isFilledByCall,
  lookupSchema,
  registerReplySchema,
  registerToFields,
  patchToFields,
  toBackendFields,
  toWorker,
} from "./profileContract";
import {
  applicationListSchema,
  applicationSchema,
  fullJobPageSchema,
  fullJobSchema,
  hisaabEntrySchema,
  hisaabListSchema,
  ratesSchema,
  type LiveLocation,
  type RegisterBody,
  type Worker,
  type WorkerPatch,
} from "./workerTypes";

export const FOR_ME_PAGE_SIZE = 6;

const okSchema = z.unknown();

const profileAuth = {
  bearer: (import.meta.env.VITE_PROFILE_API_TOKEN ?? "").trim() || null,
  base: PROFILE_API_BASE,
};

/** One profile PATCH (the backend answers { success: true }). */
const patchProfile = (id: string, fields: Record<string, unknown>) =>
  apiRequest("/worker-profile", {
    method: "PATCH",
    body: { id, ...fields },
    schema: okSchema,
    ...profileAuth,
  });

const lookupProfile = (phone: string, signal?: AbortSignal) =>
  apiRequest("/worker-profile", {
    query: { phone_number: phone },
    schema: lookupSchema,
    signal,
    ...profileAuth,
  });

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The profile id to edit. With the real backend it must be the profile's UUID. A token left over from the sample data
 * (it starts with "w_") is replaced by the real id, found from the phone number, so the worker never has to start over.
 */
async function currentProfileId(): Promise<string> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized");
  if (!profileIsReal() || UUID_SHAPE.test(token)) return token;
  const phone = getContact()?.phone;
  if (!phone) throw new ApiError("unauthorized");
  const found = await lookupProfile(phone);
  if (!found.found) throw new ApiError("not_found");
  setToken(found.id);
  return found.id;
}

async function readProfile(signal?: AbortSignal): Promise<Worker> {
  const phone = getContact()?.phone;
  if (!phone) throw new ApiError("not_found");
  const reply = await lookupProfile(phone, signal);
  if (!reply.found) throw new ApiError("not_found");
  return toWorker(reply);
}

export interface ProfileCheck {
  id: string;
  worker: Worker;
  /** true once the details are on the profile (the call has ended and the answers arrived). */
  filled: boolean;
}

/** Profile endpoints, as the backend's /worker-profile routes. The session token kept on the phone is the profile id. */
export const workerApi = {
  /**
   * Create the profile, then fill it: POST /worker-profile/register, then PATCH /worker-profile.
   * If the number already has a profile (409) that profile is read and updated instead.
   */
  register: async (body: RegisterBody) => {
    let id: string;
    try {
      id = (
        await apiRequest("/worker-profile/register", {
          method: "POST",
          body: { phone_number: body.phone, type: "worker" },
          schema: registerReplySchema,
          ...profileAuth,
        })
      ).id;
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind !== "conflict")
        throw error;
      const existing = await lookupProfile(body.phone);
      if (!existing.found) throw error;
      id = existing.id;
    }
    await patchProfile(id, toBackendFields(registerToFields(body)));
    return { token: id };
  },

  /**
   * POST /worker-profile/call: Sarvam rings this number and asks the profile questions. When the call ends the backend
   * fills the profile. A 409 means a call was started a few minutes ago; the profile is looked up and the app waits for it.
   */
  requestCall: async (
    phone: string,
  ): Promise<{ profileId: string; alreadyCalling: boolean }> => {
    try {
      const reply = await apiRequest("/worker-profile/call", {
        method: "POST",
        body: { phone_number: phone },
        schema: callReplySchema,
        ...profileAuth,
      });
      return { profileId: reply.profile_id, alreadyCalling: false };
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind !== "conflict")
        throw error;
      const existing = await lookupProfile(phone);
      if (!existing.found) throw error;
      return { profileId: existing.id, alreadyCalling: true };
    }
  },

  /** GET /worker-profile?phone_number= for a number typed in the app. null = no profile yet. */
  checkProfile: async (
    phone: string,
    signal?: AbortSignal,
  ): Promise<ProfileCheck | null> => {
    const reply = await lookupProfile(phone, signal);
    return reply.found
      ? { id: reply.id, worker: toWorker(reply), filled: isFilledByCall(reply) }
      : null;
  },

  /** GET /worker-profile?phone_number= (the number is kept on this phone) */
  getMe: (signal?: AbortSignal) => readProfile(signal),
  /** PATCH /worker-profile, then read the profile back. The phone number cannot be changed. */
  updateMe: async (patch: WorkerPatch) => {
    const fields = toBackendFields(patchToFields(patch));
    if (Object.keys(fields).length > 0) await patchProfile(await currentProfileId(), fields);
    return readProfile();
  },

  /** GET /jobs/for-me - full detail, matched to the worker's trade and area */
  listJobsForMe: async (
    params: { areaId: string; page: number },
    signal?: AbortSignal,
  ) => {
    if (realJobsEnabled()) {
      const [jobs, worker] = await Promise.all([
        loadJobs(signal),
        readProfile(signal).catch(() => null),
      ]);
      return jobsForMePage(jobs, worker, params, FOR_ME_PAGE_SIZE);
    }
    return apiRequest("/jobs/for-me", {
      schema: fullJobPageSchema,
      signal,
      query: {
        area: params.areaId,
        page: params.page,
        page_size: FOR_ME_PAGE_SIZE,
      },
    });
  },
  /** GET /jobs/{id} */
  getJob: async (id: string, signal?: AbortSignal) => {
    if (realJobsEnabled()) {
      const [jobs, worker] = await Promise.all([
        loadJobs(signal),
        readProfile(signal).catch(() => null),
      ]);
      const job = findJob(jobs, id, worker);
      if (!job) throw new ApiError("not_found");
      return job;
    }
    return apiRequest(`/jobs/${id}`, { schema: fullJobSchema, signal });
  },

  /** POST /applications */
  apply: (body: { jobId: string; note?: string; location?: LiveLocation }) =>
    apiRequest("/applications", {
      method: "POST",
      body,
      schema: applicationSchema,
    }),
  /** GET /applications */
  listApplications: (signal?: AbortSignal) =>
    apiRequest("/applications", { schema: applicationListSchema, signal }),
  /** POST /applications/{id}/withdraw */
  withdraw: (id: string) =>
    apiRequest(`/applications/${id}/withdraw`, {
      method: "POST",
      schema: applicationSchema,
    }),

  /** GET /hisaab?month=YYYY-MM */
  listHisaab: (month: string, signal?: AbortSignal) =>
    apiRequest("/hisaab", {
      schema: hisaabListSchema,
      signal,
      query: { month },
    }),
  /** POST /hisaab */
  addHisaab: (body: { date: string; place: string; amount: number }) =>
    apiRequest("/hisaab", { method: "POST", body, schema: hisaabEntrySchema }),
  /** DELETE /hisaab/{id} */
  removeHisaab: (id: string) =>
    apiRequest(`/hisaab/${id}`, { method: "DELETE", schema: okSchema }),

  /** GET /rates?area= - open to guests too */
  getRates: async (areaId: string, signal?: AbortSignal) =>
    realJobsEnabled()
      ? ratesFromJobs(await loadJobs(signal), areaId)
      : apiRequest("/rates", {
          schema: ratesSchema,
          signal,
          query: { area: areaId },
        }),
};
