import { useTranslation } from 'react-i18next'
import type { Area } from '@/api/types'
import type { FullJob, Worker } from '@/api/workerTypes'
import { Icon } from '@/components/icons/Icon'
import { Tag } from '@/components/ui/Tag'
import { useAppliedLocally } from '@/features/applications/localStore'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { formatNumber, formatPosted, formatWageParts } from '@/lib/format'
import { pick } from '@/lib/localized'
import { aboveMinimum, initials } from '../match'
import { CARD_CLASS } from './JobCard'

interface Props {
  job: FullJob
  worker?: Worker
  area?: Area
  onDetails: (job: FullJob) => void
  onWant: (job: FullJob) => void
}

/** Compact card for a worker with a profile. The long details (stay, hours, gear, start) are one tap away on Full details. */
export function ForYouCard({ job, worker, area, onDetails, onWant }: Props) {
  const { t } = useTranslation()
  const language = useLanguage()
  const appliedLocally = useAppliedLocally(job.id)
  const taluka = area?.talukas.find((x) => x.id === job.talukaId)
  const place = [taluka && pick(taluka.name, language), area && pick(area.name, language)].filter(Boolean).join(', ')
  const { amount, unit } = formatWageParts(job.wage, language, t)
  const above = worker ? aboveMinimum(job.wage, worker.expectedPay) : null
  const title = pick(job.title, language)

  return (
    <article className={CARD_CLASS}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.65rem] bg-accent text-xs font-extrabold text-accent-ink">
          {initials(job.employer.name)}
        </span>
        <b className="min-w-0 flex-1 truncate text-sm">{job.employer.name}</b>
        {job.matchReason && (
          <Tag tone="dark" className="shrink-0 text-[11px]">
            {pick(job.matchReason, language)}
          </Tag>
        )}
      </div>
      <h3 className="text-xl leading-tight font-extrabold">{title}</h3>
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <b className="text-2xl font-extrabold tracking-tight whitespace-nowrap">{amount}</b>
        <span className="text-xs font-bold text-muted">{unit}</span>
        {above !== null && (
          <Tag tone="ok" className="ml-auto text-[11px]">
            {t('job.aboveMinShort', { amount: `₹${formatNumber(above, language)}` })}
          </Tag>
        )}
      </p>
      <p className="flex items-center gap-1 text-sm text-muted">
        <Icon name="pin" size={16} className="shrink-0" />
        <span className="truncate">
          {[place, job.distanceKm !== null ? t('common.km', { count: job.distanceKm }) : null, job.postedAt ? formatPosted(job.postedAt, language) : null].filter(Boolean).join(' · ')}
        </span>
      </p>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" onClick={() => onDetails(job)} aria-label={`${t('job.fullDetails')}: ${title}`} className="min-h-11 shrink-0 rounded-full border-2 border-ink bg-surface px-3.5 text-sm font-bold">
          {t('job.fullDetails')}
        </button>
        {job.applied || appliedLocally ? (
          <button type="button" onClick={() => onDetails(job)} className="flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-accent-soft px-3 text-sm font-bold text-ink">
            {t('job.applied')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onWant(job)}
            aria-label={`${t('job.want')}: ${title}`}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-full bg-brand pr-1 pl-3.5 text-sm font-bold whitespace-nowrap text-brand-ink"
          >
            {t('job.want')}
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
              <Icon name="arrowRight" size={16} />
            </span>
          </button>
        )}
      </div>
    </article>
  )
}
