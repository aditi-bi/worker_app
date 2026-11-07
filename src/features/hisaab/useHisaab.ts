import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workerApi } from '@/api/workerEndpoints'
import { useAuth } from '@/features/auth/AuthContext'

/** Work log for one month (YYYY-MM). */
export function useHisaab(month: string) {
  const { signedIn } = useAuth()
  return useQuery({ queryKey: ['hisaab', month], queryFn: ({ signal }) => workerApi.listHisaab(month, signal), enabled: signedIn })
}

export function useAddHisaab() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { date: string; place: string; amount: number }) => workerApi.addHisaab(body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['hisaab'] }),
  })
}

export function useRemoveHisaab() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workerApi.removeHisaab(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['hisaab'] }),
  })
}
