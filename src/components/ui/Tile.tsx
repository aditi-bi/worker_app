import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

interface TileProps {
  icon: IconName
  label: string
  /** Small second line (used on job detail). */
  sub?: string
  selected?: boolean
  onClick?: () => void
  compact?: boolean
  children?: ReactNode
}

/** Square-ish tile with a round icon. A button when `onClick` is given, otherwise a plain info tile. */
export function Tile({ icon, label, sub, selected, onClick, compact }: TileProps) {
  const className = cn(
    'flex flex-col gap-1.5 rounded-[1.25rem] border-2 border-ink p-3 text-left font-extrabold',
    compact ? 'min-h-[5.25rem] text-base' : 'min-h-24 text-lg',
    selected ? 'bg-night text-white' : 'bg-surface text-ink',
  )
  const body = (
    <>
      <span className={cn('flex size-10 items-center justify-center rounded-full text-accent-ink', 'bg-accent')}>
        <Icon name={icon} size={compact ? 20 : 24} />
      </span>
      <span>{label}</span>
      {sub && <small className={cn('text-sm font-semibold', selected ? 'text-white/70' : 'text-muted')}>{sub}</small>}
    </>
  )
  return onClick ? (
    <button type="button" role="checkbox" aria-checked={!!selected} onClick={onClick} className={cn(className, 'active:scale-[0.98]')}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
