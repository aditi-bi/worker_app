import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Icon } from '@/components/icons/Icon'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { AddHisaabSheet } from '@/features/hisaab/components/AddHisaabSheet'
import { lastSevenDays, localIsoDate, monthOf, summarise } from '@/features/hisaab/hisaabStats'
import { useHisaab, useRemoveHisaab } from '@/features/hisaab/useHisaab'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { formatNumber } from '@/lib/format'
import { useNavigate } from 'react-router-dom'

const LOCALES = { hi: 'hi-IN', mr: 'mr-IN', en: 'en-IN' } as const

/** Personal log of days worked and money received. Private to the worker. */
export default function HisaabPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const month = monthOf(localIsoDate())
  const query = useHisaab(month)
  const remove = useRemoveHisaab()
  const [adding, setAdding] = useState(false)

  const entries = useMemo(() => [...(query.data?.items ?? [])].sort((a, b) => b.date.localeCompare(a.date)), [query.data])
  const { total, daysWorked } = summarise(entries)
  const bars = lastSevenDays(entries)
  const max = Math.max(...bars, 1)
  const monthName = new Date().toLocaleDateString(LOCALES[language], { month: 'long' })

  return (
    <AppShell header={<PageHeader title={t('hisaab.title')} onBack={() => navigate('/me')} />} footer={<BottomNav />}>
      {query.isPending ? (
        <div role="status" aria-busy="true" aria-label={t('common.loading')} className="h-44 animate-pulse rounded-[1.75rem] bg-surface-2" />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-[1.75rem] bg-night p-4 text-white">
            <span className="text-sm text-white/65">{t('hisaab.monthSoFar', { month: monthName })}</span>
            <b className="text-4xl text-accent">₹{formatNumber(total, language)}</b>
            <span className="text-sm text-white/75">{t('hisaab.daysWorked', { count: daysWorked })}</span>
            <div className="mt-1 flex h-16 items-end gap-1.5" aria-hidden="true">
              {bars.map((v, i) => (
                <i key={i} className="flex-1 rounded-md bg-accent" style={{ height: `${Math.max(v ? 12 : 4, (v / max) * 100)}%`, opacity: v ? 1 : 0.25 }} />
              ))}
            </div>
          </div>
          <Button arrow icon={<Icon name="plus" size={22} />} onClick={() => setAdding(true)}>
            {t('hisaab.addToday')}
          </Button>
          {entries.length === 0 ? (
            <EmptyState icon="doc" title={t('hisaab.emptyTitle')} body={t('hisaab.emptyBody')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-[1.1rem] bg-surface px-3.5 py-2.5">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{e.place}</b>
                    <small className="text-muted">{new Date(`${e.date}T00:00:00`).toLocaleDateString(LOCALES[language], { day: 'numeric', month: 'short' })}</small>
                  </span>
                  <b>₹{formatNumber(e.amount, language)}</b>
                  <button type="button" aria-label={t('hisaab.removeLabel', { place: e.place })} onClick={() => remove.mutate(e.id)} className="flex size-11 items-center justify-center rounded-full text-muted active:bg-surface-2">
                    <Icon name="trash" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted">{t('hisaab.private')}</p>
        </div>
      )}
      <AddHisaabSheet open={adding} onClose={() => setAdding(false)} />
    </AppShell>
  )
}
