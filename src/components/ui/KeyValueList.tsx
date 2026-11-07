import type { ReactNode } from 'react'
import { Icon } from '@/components/icons/Icon'

export interface KeyValueRow {
  label: string
  value: ReactNode
  /** When set, a pencil button is shown and called on tap. */
  onEdit?: () => void
  editLabel?: string
}

/** White card with label / value rows, optionally editable. */
export function KeyValueList({ rows }: { rows: KeyValueRow[] }) {
  return (
    <dl className="flex flex-col rounded-[1.25rem] bg-surface px-3.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-0">
          <dt className="w-24 shrink-0 text-sm text-muted">{row.label}</dt>
          <dd className="min-w-0 flex-1 font-extrabold">{row.value}</dd>
          {row.onEdit && (
            <button type="button" onClick={row.onEdit} aria-label={row.editLabel ?? row.label} className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2">
              <Icon name="edit" size={18} />
            </button>
          )}
        </div>
      ))}
    </dl>
  )
}
