import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '@/api/client'
import { clearToken, getToken, setToken } from './tokenStore'

interface Auth {
  /** true when this phone holds a profile token (the worker finished the voice or tapped profile). */
  signedIn: boolean
  signIn: (token: string) => void
  signOut: () => void
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState<string | null>(() => getToken())

  const signIn = useCallback((next: string) => {
    setToken(next)
    setTokenState(next)
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    setTokenState(null)
    queryClient.clear()
  }, [queryClient])

  // If the server no longer knows this token, the worker simply goes back to browsing as a guest.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken()
      setTokenState(null)
      queryClient.clear()
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const value = useMemo(() => ({ signedIn: token !== null, signIn, signOut }), [token, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
