import { ApiError } from './errors'
import type { LiveLocation } from './workerTypes'

/**
 * Applications are not sent to the FastAPI backend. They go to a Google Apps Script web app that adds a row to a
 * Google Sheet. Set VITE_APPLY_SCRIPT_URL to switch this on; when it is empty the normal /applications API is used.
 */
export const getApplyScriptUrl = (): string => (import.meta.env.VITE_APPLY_SCRIPT_URL ?? '').trim()
export const sheetEnabled = (): boolean => getApplyScriptUrl() !== ''

export interface SheetApplyBody {
  /** Made on the phone so the phone's list and the sheet row share one id. */
  applicationId: string
  jobId: string
  jobTitle: string
  employer: string
  workerName: string
  /** 10 digits, no +91. */
  phone: string
  note?: string
  location?: LiveLocation
}

interface SheetReply {
  ok: boolean
  code?: string
}

/**
 * Apps Script cannot answer with 409 or 401 and it ignores request headers, so the answer is read from the body.
 * The body is sent as text/plain on purpose: that is a "simple" request, so the browser makes no preflight call
 * (Apps Script cannot answer one).
 */
async function post(payload: Record<string, unknown>): Promise<SheetReply> {
  let response: Response
  try {
    response = await fetch(getApplyScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ApiError('network')
  }
  if (!response.ok) throw new ApiError('server', { status: response.status })
  let reply: SheetReply
  try {
    reply = (await response.json()) as SheetReply
  } catch {
    throw new ApiError('invalid_response', { status: response.status })
  }
  if (typeof reply !== 'object' || reply === null || typeof reply.ok !== 'boolean') throw new ApiError('invalid_response', { status: response.status })
  if (reply.ok) return reply
  if (reply.code === 'already_applied') throw new ApiError('conflict', { code: reply.code })
  if (reply.code === 'busy') throw new ApiError('server', { code: reply.code })
  throw new ApiError('unknown', { code: reply.code })
}

export const applySheet = {
  /** Adds one row. Throws a 'conflict' ApiError when this worker already applied to this job. */
  submit: (body: SheetApplyBody): Promise<SheetReply> => post({ action: 'apply', ...body }),
  /** Sets the row's status to withdrawn. */
  withdraw: (applicationId: string): Promise<SheetReply> => post({ action: 'withdraw', applicationId }),
}
