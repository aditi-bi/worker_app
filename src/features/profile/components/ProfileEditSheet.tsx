import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SectorId } from '@/api/types'
import type { Worker, WorkerPatch } from '@/api/workerTypes'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { workModeSchema } from '@/api/workerTypes'
import { Chip } from '@/components/ui/Chip'
import { useSectors } from '@/features/reference/useReferenceData'
import { useUpdateMe } from '../useProfile'
import { ExperienceChips } from './ExperienceChips'
import { PayFields } from './PayFields'
import { WorkTiles } from './WorkTiles'

export type EditField = 'name' | 'work' | 'experience' | 'pay' | 'home' | 'relocate' | 'age' | 'workMode' | 'stay'

interface Props {
  worker: Worker
  field: EditField | null
  onClose: () => void
}

const TITLES: Record<EditField, string> = {
  name: 'profile.name',
  work: 'profile.editWork',
  experience: 'profile.experience',
  pay: 'profile.pay',
  home: 'profile.home',
  relocate: 'profile.relocate',
  age: 'profile.age',
  workMode: 'profile.workMode',
  stay: 'profile.stay',
}

/** One small form per detail, opened from the pencil on the profile page. Saves with PATCH /me. */
export function ProfileEditSheet({ worker, field, onClose }: Props) {
  const { t } = useTranslation()
  if (!field) return null
  return (
    <BottomSheet open title={t(TITLES[field])} onClose={onClose}>
      <EditForm key={field} worker={worker} field={field} onClose={onClose} />
    </BottomSheet>
  )
}

function EditForm({ worker, field, onClose }: { worker: Worker; field: EditField; onClose: () => void }) {
  const { t } = useTranslation()
  const update = useUpdateMe()
  const sectors = useSectors()
  const [name, setName] = useState(worker.name)
  const [picked, setPicked] = useState<SectorId[]>(worker.sectors)
  const [years, setYears] = useState<number>(worker.experienceYears)
  const [payType, setPayType] = useState(worker.expectedPay.type)
  const [amount, setAmount] = useState(String(worker.expectedPay.amount))
  const [home, setHome] = useState(worker.homePlace)
  const [relocate, setRelocate] = useState(worker.willingToRelocate)
  const [age, setAge] = useState(worker.age === null ? '' : String(worker.age))
  const [mode, setMode] = useState(worker.workMode)
  const [stay, setStay] = useState(worker.livesOnSite)
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    let patch: WorkerPatch
    if (field === 'name') {
      if (name.trim().length < 2) return setError(t('tap.nameInvalid'))
      patch = { name: name.trim() }
    } else if (field === 'work') {
      if (picked.length === 0) return setError(t('profile.editWork'))
      patch = { sectors: picked }
    } else if (field === 'home') {
      if (home.trim().length < 2) return setError(t('tap.homeInvalid'))
      patch = { homePlace: home.trim() }
    } else if (field === 'relocate') {
      patch = { willingToRelocate: relocate }
    } else if (field === 'age') {
      if (age !== '' && !(/^\d{2}$/.test(age) && Number(age) >= 14 && Number(age) <= 80)) return setError(t('tap.ageInvalid'))
      patch = { age: age === '' ? null : Number(age) }
    } else if (field === 'workMode') {
      patch = { workMode: mode }
    } else if (field === 'stay') {
      patch = { livesOnSite: stay }
    } else if (field === 'experience') {
      patch = { experienceYears: years }
    } else {
      if (!/^\d{3,6}$/.test(amount)) return setError(t('tap.payInvalid'))
      patch = { expectedPay: { amount: Number(amount), type: payType } }
    }
    setError(null)
    update.mutate(patch, { onSuccess: onClose })
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      {field === 'name' && <TextField label={t('profile.name')} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={error ?? undefined} />}
      {field === 'home' && <TextField label={t('profile.home')} autoComplete="off" value={home} onChange={(e) => setHome(e.target.value)} error={error ?? undefined} />}
      {field === 'age' && <TextField label={t('profile.age')} inputMode="numeric" maxLength={2} placeholder={t('tap.agePlaceholder')} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))} error={error ?? undefined} />}
      {(field === 'relocate' || field === 'stay') && (
        <div role="radiogroup" className="flex gap-2">
          {[true, false].map((v) => {
            const current = field === 'relocate' ? relocate : stay
            return (
              <Chip key={String(v)} role="radio" selected={current === v} className="min-h-14 flex-1 justify-center text-lg" onClick={() => (field === 'relocate' ? setRelocate(v) : setStay(v))}>
                {t(v ? 'tap.yes' : 'tap.no')}
              </Chip>
            )
          })}
        </div>
      )}
      {field === 'workMode' && (
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {workModeSchema.options.map((m) => (
            <Chip key={m} role="radio" selected={mode === m} className="min-h-14 px-5 text-lg" onClick={() => setMode(m)}>
              {t(`profile.mode_${m}`)}
            </Chip>
          ))}
        </div>
      )}
      {field === 'work' && <WorkTiles multiple sectors={sectors.data ?? []} value={picked} onChange={setPicked} />}
      {field === 'experience' && <ExperienceChips value={years} onChange={setYears} />}
      {field === 'pay' && (
        <PayFields type={payType} onTypeChange={setPayType} error={error ?? undefined} amountProps={{ value: amount, onChange: (e) => setAmount(e.target.value.replace(/\D/g, '')) }} />
      )}
      {field === 'work' && error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}
      {update.isError && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {t('profile.saveFailed')}
        </p>
      )}
      <Button type="submit" arrow loading={update.isPending}>
        {t('common.save')}
      </Button>
    </form>
  )
}
