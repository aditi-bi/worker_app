import { useTranslation } from 'react-i18next'
import { useOnline } from '@/hooks/useOnline'
import { Icon } from '@/components/icons/Icon'

/** Sticky strip at the very top while the phone has no connection. */
export function OfflineBanner() {
  const { t } = useTranslation()
  const online = useOnline()
  return (
    <div role="status" aria-live="polite">
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-accent px-4 py-2 text-center text-base font-semibold text-accent-ink">
          <Icon name="wifiOff" size={20} />
          {t('states.offlineBanner')}
        </div>
      )}
    </div>
  )
}
