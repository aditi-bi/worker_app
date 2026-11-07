import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { usePendingApplicationsSync } from '@/features/applications/useApplications'
import { usePreferences } from '@/features/preferences/PreferencesContext'

/** First-run order: language -> location permission (or choose area) -> Phala's questions (or skip) -> jobs. Anyone missing a step is sent back to it. */
export function RequireLanguage() {
  const { language } = usePreferences()
  return language ? <Outlet /> : <Navigate to="/language" replace />
}

export function RequireArea() {
  const { area } = usePreferences()
  return area ? <Outlet /> : <Navigate to="/location" replace />
}

/** Pages that need a profile. A worker without one is sent to Jobs, where the "tell Phala about you" sheet opens. */
export function RequireSession() {
  const { signedIn } = useAuth()
  return signedIn ? <Outlet /> : <Navigate to="/jobs" replace state={{ needProfile: true }} />
}

export function HomeRedirect() {
  const { language, area, profileSkipped } = usePreferences()
  const { signedIn } = useAuth()
  if (!language) return <Navigate to="/language" replace />
  if (!area) return <Navigate to="/location" replace />
  if (!signedIn && !profileSkipped) return <Navigate to="/talk" replace />
  return <Navigate to="/jobs" replace />
}

/** Wraps every route and sends any saved applications once the phone is online. */
export function RootLayout() {
  usePendingApplicationsSync()
  // A new screen always opens at its top, not where the previous list was scrolled to.
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return <Outlet />
}
