import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

export interface StepItem {
  label: string
  value?: string
  state: 'done' | 'now' | 'todo'
}

/** Numbered checklist: done steps turquoise with a tick, the current step outlined. */
export function StepList({ items }: { items: StepItem[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={item.label} className={cn('flex items-center gap-2.5 rounded-2xl bg-surface px-3 py-2.5 font-bold', item.state === 'now' && 'outline-2 outline-ink')}>
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full text-[13px]',
              item.state === 'done' ? 'bg-accent text-accent-ink' : item.state === 'now' ? 'bg-night text-accent' : 'bg-line',
            )}
          >
            {item.state === 'done' ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
          </span>
          <span>{item.label}</span>
          <span className="ml-auto truncate text-sm font-semibold text-muted">{item.value}</span>
        </li>
      ))}
    </ol>
  )
}
