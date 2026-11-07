import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon, type IconName } from '@/components/icons/Icon'
import { AskPhalaSheet } from '@/features/help/AskPhalaSheet'
import { cn } from '@/lib/cn'

interface Item {
  to: string
  icon: IconName
  labelKey: string
}

const LEFT: Item[] = [{ to: '/jobs', icon: 'briefcase', labelKey: 'nav.jobs' }]
const RIGHT: Item[] = [{ to: '/applications', icon: 'doc', labelKey: 'nav.applied' }]

/** Bottom bar: Jobs, the raised voice button (Ask Phala, calls only when tapped) and Applied. Rates, Help and language live in the profile menu at the top right. */
export function BottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [askOpen, setAskOpen] = useState(false)

  const tab = (item: Item) => {
    const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
    return (
      <li key={item.to}>
        <NavLink
          to={item.to}
          aria-current={active ? 'page' : undefined}
          className={cn('flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition', active ? 'text-ink' : 'text-muted hover:text-ink')}
        >
          <span className={cn('rounded-full px-4 py-1', active && 'bg-accent text-accent-ink')}>
            <Icon name={item.icon} />
          </span>
          {t(item.labelKey)}
        </NavLink>
      </li>
    )
  }

  return (
    <>
      <nav aria-label={t('nav.label')} className="sticky bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-3 items-end">
          {LEFT.map(tab)}
          <li className="flex justify-center">
            <button type="button" onClick={() => setAskOpen(true)} aria-haspopup="dialog" className="-mt-7 flex flex-col items-center gap-0.5 text-xs font-bold text-ink">
              <span className="flex size-14 items-center justify-center rounded-full border-4 border-surface bg-night text-accent shadow-[0_0_0_3px_#3fe3d2]">
                <Icon name="mic" size={26} />
              </span>
              <span className="pb-1.5">{t('nav.askPhala')}</span>
            </button>
          </li>
          {RIGHT.map(tab)}
        </ul>
      </nav>
      <AskPhalaSheet open={askOpen} onClose={() => setAskOpen(false)} />
    </>
  )
}
