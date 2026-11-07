import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workerApi } from '@/api/workerEndpoints'
import type { RegisterBody, WorkerPatch } from '@/api/workerTypes'
import { useAuth } from '@/features/auth/AuthContext'
import { patchContact, setContact } from '@/features/applications/localStore'

export const ME_KEY = ['me'] as const

/** The signed-in worker's profile. Disabled for guests. */
export function useMe() {
  const { signedIn } = useAuth()
  return useQuery({ queryKey: ME_KEY, queryFn: ({ signal }) => workerApi.getMe(signal), enabled: signedIn, staleTime: 5 * 60 * 1000 })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: WorkerPatch) => workerApi.updateMe(patch),
    onSuccess: (worker) => {
      queryClient.setQueryData(ME_KEY, worker)
      patchContact({ name: worker.name })
      // The personalised job list depends on trade and pay, so refresh it.
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'forMe'] })
    },
  })
}

/** Creates the profile (voice or tapped form). On success the phone keeps the token, so no login is needed. */
export function useRegister() {
  const { signIn } = useAuth()
  return useMutation({
    mutationFn: (body: RegisterBody) => workerApi.register(body),
    onSuccess: ({ token }, body) => {
      // The full number is kept on this phone only, for the application sheet.
      setContact({ name: body.name, phone: body.phone })
      signIn(token)
    },
    onError: (error) => console.error('Could not create the profile', error),
  })
}
