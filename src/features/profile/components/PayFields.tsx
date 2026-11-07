import type { InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/components/ui/Chip'
import { TextField } from '@/components/ui/TextField'

type PayType = 'daily' | 'monthly'

interface PayFieldsProps {
  type: PayType
  onTypeChange: (type: PayType) => void
  error?: string
  amountProps: InputHTMLAttributes<HTMLInputElement>
}

/** Pay type (per day / per month) and the amount. The amount input is registered by the parent form. */
export function PayFields({ type, onTypeChange, error, amountProps }: PayFieldsProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" className="flex gap-2">
        <Chip role="radio" selected={type === 'daily'} onClick={() => onTypeChange('daily')}>
          {t('filters.payDaily')}
        </Chip>
        <Chip role="radio" selected={type === 'monthly'} onClick={() => onTypeChange('monthly')}>
          {t('filters.payMonthly')}
        </Chip>
      </div>
      <TextField label={t('verify.payAmount')} prefix="₹" big inputMode="numeric" maxLength={6} placeholder={type === 'daily' ? '1000' : '15000'} error={error} {...amountProps} />
    </div>
  )
}
