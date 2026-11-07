import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Hint } from '@/components/ui/Hint'
import { BigIcon } from '@/components/ui/BigIcon'
import { ReadAloudButton } from '@/components/ui/ReadAloudButton'
import { Highlighted, plain } from '@/lib/highlight'

/** Confirmation after Send. The "saved" version is shown when the phone was offline. */
export default function ApplicationSentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = (useLocation().state as { queued?: boolean; title?: string; locationShared?: boolean } | null) ?? {}
  const queued = state.queued === true
  const title = t(queued ? 'apply.queuedTitle' : 'apply.sentTitle')
  const body = t(queued ? 'apply.queuedBody' : 'apply.sentBody')
  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center">
        <BigIcon icon={queued ? 'clock' : 'check'} tone={queued ? 'warn' : 'teal'} />
        <h1 className="text-3xl leading-tight font-extrabold">
          <Highlighted text={title} />
        </h1>
        {state.title && <p className="font-bold">{state.title}</p>}
        <p className="max-w-sm text-lg text-ink/80">{body}</p>
        {state.locationShared === false && <Hint>{t('apply.noLocation')}</Hint>}
        <ReadAloudButton text={`${plain(title)}. ${body}`} />
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button arrow onClick={() => navigate('/applications', { replace: true })}>
            {t('apply.viewApps')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/jobs', { replace: true })}>
            {t('apply.backJobs')}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
