import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/errors'

/** "Could not save" with the reason in small print, so a failure can be reported and fixed (e.g. "network", "server 404"). */
export function SaveError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  const reason = error instanceof ApiError ? [error.kind, error.status, error.code].filter(Boolean).join(' ') : error instanceof Error ? error.message : ''
  return (
    <div role="alert" className="flex flex-col gap-0.5">
      <p className="text-sm font-semibold text-bad">{t('tap.saveFailed')}</p>
      {reason && <p className="text-xs text-muted">{reason}</p>}
    </div>
  )
}
