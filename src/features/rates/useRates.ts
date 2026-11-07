import { useQuery } from '@tanstack/react-query'
import { workerApi } from '@/api/workerEndpoints'

/** Wage reference for one district. Open to guests. */
export function useRates(areaId: string) {
  return useQuery({ queryKey: ['rates', areaId], queryFn: ({ signal }) => workerApi.getRates(areaId, signal), enabled: !!areaId })
}
