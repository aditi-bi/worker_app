import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ChipProps {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  /** Used by radio-style groups so screen readers announce the selection. */
  role?: 'radio' | 'checkbox' | 'button'
  className?: string
}

export function Chip({ selected, onClick, children, role = 'button', className }: ChipProps) {
  return (
    <button
      type="button"
      role={role === 'button' ? undefined : role}
      aria-pressed={role === 'button' ? selected : undefined}
      aria-checked={role === 'button' ? undefined : selected}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-2 px-4 font-semibold transition active:scale-95',
        selected ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink hover:border-brand',
        className,
      )}
    >
      {children}
    </button>
  )
}
