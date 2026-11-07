import { useTranslation } from 'react-i18next'
import { Chip } from '@/components/ui/Chip'
import { EXPERIENCE_PRESETS, presetLabel } from '../format'

/** Years of experience as five easy choices. */
export function ExperienceChips({ value, onChange }: { value: number | undefined; onChange: (years: number) => void }) {
  const { t } = useTranslation()
  // A value that is not one of the presets (from the call) is shown as-is so nothing is lost.
  const options = value !== undefined && !EXPERIENCE_PRESETS.some((p) => p === value) ? [...EXPERIENCE_PRESETS, value].sort((a, b) => a - b) : [...EXPERIENCE_PRESETS]
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((years) => (
        <Chip key={years} role="radio" selected={value === years} onClick={() => onChange(years)} className="min-h-14 px-5 text-lg">
          {EXPERIENCE_PRESETS.some((p) => p === years) ? presetLabel(years, t) : `${years}`}
        </Chip>
      ))}
    </div>
  )
}
