import type { ReactNode } from 'react'
import type { IconName } from '@/components/icons/Icon'
import { BigIcon } from '@/components/ui/BigIcon'

interface EmptyStateProps {
  icon?: IconName
  title: string
  body?: string
  children?: ReactNode
}

/** Friendly "nothing here" block with optional actions. */
export function EmptyState({ icon = 'briefcase', title, body, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-line bg-surface px-5 py-10 text-center">
      <BigIcon icon={icon} size={88} />
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {body && <p className="max-w-sm text-muted">{body}</p>}
      {children && <div className="mt-2 flex w-full max-w-xs flex-col gap-3">{children}</div>}
    </div>
  )
}
