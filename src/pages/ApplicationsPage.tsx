import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Application, ApplicationStatus } from '@/api/workerTypes'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { ReadAloudButton } from '@/components/ui/ReadAloudButton'
import { Tag, type TagTone } from '@/components/ui/Tag'
import { filterApplications, useApplications, useWithdraw, type ApplicationFilter } from '@/features/applications/useApplications'
import { usePendingApplications } from '@/features/applications/pendingQueue'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { formatPosted, formatWage } from '@/lib/format'
import { pick } from '@/lib/localized'

const TONE: Record<ApplicationStatus, TagTone> = { sent: 'warn', seen: 'mint', shortlisted: 'ok', not_selected: 'bad', hired: 'ok', withdrawn: 'lock' }

/** Everything the worker has applied to, with a plain-words explanation of each status. */
export default function ApplicationsPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const query = useApplications()
  const pending = usePendingApplications()
  const withdraw = useWithdraw()
  const [filter, setFilter] = useState<ApplicationFilter>('all')
  const [open, setOpen] = useState<Application | null>(null)

  const items = query.data?.items ?? []
  const shown = filterApplications(items, filter)
  const nothing = items.length === 0 && pending.length === 0

  return (
    <AppShell header={<AppHeader />} footer={<BottomNav />}>
      <h1 className="mb-2 text-3xl leading-tight font-extrabold">{t('apps.title')}</h1>
      <div role="radiogroup" aria-label={t('apps.title')} className="mb-3 flex gap-2">
        {(['all', 'active', 'closed'] as const).map((f) => (
          <Chip key={f} role="radio" selected={filter === f} onClick={() => setFilter(f)}>
            {t(f === 'all' ? 'common.all' : f === 'active' ? 'apps.active' : 'apps.closed')}
          </Chip>
        ))}
      </div>

      {query.isPending ? (
        <div role="status" aria-busy="true" aria-label={t('common.loading')} className="h-40 animate-pulse rounded-[1.25rem] bg-surface-2" />
      ) : query.isError && pending.length === 0 ? (
        <ErrorState onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      ) : nothing ? (
        <EmptyState icon="doc" title={t('apps.emptyTitle')} body={t('apps.emptyBody')}>
          <Button arrow onClick={() => navigate('/jobs')}>
            {t('apps.emptyCta')}
          </Button>
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filter !== 'closed' &&
            pending.map((p) => (
              <li key={p.jobId} className="flex flex-col gap-1 rounded-[1.25rem] bg-surface p-4">
                <span className="flex items-center justify-between gap-2">
                  <b className="text-lg">{pick(p.title, language)}</b>
                  <Tag tone="warn">{t('apps.pendingTitle')}</Tag>
                </span>
                <span className="text-sm text-muted">{t('apps.pendingBody')}</span>
              </li>
            ))}
          {shown.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setOpen(a)} className="flex w-full flex-col gap-1 rounded-[1.25rem] bg-surface p-4 text-left active:scale-[0.99]">
                <span className="flex items-center justify-between gap-2">
                  <b className="text-lg">{pick(a.job.title, language)}</b>
                  <Tag tone={TONE[a.status]}>{t(`apps.status_${a.status}`)}</Tag>
                </span>
                <span className="font-bold">{formatWage(a.job.wage, language, t)}</span>
                <span className="text-sm text-muted">{t('apps.appliedOn', { when: formatPosted(a.appliedAt, language) })}</span>
              </button>
            </li>
          ))}
          {shown.length === 0 && pending.length === 0 && <li className="py-6 text-center text-muted">{t('apps.emptyFiltered')}</li>}
        </ul>
      )}

      {open && (
        <BottomSheet open title={pick(open.job.title, language)} onClose={() => setOpen(null)}>
          <div className="flex flex-col gap-3">
            <Tag tone={TONE[open.status]} className="self-start">
              {t(`apps.status_${open.status}`)}
            </Tag>
            <p className="text-lg">{t(`apps.help_${open.status}`)}</p>
            <div className="flex items-center gap-3">
              <ReadAloudButton compact text={t(`apps.help_${open.status}`)} />
              <Button variant="secondary" className="flex-1" onClick={() => navigate(`/jobs/${open.jobId}`)}>
                {t('apps.viewJob')}
              </Button>
            </div>
            {(open.status === 'sent' || open.status === 'seen' || open.status === 'shortlisted') && (
              <>
                {withdraw.isError && (
                  <p role="alert" className="text-sm font-semibold text-bad">
                    {t('apps.withdrawFailed')}
                  </p>
                )}
                <Button variant="secondary" loading={withdraw.isPending} className="text-bad" onClick={() => withdraw.mutate(open.id, { onSuccess: () => setOpen(null) })}>
                  {t('apps.withdraw')}
                </Button>
              </>
            )}
          </div>
        </BottomSheet>
      )}
    </AppShell>
  )
}
