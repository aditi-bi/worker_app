import { Icon, type IconName } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

interface BigIconProps {
  icon: IconName
  tone?: 'teal' | 'warn'
  size?: number
}

/** Large round icon for success / warning moments (verified, no answer, empty states). */
export function BigIcon({ icon, tone = 'teal', size = 110 }: BigIconProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn('mx-auto flex shrink-0 items-center justify-center rounded-full text-accent-ink', tone === 'teal' ? 'bg-accent' : 'bg-warn')}
    >
      <Icon name={icon} size={Math.round(size * 0.49)} strokeWidth={icon === 'check' ? 3 : 2.2} />
    </span>
  )
}
