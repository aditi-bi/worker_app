import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/endpoints'
import type { Area, Sector } from '@/api/types'
import { readStorage, writeStorage } from '@/lib/storage'

/**
 * Areas and sectors change rarely. They are cached on the phone so the area
 * name and category chips still show when the worker opens the app offline.
 */
function useCachedReference<T>(key: string, fetcher: (signal?: AbortSignal) => Promise<T>) {
  return useQuery({
    queryKey: ['reference', key],
    queryFn: async ({ signal }) => {
      const data = await fetcher(signal)
      writeStorage(`ref:${key}`, data)
      return data
    },
    initialData: () => readStorage<T | undefined>(`ref:${key}`, undefined),
    initialDataUpdatedAt: 0, // treat stored data as stale so it refreshes in the background
    staleTime: 60 * 60 * 1000,
  })
}

export function useAreas() {
  return useCachedReference<Area[]>('areas', api.listAreas)
}

export function useSectors() {
  return useCachedReference<Sector[]>('sectors', api.listSectors)
}
