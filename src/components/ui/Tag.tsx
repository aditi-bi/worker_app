import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TagTone = 'mint' | 'lock' | 'warn' | 'ok' | 'bad' | 'dark'

const TONES: Record<TagTone, string> = {
  mint: 'bg-accent-soft text-[#08584f] dark:text-accent',
  lock: 'bg-surface-2 text-muted',
  warn: 'bg-warn text-warn-ink',
  ok: 'bg-[#c6f2de] text-[#0c5b3b]',
  bad: 'bg-[#ffd9d3] text-[#8a1f12]',
  dark: 'bg-[#26262a] text-accent',
}

/** Small rounded label (status, lock, warning). */
export function Tag({ tone = 'mint', children, className }: { tone?: TagTone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold', TONES[tone], className)}>{children}</span>
}
