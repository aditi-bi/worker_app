export type ApiErrorKind =
  | 'network'
  | 'server'
  | 'not_found'
  | 'rate_limited'
  | 'unauthorized'
  | 'conflict'
  | 'invalid_response'
  | 'unknown'

/** Single error type for everything the API layer throws, so screens can map it to a message. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code?: string
  readonly retryAllowed: boolean

  constructor(kind: ApiErrorKind, opts: { status?: number; code?: string; retryAllowed?: boolean; message?: string } = {}) {
    super(opts.message ?? kind)
    this.name = 'ApiError'
    this.kind = kind
    this.status = opts.status
    this.code = opts.code
    this.retryAllowed = opts.retryAllowed ?? (kind !== 'invalid_response' && kind !== 'unauthorized' && kind !== 'conflict')
  }
}

export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network'
}
