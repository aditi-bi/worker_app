import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/icons/Icon'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
  loading?: boolean
  icon?: ReactNode
  /** Adds the round turquoise arrow on the right (primary and accent buttons). */
  arrow?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:opacity-90',
  accent: 'bg-accent text-accent-ink hover:opacity-90',
  secondary: 'bg-surface text-ink border-2 border-ink hover:bg-accent-soft',
  ghost: 'bg-transparent text-ink hover:bg-accent-soft',
}

/** Large (min 56px) pill button. Shows a spinner and blocks double taps while loading. */
export function Button({ variant = 'primary', block, loading, icon, arrow, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  const withArrow = arrow && (variant === 'primary' || variant === 'accent')
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-6 text-lg font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        withArrow && 'justify-between pr-2',
        VARIANTS[variant],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
      {withArrow && (
        <span aria-hidden="true" className={cn('flex size-10 items-center justify-center rounded-full', variant === 'primary' ? 'bg-accent text-accent-ink' : 'bg-brand text-brand-ink')}>
          <Icon name="arrowRight" size={22} />
        </span>
      )}
    </button>
  )
}
