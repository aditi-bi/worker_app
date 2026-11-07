import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Icon } from '@/components/icons/Icon'
import { isOfflineError } from '@/api/errors'
import type { Area, GuestJob, JobFilters } from '@/api/types'
import { DEFAULT_FILTERS } from '@/api/types'
import { useOnline } from '@/hooks/useOnline'
import { cacheKey, loadJobCache, saveJobCache } from '../jobCache'
import { useGuestJobs } from '../hooks/useGuestJobs'
import { JobCard, JobCardSkeleton } from './JobCard'

interface JobListProps {
  area: Area | undefined
  areaId: string
  areaName: string
  filters: JobFilters
  onOpenJob: (job: GuestJob) => void
  onClearFilters: () => void
  onChangeArea: () => void
  /** Reports the total so the page title can show it. */
  onCount?: (total: number) => void
}

/** The guest list with every state: loading, empty, error, offline (saved list) and "show more". */
export function JobList({ area, areaId, areaName, filters, onOpenJob, onClearFilters, onChangeArea, onCount }: JobListProps) {
  const { t } = useTranslation()
  const online = useOnline()
  const query = useGuestJobs(areaId, filters)
  const key = cacheKey(areaId, filters)

  const pages = query.data?.pages
  const jobs = useMemo(() => pages?.flatMap((p) => p.items) ?? [], [pages])
  const total = pages?.[0]?.total ?? 0

  useEffect(() => {
    if (pages) onCount?.(total)
  }, [pages, total, onCount])

  // Keep the newest first page on the phone for offline use.
  useEffect(() => {
    const first = pages?.[0]
    if (first) saveJobCache(key, first.items, first.total)
  }, [pages, key])

  const filtersActive = filters.sector !== DEFAULT_FILTERS.sector || filters.wageType !== 'any' || filters.posted !== 'any'

  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label={t('common.loading')} className="flex flex-col gap-3.5">
        {Array.from({ length: 5 }, (_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (query.isError && jobs.length === 0) {
    const cached = loadJobCache(key)
    if (cached && cached.jobs.length > 0 && (!online || isOfflineError(query.error))) {
      return (
        <div className="flex flex-col gap-3">
          <p role="status" className="flex items-start gap-2 rounded-card bg-accent-soft p-3 font-semibold text-ink">
            <Icon name="info" className="mt-0.5 shrink-0 text-accent-deep" />
            {t('home.viewingCached')}
          </p>
          {cached.jobs.map((job) => (
            <JobCard key={job.id} job={job} area={area} onOpen={onOpenJob} />
          ))}
          <Button variant="secondary" onClick={() => void query.refetch()} loading={query.isRefetching} icon={<Icon name="refresh" size={22} />}>
            {t('common.retry')}
          </Button>
        </div>
      )
    }
    return <ErrorState kind={!online || isOfflineError(query.error) ? 'network' : 'server'} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
  }

  if (jobs.length === 0) {
    return filtersActive ? (
      <EmptyState icon="filter" title={t('states.emptyFilteredTitle')} body={t('states.emptyFilteredBody')}>
        <Button onClick={onClearFilters}>{t('states.clearFilters')}</Button>
        <Button variant="secondary" onClick={onChangeArea}>
          {t('states.changeArea')}
        </Button>
      </EmptyState>
    ) : (
      <EmptyState icon="briefcase" title={t('states.emptyTitle', { area: areaName || t('home.yourArea') })} body={t('states.emptyBody')}>
        <Button onClick={onChangeArea} icon={<Icon name="pin" size={22} />}>
          {t('states.changeArea')}
        </Button>
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-3.5 pb-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} area={area} onOpen={onOpenJob} />
      ))}
      {query.isFetchNextPageError ? (
        <ErrorState onRetry={() => void query.fetchNextPage()} retrying={query.isFetchingNextPage} />
      ) : (
        query.hasNextPage && (
          <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
            {t('common.showMore')}
          </Button>
        )
      )}
    </div>
  )
}
