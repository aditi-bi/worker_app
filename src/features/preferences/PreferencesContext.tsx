import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import i18n, { getStoredLanguage, type Language } from '@/i18n'
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '@/lib/storage'

export interface SelectedArea {
  areaId: string
  talukaId: string | null
  /** How the area was chosen. We never store coordinates. */
  source: 'gps' | 'manual'
}

interface Preferences {
  /** null until the worker has chosen a language on the first screen. */
  language: Language | null
  setLanguage: (language: Language) => void
  area: SelectedArea | null
  setArea: (area: SelectedArea) => void
  clearArea: () => void
  /** true when the worker chose to browse jobs without making a profile. */
  profileSkipped: boolean
  setProfileSkipped: (skipped: boolean) => void
  /** Job the worker tapped before having a profile; they return to it once the profile is made. */
  pendingJobId: string | null
  setPendingJobId: (id: string | null) => void
}

const PreferencesContext = createContext<Preferences | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language | null>(() => getStoredLanguage())
  const [area, setAreaState] = useState<SelectedArea | null>(() => readStorage<SelectedArea | null>(STORAGE_KEYS.area, null))
  const [profileSkipped, setSkippedState] = useState<boolean>(() => readStorage<boolean>(STORAGE_KEYS.profileSkipped, false))
  const [pendingJobId, setPendingState] = useState<string | null>(() => readStorage<string | null>(STORAGE_KEYS.pendingJob, null))

  useEffect(() => {
    const active = language ?? 'hi'
    void i18n.changeLanguage(active)
    document.documentElement.lang = active
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    writeStorage(STORAGE_KEYS.language, next)
    setLanguageState(next)
  }, [])

  const setArea = useCallback((next: SelectedArea) => {
    writeStorage(STORAGE_KEYS.area, next)
    setAreaState(next)
  }, [])

  const clearArea = useCallback(() => {
    removeStorage(STORAGE_KEYS.area)
    setAreaState(null)
  }, [])

  const setProfileSkipped = useCallback((skipped: boolean) => {
    if (skipped) writeStorage(STORAGE_KEYS.profileSkipped, true)
    else removeStorage(STORAGE_KEYS.profileSkipped)
    setSkippedState(skipped)
  }, [])

  const setPendingJobId = useCallback((id: string | null) => {
    if (id) writeStorage(STORAGE_KEYS.pendingJob, id)
    else removeStorage(STORAGE_KEYS.pendingJob)
    setPendingState(id)
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage, area, setArea, clearArea, profileSkipped, setProfileSkipped, pendingJobId, setPendingJobId }),
    [language, setLanguage, area, setArea, clearArea, profileSkipped, setProfileSkipped, pendingJobId, setPendingJobId],
  )
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): Preferences {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}

/** Language that is safe to use for rendering (defaults to Hindi before a choice is made). */
export function useLanguage(): Language {
  return usePreferences().language ?? 'hi'
}
