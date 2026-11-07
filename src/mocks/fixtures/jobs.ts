import { L, type LocalizedText } from '@/lib/localized'
import type { GuestJob, SectorId, Wage } from '@/api/types'

/**
 * SAMPLE DATA - clearly fake jobs for developing the screens.
 * No employer names, ratings, reviews or payment promises: guests only ever see
 * title, sector, place, wage range and posted time.
 */
type Row = [
  id: string,
  sector: SectorId,
  title: LocalizedText,
  areaId: string,
  talukaId: string | null,
  wage: Wage,
  postedHoursAgo: number,
]

const d = (min: number, max = min): Wage => ({ min, max, type: 'daily' })
const m = (min: number, max = min): Wage => ({ min, max, type: 'monthly' })

const T = {
  helper: L('साइट हेल्पर', 'साइट हेल्पर', 'Site helper'),
  mason: L('मिस्त्री (चिनाई)', 'गवंडी', 'Mason'),
  bar: L('सरिया का काम', 'सळईचे काम', 'Bar bending'),
  shutter: L('सेंटरिंग कारीगर', 'सेंट्रिंग कारागीर', 'Shuttering carpenter'),
  painter: L('पेंटर', 'पेंटर', 'Painter'),
  loader: L('लोडिंग, अनलोडिंग', 'लोडिंग, अनलोडिंग', 'Loading and unloading'),
  packer: L('पैकिंग हेल्पर', 'पॅकिंग हेल्पर', 'Packing helper'),
  factory: L('फ़ैक्टरी हेल्पर', 'कारखाना हेल्पर', 'Factory helper'),
  machine: L('मशीन ऑपरेटर हेल्पर', 'मशीन ऑपरेटर हेल्पर', 'Machine operator helper'),
  kitchen: L('किचन हेल्पर', 'किचन हेल्पर', 'Kitchen helper'),
  cook: L('रसोइया', 'स्वयंपाकी', 'Cook'),
  waiter: L('वेटर', 'वेटर', 'Waiter'),
  cleaning: L('सफ़ाई कर्मचारी', 'स्वच्छता कर्मचारी', 'Cleaning staff'),
  homeCook: L('घर में खाना बनाना', 'घरी स्वयंपाक', 'Home cooking'),
  care: L('बुज़ुर्गों की देखभाल', 'ज्येष्ठांची देखभाल', 'Elder care'),
  grape: L('अंगूर तोड़ाई', 'द्राक्ष काढणी', 'Grape harvest'),
  pruning: L('छँटाई', 'छाटणी', 'Pruning'),
  spraying: L('दवा छिड़काव', 'फवारणी', 'Spraying'),
}

const ROWS: Row[] = [
  ['s01', 'construction', T.helper, 'mumbai', 'ghatkopar', d(850, 950), 2],
  ['s02', 'construction', T.mason, 'mumbai', 'andheri', d(1100, 1300), 5],
  ['s03', 'construction', T.bar, 'mumbai', 'kurla', d(1000, 1100), 20],
  ['s04', 'loading', T.loader, 'mumbai', 'borivali', d(800, 900), 30],
  ['s05', 'hotel', T.waiter, 'mumbai', 'andheri', m(15000, 18000), 52],
  ['s06', 'domestic', T.cleaning, 'mumbai', 'borivali', m(10000, 13000), 70],
  ['s07', 'construction', T.shutter, 'thane', 'kalyan', d(950, 1050), 3],
  ['s08', 'construction', T.painter, 'thane', 'thane-city', d(900, 1000), 26],
  ['s09', 'factory', T.factory, 'thane', 'bhiwandi', m(14000, 16000), 8],
  ['s10', 'loading', T.packer, 'thane', 'bhiwandi', d(700, 800), 48],
  ['s11', 'hotel', T.kitchen, 'thane', 'ulhasnagar', m(12000, 14000), 100],
  ['s12', 'construction', T.helper, 'navi-mumbai', 'kharghar', d(800, 900), 4],
  ['s13', 'construction', T.mason, 'navi-mumbai', 'panvel', d(1050, 1200), 36],
  ['s14', 'loading', T.loader, 'navi-mumbai', 'vashi', d(850, 950), 12],
  ['s15', 'factory', T.machine, 'navi-mumbai', 'airoli', m(17000, 20000), 60],
  ['s16', 'domestic', T.homeCook, 'navi-mumbai', 'vashi', m(9000, 12000), 140],
  ['s17', 'factory', T.factory, 'palghar', 'boisar', m(13000, 15000), 6],
  ['s18', 'construction', T.helper, 'palghar', 'vasai', d(750, 850), 90],
  ['s19', 'factory', T.machine, 'pune', 'chakan', m(16000, 19000), 10],
  ['s20', 'construction', T.shutter, 'pune', 'hinjewadi', d(1000, 1150), 28],
  ['s21', 'hotel', T.cook, 'pune', 'hadapsar', m(18000, 22000), 44],
  ['s22', 'domestic', T.care, 'pune', 'pimpri', m(11000, 14000), 72],
  ['s23', 'loading', T.loader, 'pune', 'hadapsar', d(750, 850), 200],
  ['s24', 'farm', T.grape, 'nashik', 'dindori', d(500, 600), 5],
  ['s25', 'farm', T.pruning, 'nashik', 'sinnar', d(550, 650), 31],
  ['s26', 'farm', T.spraying, 'nashik', 'dindori', d(500, 550), 55],
  ['s27', 'factory', T.factory, 'nashik', 'nashik-road', m(12000, 14000), 18],
  ['s28', 'factory', T.machine, 'sambhajinagar', 'waluj', m(15000, 18000), 7],
  ['s29', 'construction', T.helper, 'sambhajinagar', 'chikalthana', d(700, 800), 40],
  ['s30', 'construction', T.mason, 'latur', 'latur-city', d(850, 1000), 15],
  ['s31', 'farm', T.pruning, 'latur', 'ausa', d(450, 550), 66],
  ['s32', 'construction', T.helper, 'beed', 'beed-city', d(650, 750), 9],
  ['s33', 'hotel', T.kitchen, 'nanded', 'nanded-city', m(9000, 11000), 120],
]

/** Built once at start-up so "posted 2 hours ago" stays believable during a session. */
const NOW = Date.now()

export const GUEST_JOBS: GuestJob[] = ROWS.map(([id, sector, title, areaId, talukaId, wage, hoursAgo]) => ({
  id,
  sector,
  title,
  areaId,
  talukaId,
  wage,
  postedAt: new Date(NOW - hoursAgo * 3600 * 1000).toISOString(),
}))
