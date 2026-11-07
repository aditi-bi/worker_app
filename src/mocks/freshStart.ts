/**
 * Demo convenience (mock mode only): every new browser tab starts from the very first screen.
 * It clears everything the app saved (language, area, sign-in, mock data) once per tab; a reload
 * inside the same tab keeps your place. Must be the first import in main.tsx, before i18n reads storage.
 */
if (import.meta.env.VITE_USE_MOCKS === 'true') {
  try {
    if (!window.sessionStorage.getItem('phala:tabStarted')) {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith('phala:'))
        .forEach((key) => window.localStorage.removeItem(key))
      window.sessionStorage.setItem('phala:tabStarted', '1')
    }
  } catch {
    // Storage blocked: nothing to clear.
  }
}

export {}
