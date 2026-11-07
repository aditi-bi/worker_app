import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Area, Taluka } from '@/api/types'
import { isOfflineError } from '@/api/errors'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Hint } from '@/components/ui/Hint'
import { OptionRow } from '@/components/ui/OptionRow'
import { Icon } from '@/components/icons/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReadAloudButton } from '@/components/ui/ReadAloudButton'
import { useAreas } from '@/features/reference/useReferenceData'
import { useAuth } from '@/features/auth/AuthContext'
import { useLanguage, usePreferences } from '@/features/preferences/PreferencesContext'
import { pick } from '@/lib/localized'
import { useOnline } from '@/hooks/useOnline'

interface Row {
  area: Area
  taluka: Taluka | null
}

const norm = (s: string) => s.toLocaleLowerCase().normalize('NFC').trim()
const matches = (names: Record<string, string>, q: string) => Object.values(names).some((n) => norm(n).includes(q))

/** Manual district/taluka picker with search. Works without location permission. */
export default function AreaPickerPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const online = useOnline()
  const { area: selected, setArea, profileSkipped } = usePreferences()
  const { signedIn } = useAuth()
  const areas = useAreas()
  const [search, setSearch] = useState('')
  const notice = (location.state as { notice?: 'denied' | 'notCovered' } | null)?.notice

  const rows = useMemo<Row[]>(() => {
    const list = areas.data ?? []
    const q = norm(search)
    if (!q) return list.map((area) => ({ area, taluka: null }))
    const result: Row[] = []
    for (const area of list) {
      if (matches(area.name, q)) result.push({ area, taluka: null })
      for (const taluka of area.talukas) if (matches(taluka.name, q)) result.push({ area, taluka })
    }
    return result
  }, [areas.data, search])

  const choose = ({ area, taluka }: Row) => {
    setArea({ areaId: area.id, talukaId: taluka?.id ?? null, source: 'manual' })
    navigate(signedIn || profileSkipped ? '/jobs' : '/talk', { replace: true })
  }

  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/location', { replace: true }))

  return (
    <AppShell header={<PageHeader title={t('area.title')} onBack={back} action={<ReadAloudButton compact text={t('area.speech')} />} />}>
      <div className="flex flex-col gap-4">
        {notice && (
          <Hint>{t(notice === 'denied' ? 'location.denied' : 'location.notCovered')}</Hint>
        )}

        <div className="relative">
          <label htmlFor="area-search" className="sr-only">
            {t('area.searchLabel')}
          </label>
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="area-search"
            type="search"
            inputMode="search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('area.searchPlaceholder')}
            className="min-h-14 w-full rounded-2xl border-2 border-ink bg-surface pl-12 pr-4 text-lg text-ink placeholder:text-muted focus:outline-none"
          />
        </div>

        {areas.isPending && (
          <div role="status" aria-busy="true" aria-label={t('common.loading')} className="flex flex-col gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {areas.isError && !areas.data && (
          <ErrorState
            kind={!online || isOfflineError(areas.error) ? 'network' : 'server'}
            title={t('area.loadError')}
            onRetry={() => void areas.refetch()}
            retrying={areas.isRefetching}
          />
        )}

        {areas.data && rows.length === 0 && <EmptyState icon="search" title={t('area.noResults')} />}

        {rows.length > 0 && (
          <ul className="flex flex-col gap-2" aria-label={t('area.districts')}>
            {rows.map((row) => {
              const isSelected = selected?.areaId === row.area.id && (selected?.talukaId ?? null) === (row.taluka?.id ?? null)
              const primary = pick((row.taluka ?? row.area).name, language)
              const secondary = row.taluka
                ? pick(row.area.name, language)
                : row.area.talukas.slice(0, 3).map((x) => pick(x.name, language)).join(', ')
              return (
                <li key={`${row.area.id}:${row.taluka?.id ?? ''}`}>
                  <OptionRow title={primary} hint={secondary || undefined} selected={isSelected} onSelect={() => choose(row)} trailing="link" />
                </li>
              )
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => navigate('/location')}
          className="mx-auto inline-flex min-h-12 items-center gap-2 font-bold text-ink underline-offset-4 hover:underline"
        >
          <Icon name="crosshair" size={20} />
          {t('area.useLocation')}
        </button>
      </div>
    </AppShell>
  )
}
