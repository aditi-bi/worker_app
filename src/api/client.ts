import type { z } from 'zod'
import { getToken } from '@/features/auth/tokenStore'
import { ApiError } from './errors'
import { apiErrorBodySchema } from './types'

/** Base URL of the FastAPI backend. Override with VITE_API_BASE_URL. */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

/**
 * Base URL of the profile routes (/worker-profile). Set VITE_PROFILE_API_URL to send ONLY the profile calls to the real backend
 * while everything else (jobs, hisaab, rates) stays on the mock. Empty = the same base as everything else.
 */
export const PROFILE_API_BASE: string = (import.meta.env.VITE_PROFILE_API_URL ?? '').trim().replace(/\/$/, '') || API_BASE_URL

/** true when the profile is handled by a real server while the rest may still be mocked. */
export const profileIsReal = (): boolean => PROFILE_API_BASE !== API_BASE_URL

type Query = Record<string, string | number | boolean | undefined | null>

function buildUrl(path: string, query?: Query, base: string = API_BASE_URL): string {
  const search = new URLSearchParams()
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return `${base}${path}${qs ? `?${qs}` : ''}`
}

let onUnauthorized: (() => void) | null = null

/** The auth provider registers one handler: any 401 on a signed-in request ends the session in one place. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

interface RequestOptions<S extends z.ZodType> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Query
  body?: unknown
  schema: S
  signal?: AbortSignal
  /** Use this bearer instead of the stored session token (null = send none). A 401 then does not end the session. */
  bearer?: string | null
  /** Use this base URL instead of VITE_API_BASE_URL. */
  base?: string
}

/**
 * The one place that talks to the network. It adds the session token when there is one
 * and reports an expired session through the registered handler.
 */
export async function apiRequest<S extends z.ZodType>(
  path: string,
  { method = 'GET', query, body, schema, signal, bearer, base }: RequestOptions<S>,
): Promise<z.infer<S>> {
  const token = bearer !== undefined ? bearer : getToken()
  let response: Response
  try {
    response = await fetch(buildUrl(path, query, base), {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('network')
  }

  if (!response.ok) {
    let code: string | undefined
    let retryAllowed: boolean | undefined
    try {
      const parsed = apiErrorBodySchema.safeParse(await response.json())
      if (parsed.success) {
        code = parsed.data.code
        retryAllowed = parsed.data.retry_allowed
      }
    } catch {
      /* body was not JSON */
    }
    if (response.status === 401 && token && bearer === undefined) onUnauthorized?.()
    const kind =
      response.status === 401
        ? 'unauthorized'
        : response.status === 404
          ? 'not_found'
          : response.status === 409
            ? 'conflict'
            : response.status === 429
              ? 'rate_limited'
              : response.status >= 500
                ? 'server'
                : 'unknown'
    throw new ApiError(kind, { status: response.status, code, retryAllowed })
  }

  const json: unknown = response.status === 204 ? null : await response.json()
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    if (import.meta.env.DEV) console.error('API response did not match the expected shape', parsed.error.issues)
    throw new ApiError('invalid_response', { status: response.status })
  }
  return parsed.data
}
