import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Area } from '@/api/types'
import type { Worker } from '@/api/workerTypes'
import { Icon } from '@/components/icons/Icon'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { useSectors } from '@/features/reference/useReferenceData'
import { pick } from '@/lib/localized'
import { experienceLabel, payLabel, workLabel } from '../format'
import { ProfileEditSheet, type EditField } from './ProfileEditSheet'

/** The profile hero card and the list of every detail (tap a row to change it). Used by My profile and the first "profile created" screen. */
export function ProfileDetails({ worker, area }: { worker: Worker; area?: Area }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const sectors = useSectors()
  const [field, setField] = useState<EditField | null>(null)
  const detail = (label: string, value: string, onClick: () => void) => (
    <li key={label}>
      <button type="button" onClick={onClick} aria-label={`${t('common.edit')}: ${label}`} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
        <span className="flex-1 text-sm font-semibold text-muted">{label}</span>
        <b className="max-w-[55%] text-right">{value}</b>
        <Icon name="chevronRight" size={18} className="text-muted" />
      </button>
    </li>
  )
  const card = (children: ReactNode) => <ul className="divide-y divide-line overflow-hidden rounded-[1.25rem] border border-line bg-surface">{children}</ul>
  return (
    <>
      <section className="rounded-[1.5rem] bg-night p-5 text-white">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full border-[3px] border-accent text-2xl font-extrabold text-accent">
            {Array.from(worker.name)[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-extrabold">{worker.name}</h2>
            <p className="truncate text-sm text-white/70">{[worker.homePlace, area && pick(area.name, language)].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
          {[
            [t('profile.experience'), experienceLabel(worker.experienceYears, t)],
            [t('profile.pay'), payLabel(worker.expectedPay, language, t)],
            [t('profile.workMode'), t(`profile.mode_${worker.workMode}`)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-white/70">{label}</dt>
              <dd className="mt-0.5 text-sm font-extrabold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">{t('me.details')}</h2>
        {card(
          <>
            {detail(t('profile.name'), worker.name, () => setField('name'))}
            {detail(t('profile.work'), workLabel(worker, sectors.data ?? [], language), () => setField('work'))}
            {detail(t('profile.experience'), experienceLabel(worker.experienceYears, t), () => setField('experience'))}
            {detail(t('profile.pay'), payLabel(worker.expectedPay, language, t), () => setField('pay'))}
            {detail(t('profile.home'), worker.homePlace || '-', () => setField('home'))}
            {detail(t('profile.relocate'), t(worker.willingToRelocate ? 'tap.yes' : 'tap.no'), () => setField('relocate'))}
            {detail(t('profile.age'), worker.age === null ? t('talk.ageSkipped') : t('profile.ageYears', { count: worker.age }), () => setField('age'))}
            {detail(t('profile.workMode'), t(`profile.mode_${worker.workMode}`), () => setField('workMode'))}
            {detail(t('profile.stay'), t(worker.livesOnSite ? 'tap.yes' : 'tap.no'), () => setField('stay'))}
            <li className="flex min-h-14 w-full items-center gap-3 px-4">
              <span className="flex-1 text-sm font-semibold text-muted">{t('profile.mobile')}</span>
              <b>{worker.phoneMasked}</b>
            </li>
            <li>
              <Link to="/location/area" className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
                <span className="flex-1 text-sm font-semibold text-muted">{t('me.area')}</span>
                <b className="max-w-[55%] text-right">{area ? pick(area.name, language) : '-'}</b>
                <Icon name="chevronRight" size={18} className="text-muted" />
              </Link>
            </li>
          </>,
        )}
      </section>

      <ProfileEditSheet worker={worker} field={field} onClose={() => setField(null)} />
    </>
  )
}
