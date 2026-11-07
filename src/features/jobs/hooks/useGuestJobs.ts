import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/api/endpoints'
import type { JobFilters } from '@/api/types'

/** Paged guest job list for one area. Filtering and sorting happen on the server. */
export function useGuestJobs(areaId: string, filters: JobFilters) {
  return useInfiniteQuery({
    queryKey: ['jobs', 'public', areaId, filters],
    queryFn: ({ pageParam, signal }) => api.listGuestJobs({ areaId, filters, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  })
}
