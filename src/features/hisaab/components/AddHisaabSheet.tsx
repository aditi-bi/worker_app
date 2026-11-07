import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { localIsoDate } from '../hisaabStats'
import { useAddHisaab } from '../useHisaab'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place: z.string().trim().min(2).max(60),
  amount: z.string().regex(/^[1-9]\d{0,5}$/),
})
type Values = z.infer<typeof schema>

/** "Add today": date, place and amount received. Stored only for this worker. */
export function AddHisaabSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const add = useAddHisaab()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { date: localIsoDate(), place: '', amount: '' } })

  const submit = handleSubmit((v) =>
    add.mutate(
      { date: v.date, place: v.place.trim(), amount: Number(v.amount) },
      {
        onSuccess: () => {
          reset({ date: localIsoDate(), place: '', amount: '' })
          onClose()
        },
      },
    ),
  )

  return (
    <BottomSheet open={open} title={t('hisaab.addTitle')} onClose={onClose}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        <TextField label={t('hisaab.date')} type="date" max={localIsoDate()} {...register('date')} />
        <TextField label={t('hisaab.place')} autoComplete="off" error={errors.place ? t('hisaab.placeInvalid') : undefined} {...register('place')} />
        <TextField label={t('hisaab.amount')} prefix="₹" big inputMode="numeric" maxLength={6} error={errors.amount ? t('hisaab.amountInvalid') : undefined} {...register('amount')} />
        {add.isError && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {t('hisaab.saveFailed')}
          </p>
        )}
        <Button type="submit" arrow loading={add.isPending}>
          {t('hisaab.save')}
        </Button>
      </form>
    </BottomSheet>
  )
}
