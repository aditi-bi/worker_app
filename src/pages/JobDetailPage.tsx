import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/errors'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Tile } from '@/components/ui/Tile'
import { ApplySheet } from '@/features/applications/components/ApplySheet'
import { useAppliedLocally } from '@/features/applications/localStore'
import { useJob } from '@/features/jobs/hooks/useJobsForMe'
import { useAreas } from '@/features/reference/useReferenceData'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { formatWageParts } from '@/lib/format'
import { pick } from '@/lib/localized'

/** Full job: dark summary card, four fact tiles, the employer's note, Apply. */
export default function JobDetailPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const job = useJob(id)
  const areas = useAreas()
  const appliedLocally = useAppliedLocally(id ?? '')
  const [applyOpen, setApplyOpen] = useState(false)

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/jobs'))
  const header = <PageHeader title={t('job.detailTitle')} onBack={back} />

  if (job.isPending) {
    return (
      <AppShell header={header}>
        <div role="status" aria-busy="true" aria-label={t('common.loading')} className="h-72 animate-pulse rounded-[1.75rem] bg-surface-2" />
      </AppShell>
    )
  }
  if (job.isError || !job.data) {
    const gone = job.error instanceof ApiError && job.error.kind === 'not_found'
    return (
      <AppShell header={header}>
        {gone ? (
          <EmptyState icon="briefcase" title={t('job.gone')}>
            <Button onClick={() => navigate('/jobs')}>{t('notFound.home')}</Button>
          </EmptyState>
        ) : (
          <ErrorState onRetry={() => void job.refetch()} retrying={job.isRefetching} />
        )}
      </AppShell>
    )
  }

  const j = job.data
  const area = areas.data?.find((a) => a.id === j.areaId)
  const taluka = area?.talukas.find((x) => x.id === j.talukaId)
  const place = [taluka && pick(taluka.name, language), area && pick(area.name, language)].filter(Boolean).join(', ')
  const { amount, unit } = formatWageParts(j.wage, language, t)
  const cycle = t(j.payCycle === 'daily' ? 'job.cycleDaily' : j.payCycle === 'weekly' ? 'job.cycleWeekly' : 'job.cycleMonthly')

  return (
    <AppShell header={header}>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5 rounded-[1.75rem] bg-night p-4 text-white">
          {j.matchReason && (
            <Tag tone="dark" className="self-start">
              {t('job.matchesSkill', { what: pick(j.matchReason, language) })}
            </Tag>
          )}
          <h2 className="text-3xl leading-tight font-extrabold">{pick(j.title, language)}</h2>
          <p className="text-white/75">
            {[j.address ?? place, j.distanceKm !== null ? t('common.km', { count: j.distanceKm }) : null].filter(Boolean).join(' · ')}
          </p>
          <p className="flex flex-wrap items-baseline gap-2">
            <b className="text-3xl whitespace-nowrap text-accent">{amount}</b>
            <span className="text-sm text-white/70">{unit}</span>
          </p>
          <p className="text-sm text-white/60">{t('job.employer', { name: j.employer.name })}</p>
        </div>
        <h3 className="font-extrabold">{t('job.listed')}</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Tile compact icon="home" label={t('job.stay')} sub={j.stay ? pick(j.stay, language) : t('job.noStay')} />
          <Tile compact icon="rupee" label={t('job.payCycle')} sub={cycle} />
          <Tile compact icon="clock" label={t('job.hours')} sub={j.hours ? pick(j.hours, language) : t('job.notGiven')} />
          <Tile compact icon="briefcase" label={t('job.starts')} sub={j.starts ? pick(j.starts, language) : t('job.notGiven')} />
        </div>
        <p className="text-sm text-muted">{t('job.employerNote')}</p>
        <div className="mt-auto flex items-center gap-3 pt-2">
          {j.applied || appliedLocally ? (
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/applications')}>
              {t('job.applied')}
            </Button>
          ) : (
            <Button arrow className="flex-1" onClick={() => setApplyOpen(true)}>
              {t('job.apply')}
            </Button>
          )}
        </div>
      </div>
      <ApplySheet job={applyOpen ? j : null} area={area} onClose={() => setApplyOpen(false)} />
    </AppShell>
  )
}
