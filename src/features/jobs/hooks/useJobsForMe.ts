import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { workerApi } from '@/api/workerEndpoints'
import { useAuth } from '@/features/auth/AuthContext'

/** Personalised jobs (full detail) for a signed-in worker in one area. */
export function useJobsForMe(areaId: string) {
  const { signedIn } = useAuth()
  return useInfiniteQuery({
    queryKey: ['jobs', 'forMe', areaId],
    queryFn: ({ pageParam, signal }) => workerApi.listJobsForMe({ areaId, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    enabled: signedIn && !!areaId,
  })
}

export function useJob(id: string | undefined) {
  const { signedIn } = useAuth()
  return useQuery({ queryKey: ['jobs', 'detail', id], queryFn: ({ signal }) => workerApi.getJob(id as string, signal), enabled: signedIn && !!id })
}
