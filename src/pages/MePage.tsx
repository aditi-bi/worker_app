import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/icons/Icon'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ProfileDetails } from '@/features/profile/components/ProfileDetails'
import { Link } from 'react-router-dom'
import { useLanguage, usePreferences } from '@/features/preferences/PreferencesContext'
import { useMe } from '@/features/profile/useProfile'
import { useAreas } from '@/features/reference/useReferenceData'

const LANGUAGE_NAME = { hi: 'हिंदी', mr: 'मराठी', en: 'English' } as const

/** My profile: a hero card, every detail (tap to change), help and settings, delete my data. */
export default function MePage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const { area: selected } = usePreferences()
  const me = useMe()
  const areas = useAreas()

  const area = areas.data?.find((a) => a.id === selected?.areaId)
  const worker = me.data

  const card = (children: ReactNode) => <ul className="divide-y divide-line overflow-hidden rounded-[1.25rem] border border-line bg-surface">{children}</ul>
  const link = (to: string, icon: 'help' | 'globe' | 'doc' | 'pin' | 'rupee', title: string, sub?: string, value?: string, red?: boolean) => (
    <li key={to}>
      <Link to={to} className="flex min-h-16 w-full items-center gap-3 px-4 text-left">
        <span aria-hidden="true" className={red ? 'flex size-11 shrink-0 items-center justify-center rounded-full bg-bad text-white' : 'flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink'}>
          <Icon name={icon} />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block">{title}</b>
          {sub && <span className="block text-sm text-muted">{sub}</span>}
        </span>
        {value && <b className="text-sm">{value}</b>}
        <Icon name="chevronRight" size={18} className="text-muted" />
      </Link>
    </li>
  )

  return (
    <AppShell header={<PageHeader title={t('menu.myProfile')} onBack={() => navigate('/jobs')} />} footer={<BottomNav />}>
      {me.isPending ? (
        <div role="status" aria-busy="true" aria-label={t('common.loading')} className="h-64 animate-pulse rounded-[1.25rem] bg-surface-2" />
      ) : !worker ? (
        <ErrorState onRetry={() => void me.refetch()} retrying={me.isRefetching} />
      ) : (
        <div className="flex flex-col gap-5">
          <ProfileDetails worker={worker} area={area} />

          <section className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold">{t('me.helpSettings')}</h2>
            {card(
              <>
                {link('/help', 'help', t('nav.help'), t('me.helpSub'), undefined, true)}
                {link('/language', 'globe', t('me.language'), undefined, LANGUAGE_NAME[language])}
                {link('/rates', 'rupee', t('nav.rates'))}
                {link('/hisaab', 'doc', t('me.hisaab'), t('me.hisaabSub'))}
              </>,
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}
