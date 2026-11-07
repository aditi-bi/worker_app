import { L } from '@/lib/localized'
import type { Sector } from '@/api/types'

/** The six work categories, labels taken from the original prototype. */
export const SECTORS: Sector[] = [
  { id: 'construction', name: L('बांधकाम', 'बांधकाम', 'Building work') },
  { id: 'loading', name: L('गोदाम, लोडिंग', 'गोदाम, लोडिंग', 'Warehouses, loading') },
  { id: 'factory', name: L('फ़ैक्टरी', 'कारखाना', 'Factory') },
  { id: 'hotel', name: L('होटल, रसोई', 'हॉटेल, स्वयंपाकघर', 'Hotel, kitchen') },
  { id: 'domestic', name: L('घर, सोसाइटी', 'घर, सोसायटी', 'Homes, societies') },
  { id: 'farm', name: L('खेती', 'शेती', 'Farm work') },
]
