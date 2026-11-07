import type { ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'

/** Yellow notice with an info icon (location off, sample data, offline). */
export function Hint({ children, role = 'status' }: { children: ReactNode; role?: 'status' | 'alert' }) {
  return (
    <p role={role} className="flex items-start gap-2 rounded-2xl bg-warn px-3 py-2.5 text-sm font-bold text-warn-ink">
      <Icon name="info" size={20} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  )
}
