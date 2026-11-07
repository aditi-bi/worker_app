import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/icons/Icon'
import { cn } from '@/lib/cn'

interface ListRowProps {
  icon: IconName
  children: ReactNode
  /** Short value shown on the right (current language, area ...). */
  value?: string
  to?: string
  onClick?: () => void
  danger?: boolean
  chevron?: boolean
}

/** White rounded row used in Me, Help and similar lists. Renders a link or a button. */
export function ListRow({ icon, children, value, to, onClick, danger, chevron = true }: ListRowProps) {
  const className = cn(
    'flex min-h-14 w-full items-center gap-3 rounded-[1.1rem] bg-surface px-3.5 text-left font-bold transition active:scale-[0.99]',
    danger && 'text-bad',
  )
  const inner = (
    <>
      <Icon name={icon} />
      <span className="min-w-0 flex-1">{children}</span>
      {value && <span className="text-sm font-semibold text-muted">{value}</span>}
      {chevron && <Icon name="chevronRight" size={18} className="text-muted" />}
    </>
  )
  return to ? (
    <Link to={to} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  )
}
