import type { Sector, SectorId } from '@/api/types'
import { Tile } from '@/components/ui/Tile'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { pick } from '@/lib/localized'

interface WorkTilesProps {
  sectors: Sector[]
  value: SectorId[]
  onChange: (next: SectorId[]) => void
  /** false = tapping a tile replaces the choice (fallback form), true = pick several (edit). */
  multiple?: boolean
}

/** The six work categories as big tiles. */
export function WorkTiles({ sectors, value, onChange, multiple }: WorkTilesProps) {
  const language = useLanguage()
  const toggle = (id: SectorId) => {
    if (!multiple) return onChange([id])
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }
  return (
    <div className="grid grid-cols-2 gap-2.5" role="group">
      {sectors.map((s) => (
        <Tile key={s.id} icon={s.id} label={pick(s.name, language)} selected={value.includes(s.id)} onClick={() => toggle(s.id)} />
      ))}
    </div>
  )
}
