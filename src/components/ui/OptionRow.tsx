import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

interface OptionRowProps {
  title: string
  hint?: string
  selected: boolean
  onSelect: () => void
  lang?: string
  /** "radio" shows a check circle, "link" shows a chevron when not selected. */
  trailing?: 'radio' | 'link'
}

/** Big pill row: black when selected with a turquoise check (language, district). */
export function OptionRow({ title, hint, selected, onSelect, lang, trailing = 'radio' }: OptionRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      lang={lang}
      onClick={onSelect}
      className={cn(
        'flex min-h-16 w-full items-center justify-between rounded-[1.1rem] border-2 border-ink px-4 text-left transition active:scale-[0.99]',
        selected ? 'bg-night text-white' : 'bg-surface text-ink',
      )}
    >
      <span className="min-w-0">
        <span className="block text-xl leading-tight font-extrabold">{title}</span>
        {hint && <span className={cn('block truncate text-sm', selected ? 'text-white/70' : 'text-muted')}>{hint}</span>}
      </span>
      {selected ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
          <Icon name="check" size={16} strokeWidth={3} />
        </span>
      ) : trailing === 'link' ? (
        <Icon name="chevronRight" className="shrink-0 text-muted" />
      ) : (
        <span className="size-7 shrink-0 rounded-full border-2 border-[#aaa]" />
      )}
    </button>
  )
}
