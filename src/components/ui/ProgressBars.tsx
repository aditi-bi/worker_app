import { cn } from '@/lib/cn'

/** Row of thin bars; the first `current` are filled (step 2 of 4 fills two). */
export function ProgressBars({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={cn('h-1.5 flex-1 rounded-full', i < current ? 'bg-ink' : 'bg-line')} />
      ))}
    </div>
  )
}
