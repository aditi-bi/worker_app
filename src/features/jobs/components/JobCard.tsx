import { useTranslation } from 'react-i18next'
import type { Area, GuestJob } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { formatPosted, formatWageParts } from '@/lib/format'
import { pick } from '@/lib/localized'
import { SectorIcon } from './SectorIcon'

/** Shared look of every job card in the scrolling lists: white tile, clear edge, raised bottom line. */
export const CARD_CLASS = 'flex flex-col gap-1.5 rounded-[1.25rem] border-2 border-[#cdcdc2] bg-surface p-3.5 shadow-[0_4px_0_#cdcdc2]'

interface JobCardProps {
  job: GuestJob
  area?: Area
  /** Details and "I want this job" both need a profile, so the page opens the "tell Phala about you" sheet. */
  onOpen: (job: GuestJob) => void
}

/** Guest card (no profile yet): work type, title, wage, place and posted time. Employer details come with a profile. */
export function JobCard({ job, area, onOpen }: JobCardProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  const title = pick(job.title, language)
  const taluka = area?.talukas.find((x) => x.id === job.talukaId)
  const place = [taluka && pick(taluka.name, language), area && pick(area.name, language)].filter(Boolean).join(', ')
  const parts = formatWageParts(job.wage, language, t)

  return (
    <article className={CARD_CLASS}>
      <div className="flex items-center gap-2">
        <SectorIcon sector={job.sector} className="size-8" />
        <h3 className="min-w-0 flex-1 text-xl leading-tight font-extrabold text-ink">{title}</h3>
      </div>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <b className="text-2xl font-extrabold tracking-tight whitespace-nowrap">{parts.amount}</b>
        <span className="text-xs font-bold text-muted">{parts.unit}</span>
      </p>
      <p className="flex items-center gap-1 text-sm text-muted">
        <Icon name="pin" size={16} className="shrink-0" />
        <span className="truncate">
          {[place, job.postedAt ? t('job.posted', { when: formatPosted(job.postedAt, language) }) : null].filter(Boolean).join(' · ')}
        </span>
      </p>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" onClick={() => onOpen(job)} aria-label={`${t('job.fullDetails')}: ${title}`} className="min-h-11 shrink-0 rounded-full border-2 border-ink bg-surface px-3.5 text-sm font-bold">
          {t('job.fullDetails')}
        </button>
        <button
          type="button"
          onClick={() => onOpen(job)}
          aria-label={`${t('job.want')}: ${title}`}
          className="flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-full bg-brand pr-1 pl-3.5 text-sm font-bold whitespace-nowrap text-brand-ink"
        >
          {t('job.want')}
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
            <Icon name="arrowRight" size={16} />
          </span>
        </button>
      </div>
    </article>
  )
}

export function JobCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-2 rounded-[1.25rem] border-2 border-line bg-surface p-3.5">
      <div className="h-5 w-2/3 rounded bg-surface-2" />
      <div className="h-6 w-2/5 rounded bg-surface-2" />
      <div className="h-4 w-1/2 rounded bg-surface-2" />
      <div className="h-11 w-full rounded-full bg-surface-2" />
    </div>
  )
}
