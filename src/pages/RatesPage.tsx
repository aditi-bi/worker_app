import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageHeader } from '@/components/layout/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { Hint } from '@/components/ui/Hint'
import { useLanguage, usePreferences } from '@/features/preferences/PreferencesContext'
import { useRates } from '@/features/rates/useRates'
import { useAreas } from '@/features/reference/useReferenceData'
import { formatNumber } from '@/lib/format'
import { pick } from '@/lib/localized'

/** Typical daily pay by trade for one district. Sample figures are clearly marked until checked. */
export default function RatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = useLanguage()
  const { area: selected } = usePreferences()
  const areas = useAreas()
  const [areaId, setAreaId] = useState(selected?.areaId ?? areas.data?.[0]?.id ?? '')
  const query = useRates(areaId)

  return (
    <AppShell header={<PageHeader title={t('rates.title')} onBack={() => navigate('/jobs')} />} footer={<BottomNav />}>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="radiogroup" aria-label={t('area.districts')}>
        {(areas.data ?? []).map((a) => (
          <Chip key={a.id} role="radio" selected={a.id === areaId} onClick={() => setAreaId(a.id)}>
            {pick(a.name, language)}
          </Chip>
        ))}
      </div>
      {query.isPending ? (
        <div role="status" aria-busy="true" aria-label={t('common.loading')} className="h-48 animate-pulse rounded-[1.25rem] bg-surface-2" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      ) : query.data.items.length === 0 ? (
        <EmptyState icon="rupee" title={t('rates.empty')} />
      ) : (
        <div className="flex flex-col gap-3">
          {query.data.fromJobs ? <Hint>{t('rates.fromJobs')}</Hint> : !query.data.verified && <Hint>{t('rates.sample')}</Hint>}
          <ul className="flex flex-col gap-2">
            {query.data.items.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-[1.1rem] bg-surface px-4 py-3">
                <b>{pick(r.name, language)}</b>
                <span className="font-extrabold whitespace-nowrap">
                  ₹{formatNumber(r.min, language)}–{formatNumber(r.max, language)}
                  <small className="ml-1 font-semibold text-muted">{t('job.perDay')}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  )
}
