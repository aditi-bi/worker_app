import { cn } from '@/lib/cn'

/** Grey placeholder block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-surface-2', className)} />
}
