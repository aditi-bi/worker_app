import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ApiError } from '@/api/errors'
import { AuthProvider } from '@/features/auth/AuthContext'
import { PreferencesProvider } from '@/features/preferences/PreferencesContext'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Try the request even if the browser thinks it is offline (it is often wrong on weak networks).
        networkMode: 'offlineFirst',
        retry: (failureCount, error) => failureCount < 1 && !(error instanceof ApiError && !error.retryAllowed),
        retryDelay: 700,
        refetchOnWindowFocus: false,
        staleTime: 60 * 1000,
      },
    },
  })
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient)
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <PreferencesProvider>{children}</PreferencesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  )
}
