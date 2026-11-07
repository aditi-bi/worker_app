import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/icons/Icon'

interface ErrorStateProps {
  /** "network" = phone has no internet; "server" = our side failed. */
  kind?: 'network' | 'server'
  title?: string
  body?: string
  onRetry?: () => void
  retrying?: boolean
}

/** Error block with a Try again button. Uses role="alert" so screen readers announce it. */
export function ErrorState({ kind = 'server', title, body, onRetry, retrying }: ErrorStateProps) {
  const { t } = useTranslation()
  const isNetwork = kind === 'network'
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card border-2 border-bad/40 bg-bad-bg px-5 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface text-bad">
        <Icon name={isNetwork ? 'wifiOff' : 'alert'} size={32} />
      </span>
      <h2 className="text-xl font-bold text-ink">{title ?? t(isNetwork ? 'states.networkTitle' : 'states.errorTitle')}</h2>
      <p className="max-w-sm text-ink/80">{body ?? t(isNetwork ? 'states.networkBody' : 'states.errorBody')}</p>
      {onRetry && (
        <Button onClick={onRetry} loading={retrying} icon={<Icon name="refresh" size={22} />} className="mt-2 w-full max-w-xs">
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
