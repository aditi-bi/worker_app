import type { SectorId } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'


/** Round icon for a work category (shared by chips and job cards). */
export function SectorIcon({ sector, size = 26, className }: { sector: SectorId; size?: number; className?: string }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full', 'bg-accent text-accent-ink', className)}>
      <Icon name={sector} size={size} />
    </span>
  )
}
