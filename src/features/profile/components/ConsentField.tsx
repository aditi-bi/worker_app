import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

interface Props {
  checked: boolean
  onChange: (next: boolean) => void
  error?: boolean
  /** Wording to show. Default: employers may call me about jobs I apply for. */
  textKey?: string
}

/** "Employers may call this number about jobs I apply for." The worker ticks it before the profile is saved. */
export function ConsentField({ checked, onChange, error, textKey = 'tap.consent' }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/90">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span
          aria-hidden="true"
          className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-ink peer-focus-visible:outline-3', checked ? 'bg-night text-accent' : 'bg-surface text-transparent')}
        >
          <Icon name="check" size={15} strokeWidth={3} />
        </span>
        <span>{t(textKey)}</span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {t('tap.consentRequired')}
        </p>
      )}
    </div>
  )
}
