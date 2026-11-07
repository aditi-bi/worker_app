import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Area } from '@/api/types'
import type { FullJob } from '@/api/workerTypes'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { KeyValueList } from '@/components/ui/KeyValueList'
import { Hint } from '@/components/ui/Hint'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { formatWage } from '@/lib/format'
import { pick } from '@/lib/localized'
import { useOnline } from '@/hooks/useOnline'
import { useApply } from '../useApplications'

interface Props {
  job: FullJob | null
  area?: Area
  /** true from the job list (short confirm with a "Not now" button and no note box). */
  compact?: boolean
  onClose: () => void
}

/** Last step before anything is sent: shows the job and what will be shared, then sends on one tap. */
export function ApplySheet({ job, area, compact, onClose }: Props) {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const online = useOnline()
  const apply = useApply()
  const [note, setNote] = useState('')
  if (!job) return null

  const taluka = area?.talukas.find((x) => x.id === job.talukaId)
  const place = [taluka && pick(taluka.name, language), area && pick(area.name, language)].filter(Boolean).join(', ')

  const send = () =>
    apply.mutate(
      { job, note: note.trim() || undefined },
      {
        onSuccess: (result) => {
          onClose()
          navigate(`/jobs/${job.id}/applied`, { state: { queued: result.queued, title: pick(job.title, language), locationShared: result.locationShared } })
        },
      },
    )

  return (
    <BottomSheet open title={compact ? t('apply.confirmTitle') : t('apply.title')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <KeyValueList
          rows={[
            { label: t('apply.confirmJob'), value: pick(job.title, language) },
            { label: t('apply.confirmWhere'), value: place || '-' },
            { label: t('apply.confirmPay'), value: formatWage(job.wage, language, t) },
            { label: t('apply.sending'), value: t('apply.sendingValue') },
            { label: t('apply.locationLabel'), value: t('apply.locationValue') },
          ]}
        />
        {!compact && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">{t('apply.noteLabel')}</span>
            <textarea
              value={note}
              maxLength={200}
              rows={2}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('apply.notePlaceholder')}
              className="min-h-20 rounded-2xl border-2 border-ink bg-surface p-3 text-lg outline-none"
            />
          </label>
        )}
        <p className="text-sm text-muted">{t('apply.locationNote')}</p>
        <p className="text-sm text-muted">{t('apply.confirmNote')}</p>
        {!online && <Hint>{t('apply.offline')}</Hint>}
        {apply.isError && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {t('apply.failed')}
          </p>
        )}
        <Button arrow loading={apply.isPending} onClick={send}>
          {t('apply.send')}
        </Button>
        {compact && (
          <Button variant="secondary" onClick={onClose}>
            {t('apply.notNow')}
          </Button>
        )}
      </div>
    </BottomSheet>
  )
}
