import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { sectorIdSchema } from '@/api/types'
import { PHONE_PATTERN, workModeSchema } from '@/api/workerTypes'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { ProgressBars } from '@/components/ui/ProgressBars'
import { TextField } from '@/components/ui/TextField'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { ConsentField } from '@/features/profile/components/ConsentField'
import { ExperienceChips } from '@/features/profile/components/ExperienceChips'
import { PayFields } from '@/features/profile/components/PayFields'
import { WorkTiles } from '@/features/profile/components/WorkTiles'
import { SaveError } from '@/features/profile/components/SaveError'
import { useRegister } from '@/features/profile/useProfile'
import { useSectors } from '@/features/reference/useReferenceData'
import { Highlighted, plain } from '@/lib/highlight'

const schema = z.object({
  name: z.string().trim().min(2),
  sector: sectorIdSchema,
  experienceYears: z.number().min(0).max(60),
  payAmount: z.string().regex(/^\d{3,6}$/),
  payType: z.enum(['daily', 'monthly']),
  home: z.string().trim().min(2),
  relocate: z.boolean(),
  age: z.string().refine((v) => v === '' || (/^\d{2}$/.test(v) && Number(v) >= 14 && Number(v) <= 80)),
  workMode: workModeSchema,
  stay: z.boolean(),
  phone: z.string().regex(PHONE_PATTERN),
  consent: z.boolean().refine((v) => v),
})
type FormValues = z.infer<typeof schema>

const STEPS = ['name', 'sector', 'experienceYears', 'payAmount', 'home', 'relocate', 'age', 'workMode', 'stay', 'phone'] as const

/** The same questions as the voice flow, one per screen. Always available. */
export default function TapFormPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const sectors = useSectors()
  const register = useRegister()
  const [step, setStep] = useState(0)
  const {
    register: field,
    control,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', payType: 'daily', payAmount: '', home: '', age: '', phone: '', consent: false }, mode: 'onSubmit' })
  const values = useWatch({ control })

  const question = [t('tap.qName'), t('tap.qWork'), t('tap.qExperience'), t('tap.qPay'), t('tap.qHome'), t('tap.qRelocate'), t('tap.qAge'), t('tap.qWorkMode'), t('tap.qStay'), t('tap.qMobile')][step]
  const last = step === STEPS.length - 1

  const next = async () => {
    if (await trigger(STEPS[step])) setStep(step + 1)
  }

  const finish = handleSubmit((v) => {
    register.mutate(
      {
        name: v.name.trim(),
        sectors: [v.sector],
        experienceYears: v.experienceYears,
        expectedPay: { amount: Number(v.payAmount), type: v.payType },
        homePlace: v.home.trim(),
        willingToRelocate: v.relocate,
        age: v.age === '' ? null : Number(v.age),
        workMode: v.workMode,
        livesOnSite: v.stay,
        phone: v.phone,
        consent: true,
        language,
      },
      { onSuccess: () => navigate('/profile', { replace: true, state: { first: true } }) },
    )
  })

  const back = () => (step === 0 ? navigate('/talk') : setStep(step - 1))

  return (
    <AppShell header={<PageHeader title={t('tap.title')} onBack={back} />}>
      <form
        className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void (last ? finish() : next())
        }}
      >
        <p className="sr-only" aria-live="polite">
          {t('tap.step', { current: step + 1, total: STEPS.length })} {plain(question)}
        </p>
        <ProgressBars total={STEPS.length} current={step + 1} />
        <h1 className="text-2xl leading-tight font-extrabold">
          <Highlighted text={question} />
        </h1>

        {step === 0 && (
          <TextField label={t('tap.stepName')} autoComplete="name" autoFocus placeholder={t('tap.namePlaceholder')} error={errors.name ? t('tap.nameInvalid') : undefined} {...field('name')} />
        )}
        {step === 1 && <WorkTiles sectors={sectors.data ?? []} value={values.sector ? [values.sector] : []} onChange={([id]) => setValue('sector', id, { shouldValidate: true })} />}
        {step === 2 && <ExperienceChips value={values.experienceYears} onChange={(y) => setValue('experienceYears', y, { shouldValidate: true })} />}
        {step === 3 && (
          <PayFields type={values.payType ?? 'daily'} onTypeChange={(type) => setValue('payType', type)} error={errors.payAmount ? t('tap.payInvalid') : undefined} amountProps={field('payAmount')} />
        )}
        {step === 4 && <TextField label={t('tap.stepHome')} autoFocus autoComplete="off" placeholder={t('tap.homePlaceholder')} error={errors.home ? t('tap.homeInvalid') : undefined} {...field('home')} />}
        {step === 5 && <YesNo value={values.relocate} onChange={(v) => setValue('relocate', v, { shouldValidate: true })} error={!!errors.relocate} />}
        {step === 6 && <TextField label={t('tap.stepAge')} inputMode="numeric" maxLength={2} autoFocus placeholder={t('tap.agePlaceholder')} error={errors.age ? t('tap.ageInvalid') : undefined} {...field('age')} />}
        {step === 7 && (
          <div role="radiogroup" className="flex flex-wrap gap-2">
            {workModeSchema.options.map((m) => (
              <Chip key={m} role="radio" selected={values.workMode === m} className="min-h-14 px-5 text-lg" onClick={() => setValue('workMode', m, { shouldValidate: true })}>
                {t(`profile.mode_${m}`)}
              </Chip>
            ))}
            {errors.workMode && <p role="alert" className="w-full text-sm font-semibold text-bad">{t('tap.chooseOne')}</p>}
          </div>
        )}
        {step === 8 && <YesNo value={values.stay} onChange={(v) => setValue('stay', v, { shouldValidate: true })} error={!!errors.stay} />}
        {step === 9 && (
          <>
            <TextField
              label={t('tap.phoneLabel')}
              prefix="+91"
              big
              autoFocus
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="98765 43210"
              error={errors.phone ? t('tap.phoneInvalid') : undefined}
              {...field('phone')}
            />
            <ConsentField checked={values.consent ?? false} onChange={(v) => setValue('consent', v, { shouldValidate: true })} error={!!errors.consent} />
          </>
        )}

        {register.isError && <SaveError error={register.error} />}
        <div className="mt-auto">
          <Button type="submit" block arrow loading={register.isPending}>
            {last ? t('common.finish') : t('common.next')}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}

function YesNo({ value, onChange, error }: { value: boolean | undefined; onChange: (v: boolean) => void; error: boolean }) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      <Chip role="radio" selected={value === true} className="min-h-14 flex-1 justify-center text-lg" onClick={() => onChange(true)}>
        {t('tap.yes')}
      </Chip>
      <Chip role="radio" selected={value === false} className="min-h-14 flex-1 justify-center text-lg" onClick={() => onChange(false)}>
        {t('tap.no')}
      </Chip>
      {error && (
        <p role="alert" className="w-full text-sm font-semibold text-bad">
          {t('tap.chooseOne')}
        </p>
      )}
    </div>
  )
}
