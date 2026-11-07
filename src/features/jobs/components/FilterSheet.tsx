import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Chip } from '@/components/ui/Chip'
import { Icon } from '@/components/icons/Icon'
import { DEFAULT_FILTERS, sectorIdSchema, type JobFilters, type Sector } from '@/api/types'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { pick } from '@/lib/localized'

const schema = z.object({
  sector: z.union([z.literal('all'), sectorIdSchema]),
  sort: z.enum(['newest', 'pay']),
  wageType: z.enum(['any', 'daily', 'monthly']),
  posted: z.enum(['any', 'today', 'week']),
})
type FormValues = z.infer<typeof schema>

interface FilterSheetProps {
  open: boolean
  filters: JobFilters
  sectors: Sector[]
  /** true for the personalised list, which is already matched to the worker's work. */
  hideWork?: boolean
  onClose: () => void
  onApply: (next: Pick<JobFilters, 'sector' | 'sort' | 'wageType' | 'posted'>) => void
}

/** Sort, pay type and posted-date filters. Edits are held in a form and applied with one tap. */
export function FilterSheet({ open, filters, sectors, hideWork, onClose, onApply }: FilterSheetProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  const { control, setValue, reset, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sector: filters.sector, sort: filters.sort, wageType: filters.wageType, posted: filters.posted },
  })

  // Re-sync the draft each time the sheet opens.
  useEffect(() => {
    if (open) reset({ sector: filters.sector, sort: filters.sort, wageType: filters.wageType, posted: filters.posted })
  }, [open, filters.sector, filters.sort, filters.wageType, filters.posted, reset])

  const values = useWatch({ control })

  const groups: Array<{ name: keyof FormValues; label: string; options: Array<[FormValues[keyof FormValues], string, Sector['id'] | undefined]> }> = [
    {
      name: 'sector',
      label: t('filters.workType'),
      options: [['all', t('sectors.all'), undefined], ...sectors.map((s) => [s.id, pick(s.name, language), s.id] as [Sector['id'], string, Sector['id']])],
    },
    { name: 'sort', label: t('filters.sort'), options: [['newest', t('filters.sortNewest'), undefined], ['pay', t('filters.sortPay'), undefined]] },
    { name: 'wageType', label: t('filters.payType'), options: [['any', t('filters.payAny'), undefined], ['daily', t('filters.payDaily'), undefined], ['monthly', t('filters.payMonthly'), undefined]] },
    { name: 'posted', label: t('filters.posted'), options: [['any', t('filters.postedAny'), undefined], ['today', t('filters.postedToday'), undefined], ['week', t('filters.postedWeek'), undefined]] },
  ]

  return (
    <BottomSheet open={open} title={t('filters.title')} onClose={onClose}>
      <form
        onSubmit={handleSubmit((v) => {
          onApply(v)
          onClose()
        })}
        className="flex flex-col gap-5"
      >
        {groups.filter((g) => !(hideWork && g.name === 'sector')).map((group) => (
          <fieldset key={group.name}>
            <legend className="mb-2 font-bold text-ink">{group.label}</legend>
            <div role="radiogroup" aria-label={group.label} className="flex flex-wrap gap-2">
              {group.options.map(([value, label, icon]) => (
                <Chip
                  key={value}
                  role="radio"
                  selected={values[group.name] === value}
                  onClick={() => setValue(group.name, value as never, { shouldDirty: true })}
                >
                  {icon && <Icon name={icon} size={20} />}
                  {label}
                </Chip>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => reset({ sector: DEFAULT_FILTERS.sector, sort: DEFAULT_FILTERS.sort, wageType: DEFAULT_FILTERS.wageType, posted: DEFAULT_FILTERS.posted })}>
            {t('filters.reset')}
          </Button>
          <Button type="submit" className="flex-1">
            {t('filters.apply')}
          </Button>
        </div>
      </form>
    </BottomSheet>
  )
}
