import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_FILTERS, type JobFilters } from '@/api/types'
import { isOfflineError } from '@/api/errors'
import type { FullJob } from '@/api/workerTypes'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Icon } from '@/components/icons/Icon'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { ApplySheet } from '@/features/applications/components/ApplySheet'
import { FilterSheet } from '@/features/jobs/components/FilterSheet'
import { ForYouCard } from '@/features/jobs/components/ForYouCard'
import { JobCardSkeleton } from '@/features/jobs/components/JobCard'
import { filterFullJobs } from '@/features/jobs/filterJobs'
import { useJobsForMe } from '@/features/jobs/hooks/useJobsForMe'
import { useLanguage, usePreferences } from '@/features/preferences/PreferencesContext'
import { useMe } from '@/features/profile/useProfile'
import { useAreas, useSectors } from '@/features/reference/useReferenceData'
import { Highlighted } from '@/lib/highlight'
import { formatNumber } from '@/lib/format'
import { pick } from '@/lib/localized'
import { cn } from '@/lib/cn'


/** Home for a worker with a profile: one scrolling list of matched jobs, full detail one tap away, apply from the card. */
export default function ForYouPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const { area: selected } = usePreferences()
  const areas = useAreas()
  const sectors = useSectors()
  const me = useMe()
  const areaId = selected?.areaId ?? ''
  const query = useJobsForMe(areaId)
  const [confirm, setConfirm] = useState<FullJob | null>(null)
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)

  const area = areas.data?.find((a) => a.id === areaId)
  const worker = me.data
  const pages = query.data?.pages
  const loaded = useMemo(() => pages?.flatMap((p) => p.items) ?? [], [pages])
  const jobs = useMemo(() => filterFullJobs(loaded, filters), [loaded, filters])
  const total = pages?.[0]?.total ?? 0
  const skill = worker?.sectors[0] ? sectors.data?.find((s) => s.id === worker.sectors[0]) : undefined
  const { fetchNextPage, isFetchingNextPage, hasNextPage, isFetchNextPageError: nextFailed } = query
  const activeFilters = (filters.sort !== 'newest' ? 1 : 0) + (filters.wageType !== 'any' ? 1 : 0) + (filters.posted !== 'any' ? 1 : 0)
  const filtered = activeFilters > 0

  const body = () => {
    if (query.isPending || me.isPending) {
      return (
        <div role="status" aria-busy="true" aria-label={t('common.loading')} className="flex flex-col gap-3.5">
          {[0, 1, 2].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )
    }
    if (query.isError) return <ErrorState kind={isOfflineError(query.error) ? 'network' : 'server'} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
    if (jobs.length === 0) {
      return filtered ? (
        <EmptyState icon="filter" title={t('states.emptyFilteredTitle')} body={t('states.emptyFilteredBody')}>
          <Button onClick={() => setFilters(DEFAULT_FILTERS)}>{t('states.clearFilters')}</Button>
        </EmptyState>
      ) : (
        <EmptyState icon="briefcase" title={t('states.emptyTitle', { area: area ? pick(area.name, language) : t('home.yourArea') })} body={t('states.emptyBody')}>
          <Button onClick={() => navigate('/location/area')} icon={<Icon name="pin" size={22} />}>
            {t('states.changeArea')}
          </Button>
        </EmptyState>
      )
    }
    return (
      <div className="flex flex-col gap-3.5 pb-2">
        {jobs.map((job) => (
          <ForYouCard key={job.id} job={job} worker={worker} area={area} onDetails={(j) => navigate(`/jobs/${j.id}`)} onWant={setConfirm} />
        ))}
        {nextFailed ? (
          <ErrorState onRetry={() => void fetchNextPage()} retrying={isFetchingNextPage} />
        ) : (
          hasNextPage && (
            <Button variant="secondary" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              {t('common.showMore')}
            </Button>
          )
        )}
      </div>
    )
  }

  return (
    <AppShell
      footer={<BottomNav />}
      header={<AppHeader />}
    >
      <h1 className="mb-2 text-3xl leading-tight font-extrabold">
        <Highlighted text={`${t('job.forYouTitle')} *${t('home.count', { count: filtered ? jobs.length : total })}*`} />
      </h1>
      <div className="mb-3 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {skill && <Chip selected className="min-h-10! px-3! text-sm!">{pick(skill.name, language)}</Chip>}
        {worker && <Chip className="min-h-10! px-3! text-sm!">{`₹${formatNumber(worker.expectedPay.amount, language)}+`}</Chip>}
        {area && <Chip className="min-h-10! px-3! text-sm!">{pick(area.name, language)}</Chip>}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={filtered ? t('home.filtersActive', { count: activeFilters }) : t('home.filters')}
          className={cn('inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-full border-2 border-ink px-2.5 text-sm font-bold', filtered ? 'bg-accent text-accent-ink' : 'bg-surface text-ink')}
        >
          <Icon name="filter" size={18} />
          {filtered && <span>{activeFilters}</span>}
        </button>
      </div>
      {body()}
      <FilterSheet open={filterOpen} filters={filters} sectors={sectors.data ?? []} hideWork onClose={() => setFilterOpen(false)} onApply={(next) => setFilters((f) => ({ ...f, ...next }))} />
      <ApplySheet job={confirm} area={area} compact onClose={() => setConfirm(null)} />
    </AppShell>
  )
}
