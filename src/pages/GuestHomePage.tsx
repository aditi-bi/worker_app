import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_FILTERS, type GuestJob, type JobFilters } from '@/api/types'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { Icon } from '@/components/icons/Icon'
import { FilterSheet } from '@/features/jobs/components/FilterSheet'
import { JobList } from '@/features/jobs/components/JobList'
import { NeedProfileSheet } from '@/features/profile/components/NeedProfileSheet'
import { Highlighted } from '@/lib/highlight'
import { Chip } from '@/components/ui/Chip'
import { useAreas, useSectors } from '@/features/reference/useReferenceData'
import { useLanguage, usePreferences } from '@/features/preferences/PreferencesContext'
import { pick } from '@/lib/localized'
import { cn } from '@/lib/cn'


/** Home for a worker who skipped the profile: nearby jobs in the same card list. Details and applying ask for the profile first. */
export default function GuestHomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const language = useLanguage()
  const { area: selected, setPendingJobId } = usePreferences()
  const areas = useAreas()
  const sectors = useSectors()
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [gateOpen, setGateOpen] = useState(() => (location.state as { needProfile?: boolean } | null)?.needProfile === true)
  const [count, setCount] = useState<number | null>(null)
  const onCount = useCallback((n: number) => setCount(n), [])

  // RequireArea guarantees an area; the fallback only satisfies the type checker.
  const areaId = selected?.areaId ?? ''
  const area = areas.data?.find((a) => a.id === areaId)
  const taluka = area?.talukas.find((x) => x.id === selected?.talukaId)
  const areaName = area ? pick(area.name, language) : ''
  const placeName = [taluka && pick(taluka.name, language), areaName].filter(Boolean).join(' · ')

  const activeFilterCount = (filters.sector !== 'all' ? 1 : 0) + (filters.sort !== 'newest' ? 1 : 0) + (filters.wageType !== 'any' ? 1 : 0) + (filters.posted !== 'any' ? 1 : 0)

  const openJob = useCallback(
    (job: GuestJob) => {
      setPendingJobId(job.id) // remembered so the worker returns to this job once the profile is made
      setGateOpen(true)
    },
    [setPendingJobId],
  )

  return (
    <AppShell
      footer={<BottomNav />}
      header={
        <AppHeader>
          <button
            type="button"
            onClick={() => navigate('/location/area')}
            aria-label={t('home.areaLabel', { area: placeName })}
            className="mt-2 flex min-h-14 w-full items-center gap-2 rounded-card border-2 border-ink bg-surface px-4 text-left transition"
          >
            <Icon name="pin" className="shrink-0 text-accent-deep" />
            <span className="min-w-0 flex-1 truncate text-lg font-bold text-ink">{placeName || t('home.yourArea')}</span>
            <span className="flex items-center gap-1 font-semibold text-ink">
              {t('common.change')}
              <Icon name="chevronDown" size={20} />
            </span>
          </button>
        </AppHeader>
      }
    >
      <h1 className="mb-1 text-3xl leading-tight font-extrabold">
        <Highlighted text={count !== null ? `${t('home.nearYou')} *${t('home.count', { count })}*` : t('home.nearYou')} />
      </h1>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Chip selected={filters.sector === 'all'} onClick={() => setFilters((f) => ({ ...f, sector: 'all' }))}>
          {filters.sector === 'all' ? t('sectors.all') : (sectors.data?.find((x) => x.id === filters.sector) ? pick(sectors.data.find((x) => x.id === filters.sector)!.name, language) : t('sectors.all'))}
        </Chip>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={cn(
            'inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 font-semibold',
            activeFilterCount ? 'border-ink bg-accent text-accent-ink' : 'border-ink bg-surface text-ink',
          )}
        >
          <Icon name="filter" size={20} />
          {activeFilterCount ? t('home.filtersActive', { count: activeFilterCount }) : t('home.filters')}
        </button>
      </div>

      <JobList
        area={area}
        areaId={areaId}
        areaName={areaName}
        filters={filters}
        onOpenJob={openJob}
        onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        onChangeArea={() => navigate('/location/area')}
        onCount={onCount}
      />

      <FilterSheet open={filterOpen} filters={filters} sectors={sectors.data ?? []} onClose={() => setFilterOpen(false)} onApply={(next) => setFilters((f) => ({ ...f, ...next }))} />
      <NeedProfileSheet open={gateOpen} onClose={() => setGateOpen(false)} />
    </AppShell>
  )
}
