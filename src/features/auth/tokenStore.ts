import { readStorage, removeStorage, writeStorage } from '@/lib/storage'

const KEY = 'authToken'

/** The session token lives only in this small module so the API client and the auth provider share one source. */
export const getToken = (): string | null => readStorage<string | null>(KEY, null)
export const setToken = (token: string): void => writeStorage(KEY, token)
export const clearToken = (): void => removeStorage(KEY)
