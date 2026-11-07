import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from '@/components/icons/Icon'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName
  /** Required: icon-only buttons must have a name for screen readers. */
  label: string
}

export function IconButton({ icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn('inline-flex size-12 items-center justify-center rounded-full text-brand transition hover:bg-brand-soft active:scale-95', className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  )
}
