import { useTranslation } from 'react-i18next'
import { useSpeak } from '@/hooks/useSpeak'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/icons/Icon'

interface ReadAloudButtonProps {
  /** Text to speak, already translated. */
  text: string
  className?: string
  compact?: boolean
}

/** Read-aloud is switched off for now. Set to true to bring the speaker buttons back everywhere. */
const READ_ALOUD_ENABLED = false

/** Speaks `text` with the phone's voice. Renders nothing when the phone has no speech support. */
export function ReadAloudButton({ text, className, compact }: ReadAloudButtonProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  const { supported, speaking, speak, stop } = useSpeak(language)
  if (!READ_ALOUD_ENABLED || !supported) return null
  const label = speaking ? t('common.stopListening') : t('common.listen')
  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(text))}
      aria-label={label}
      aria-pressed={speaking}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink bg-surface font-bold text-ink transition active:scale-95',
        compact ? 'size-11' : 'min-h-12 px-4',
        speaking && 'bg-accent text-accent-ink',
        className,
      )}
    >
      <Icon name={speaking ? 'stop' : 'speaker'} size={compact ? 22 : 24} />
      {!compact && <span>{label}</span>}
    </button>
  )
}
