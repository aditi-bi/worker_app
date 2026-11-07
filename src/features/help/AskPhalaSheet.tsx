import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import { BottomSheet } from '@/components/ui/BottomSheet'

/**
 * PLACEHOLDER: set VITE_PHALA_INBOUND_NUMBER to the number of the existing inbound call setup.
 * The app only opens the phone's dialler; a call starts when the worker taps the green button there.
 */
const INBOUND = ((import.meta.env.VITE_PHALA_INBOUND_NUMBER as string | undefined) ?? '').replace(/[^\d+]/g, '')

const EXAMPLES = ['ask.q1', 'ask.q2', 'ask.q3'] as const

interface Props {
  open: boolean
  onClose: () => void
}

/** The centre button of the bottom bar. For doubts only: a worker who has none never needs it. */
export function AskPhalaSheet({ open, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <BottomSheet open={open} title={t('ask.title')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-muted">{t('ask.body')}</p>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLES.map((key) => (
            <li key={key} className="rounded-full border-2 border-ink bg-surface px-3.5 py-2 text-sm font-bold">
              {t(key)}
            </li>
          ))}
        </ul>
        {INBOUND ? (
          <a href={`tel:${INBOUND}`} onClick={onClose} className="inline-flex min-h-14 items-center justify-between rounded-full bg-brand pr-2 pl-6 text-lg font-bold text-brand-ink">
            {t('ask.call')}
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-ink">
              <Icon name="phone" size={22} />
            </span>
          </a>
        ) : (
          <p role="status" className="rounded-2xl bg-warn px-3 py-2.5 text-sm font-bold text-warn-ink">
            {t('ask.notReady')}
          </p>
        )}
        <p className="text-center text-xs text-muted">{t('ask.note')}</p>
      </div>
    </BottomSheet>
  )
}
