import { useTranslation } from 'react-i18next'
import type { Sector, SectorId } from '@/api/types'
import { Chip } from '@/components/ui/Chip'
import { Icon } from '@/components/icons/Icon'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { pick } from '@/lib/localized'

interface SectorChipsProps {
  sectors: Sector[]
  value: SectorId | 'all'
  onChange: (value: SectorId | 'all') => void
}

/** Horizontally scrolling work categories ("All work", Building, Factory ...). */
export function SectorChips({ sectors, value, onChange }: SectorChipsProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  return (
    <div role="radiogroup" aria-label={t('sectors.all')} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      <Chip role="radio" selected={value === 'all'} onClick={() => onChange('all')}>
        {t('sectors.all')}
      </Chip>
      {sectors.map((s) => (
        <Chip key={s.id} role="radio" selected={value === s.id} onClick={() => onChange(s.id)}>
          <Icon name={s.id} size={20} />
          {pick(s.name, language)}
        </Chip>
      ))}
    </div>
  )
}
