import type { GuestJob, SectorId } from '@/api/types'
import type { FullJob, Worker } from '@/api/workerTypes'
import { L, type LocalizedText } from '@/lib/localized'
import { SECTORS } from './sectors'

/** SAMPLE DATA - invented employers and conditions, used only by the mock API. */
const EMPLOYERS: Record<SectorId, string[]> = {
  construction: ['Desai Construction', 'Sample Builders', 'Patil Site Works'],
  loading: ['Sample Logistics', 'Shinde Transport'],
  factory: ['Sample Industries', 'Kale Fabrication'],
  hotel: ['Sample Kitchens', 'Hotel Sample'],
  domestic: ['Sample Home Services'],
  farm: ['Sample Farms', 'Jadhav Orchards'],
}

const STAY: Partial<Record<SectorId, LocalizedText>> = {
  construction: L('कमरा, 4 लोग', 'खोली, 4 जण', 'Room, 4 people'),
  factory: L('हॉस्टल उपलब्ध', 'हॉस्टेल उपलब्ध', 'Hostel available'),
  farm: L('खेत पर रहना', 'शेतावर राहणे', 'Stay on the farm'),
}

const HOURS: Record<SectorId, LocalizedText> = {
  construction: L('सुबह 8 से शाम 5', 'सकाळी 8 ते संध्याकाळी 5', '8 am to 5 pm'),
  loading: L('सुबह 7 से दोपहर 3', 'सकाळी 7 ते दुपारी 3', '7 am to 3 pm'),
  factory: L('शिफ़्ट 8 घंटे', 'शिफ्ट 8 तास', '8-hour shift'),
  hotel: L('दोपहर 11 से रात 9', 'सकाळी 11 ते रात्री 9', '11 am to 9 pm'),
  domestic: L('सुबह 8 से शाम 4', 'सकाळी 8 ते संध्याकाळी 4', '8 am to 4 pm'),
  farm: L('सुबह 6 से दोपहर 2', 'सकाळी 6 ते दुपारी 2', '6 am to 2 pm'),
}

const GEAR: Partial<Record<SectorId, LocalizedText>> = {
  construction: L('हेल्मेट, जूते', 'हेल्मेट, बूट', 'Helmet, boots on site'),
  factory: L('सेफ़्टी जूते', 'सेफ्टी बूट', 'Safety shoes'),
}

const STARTS: LocalizedText[] = [L('सोमवार', 'सोमवार', 'Monday'), L('अगले हफ़्ते', 'पुढच्या आठवड्यात', 'Next week'), L('इसी हफ़्ते', 'याच आठवड्यात', 'This week')]

function hash(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

export function toFullJob(job: GuestJob, worker: Worker | null, appliedJobIds: Set<string>): FullJob {
  const h = hash(job.id)
  const employers = EMPLOYERS[job.sector]
  const matches = !!worker && worker.sectors.includes(job.sector)
  const sectorName = SECTORS.find((s) => s.id === job.sector)?.name ?? null
  return {
    ...job,
    employer: { name: employers[h % employers.length] },
    distanceKm: 4 + (h % 41),
    matchReason: matches ? sectorName : null,
    stay: STAY[job.sector] ?? null,
    hours: HOURS[job.sector],
    gear: GEAR[job.sector] ?? null,
    payCycle: job.wage.type === 'monthly' ? 'monthly' : job.sector === 'construction' ? 'weekly' : 'daily',
    starts: STARTS[h % STARTS.length],
    durationWeeks: job.wage.type === 'daily' ? 4 + (h % 9) : null,
    applied: appliedJobIds.has(job.id),
  }
}
