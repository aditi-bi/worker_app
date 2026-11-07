import type { Sector, SectorId } from '@/api/types'
import type { ExpectedPay, WorkMode } from '@/api/workerTypes'
import { pick } from '@/lib/localized'
import type { Language } from '@/i18n'

/**
 * Turns what the worker SAID (a speech-to-text sentence in Hindi, Marathi or English) into the
 * profile fields. Every parser returns null when it is not sure; the screen then asks again or
 * offers the tapped form. We never guess.
 */

const DEVANAGARI_DIGITS = '०१२३४५६७८९'

/** Replaces Devanagari digits with 0-9 and lower-cases. */
export function normalize(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const i = DEVANAGARI_DIGITS.indexOf(ch)
      return i >= 0 ? String(i) : ch
    })
    .join('')
    .toLowerCase()
    .trim()
}

/* ---------- name ---------- */

const NAME_LEAD = /^(my name is|i am|i'm|this is|mera naam|mera nam|मेरा नाम|माझं नाव|माझे नाव|माझ नाव|मैं|मी)\s+/i
const NAME_TAIL = /\s+(hai|है|आहे|है जी|ji|जी)$/i

export function parseName(text: string): string | null {
  let value = text.trim().replace(/[.,!?।]+$/g, '')
  value = value.replace(NAME_LEAD, '').replace(NAME_TAIL, '').trim()
  if (/\d/.test(value)) return null
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length === 0 || words.length > 4 || value.length < 2) return null
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/* ---------- work ---------- */

/** Words workers actually say for each work category (Latin spellings are common in speech-to-text). */
const WORK_WORDS: Record<SectorId, string[]> = {
  construction: ['mason', 'mistri', 'mistry', 'construction', 'building', 'carpenter', 'bar bending', 'painter', 'plumber', 'मिस्त्री', 'मिस्री', 'गवंडी', 'बांधकाम', 'निर्माण', 'कारपेंटर', 'सुतार', 'पेंटर', 'मजदूर', 'मजूर', 'helper', 'हेल्पर'],
  loading: ['loading', 'unloading', 'loader', 'hamal', 'porter', 'लोडिंग', 'अनलोडिंग', 'लोडर', 'हमाल', 'माथाडी'],
  factory: ['factory', 'company', 'machine', 'operator', 'फैक्टरी', 'फॅक्टरी', 'कारखाना', 'कंपनी', 'मशीन'],
  hotel: ['hotel', 'kitchen', 'cook', 'chef', 'waiter', 'dhaba', 'होटल', 'हॉटेल', 'किचन', 'रसोई', 'स्वयंपाक', 'कुक', 'वेटर', 'ढाबा'],
  domestic: ['domestic', 'maid', 'house work', 'housework', 'cleaning', 'cleaner', 'घर का काम', 'घरकाम', 'झाड़ू', 'सफाई', 'सफाईचे', 'मोलकरीण', 'बाई'],
  farm: ['farm', 'farming', 'kheti', 'agriculture', 'खेती', 'शेती', 'खेत', 'शेत', 'किसान', 'शेतकरी'],
}

/** Returns the work categories mentioned, in the order of the sectors list; null when none matched. */
export function parseWork(text: string, sectors: Sector[]): SectorId[] | null {
  const said = normalize(text)
  if (!said) return null
  const found = sectors.filter((s) => {
    const names = [s.name.hi, s.name.mr, s.name.en].map((n) => n.toLowerCase())
    return WORK_WORDS[s.id].some((w) => said.includes(w)) || names.some((n) => n.length > 2 && said.includes(n))
  })
  return found.length > 0 ? found.map((s) => s.id) : null
}

/* ---------- numbers ---------- */

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, 'twenty five': 25, thirty: 30,
  एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5, पांच: 5, छह: 6, छः: 6, सात: 7, आठ: 8, नौ: 9, दस: 10, बारह: 12, पंद्रह: 15, बीस: 20, पच्चीस: 25, तीस: 30,
  दोन: 2, पाच: 5, सहा: 6, नऊ: 9, दहा: 10, बारा: 12, पंधरा: 15, वीस: 20, पंचवीस: 25,
}
const HUNDRED = ['सौ', 'शे', 'हंड्रेड', 'hundred', 'sau']
const THOUSAND = ['हज़ार', 'हजार', 'हजारो', 'thousand', 'hazar', 'hajar']

/** First number in the sentence: digits ("4", "1,200", "४") or a simple spoken number ("चार", "बारह सौ", "one thousand"). */
export function parseNumber(text: string): number | null {
  const said = normalize(text).replace(/(\d),(\d)/g, '$1$2')
  const digits = said.match(/\d+/)
  if (digits) {
    const n = Number(digits[0])
    // "5 hazar" / "5 हज़ार": the digit is a multiplier.
    if (THOUSAND.some((w) => said.includes(w))) return n < 1000 ? n * 1000 : n
    return n
  }
  const tokens = said.split(/[\s,.]+/).filter(Boolean)
  let total = 0
  let current: number | null = null
  let any = false
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const pair = `${token} ${tokens[i + 1] ?? ''}`.trim()
    if (UNITS[pair] !== undefined) {
      current = UNITS[pair]
      any = true
      i++
    } else if (UNITS[token] !== undefined) {
      current = UNITS[token]
      any = true
    } else if (HUNDRED.includes(token)) {
      total += (current ?? 1) * 100
      current = null
      any = true
    } else if (THOUSAND.includes(token)) {
      total += (current ?? 1) * 1000
      current = null
      any = true
    }
  }
  if (!any) return null
  return total + (current ?? 0)
}

export function parseExperience(text: string): number | null {
  const n = parseNumber(text)
  if (n === null || n < 0 || n > 60) return null
  return n
}

/** Pay: "1000", "बारह सौ", "15000 per month". Says monthly when the sentence mentions month. */
export function parsePay(text: string): ExpectedPay | null {
  const n = parseNumber(text)
  if (n === null || n < 100 || n > 100000) return null
  const said = normalize(text)
  const monthly = /month|महीना|महिना|माह|मासिक|महिन्या/.test(said)
  return { amount: n, type: monthly ? 'monthly' : 'daily' }
}

/* ---------- phone ---------- */

/** Mobile number from speech or typing: keeps the digits, drops +91 / 0 prefixes, needs 10 digits starting 6-9. */
export function parsePhone(text: string): string | null {
  let digits = normalize(text).replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

/** "98765 43210" for display. */
export function formatPhone(phone: string): string {
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone
}

export function workNames(ids: SectorId[], sectors: Sector[], language: Language): string {
  return ids
    .map((id) => sectors.find((s) => s.id === id))
    .filter((s): s is Sector => !!s)
    .map((s) => pick(s.name, language))
    .join(', ')
}

/* ---------- yes / no, home place, age, kind of work ---------- */

const NO_WORDS = ['no', 'nope', 'nahi', 'nahin', 'nai', 'नहीं', 'नही', 'नाही', 'नको', 'ना']
const YES_WORDS = ['yes', 'yeah', 'yep', 'haan', 'han', 'ha', 'haa', 'ji', 'हाँ', 'हां', 'हा', 'जी', 'होय', 'हो', 'ठीक', 'ok', 'okay']

/** Yes or no, in any of the three languages. "no" wins when both appear ("नहीं, हां" is rare). */
export function parseYesNo(text: string): boolean | null {
  const tokens = normalize(text).split(/[\s,.!?।]+/).filter(Boolean)
  if (tokens.some((w) => NO_WORDS.includes(w))) return false
  if (tokens.some((w) => YES_WORDS.includes(w))) return true
  return null
}

const PLACE_LEAD = /^(i am from|i'm from|i come from|my village is|my home is|my place is|village|mera gaon|mera ghar|मेरा गाँव|मेरा गांव|मेरा घर|मेरा गाव|माझं गाव|माझे गाव|माझा गाव|मैं|मी)\s+/i
const PLACE_TAIL = /\s+(se hoon|se hu|se aaya hoon|से हूँ|से हूं|से आया हूँ|से आया हूं|से आलो|से|चा आहे|हून आलो|आहे|है|ka hoon|का हूँ|का हूं)$/i

/** Village or town as said. Free text, so only the sentence frame is removed. */
export function parsePlace(text: string): string | null {
  let value = text.trim().replace(/[.,!?।]+$/g, '')
  value = value.replace(PLACE_LEAD, '').replace(PLACE_TAIL, '').trim()
  if (/\d/.test(value)) return null
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length === 0 || words.length > 5 || value.length < 2) return null
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function parseAge(text: string): number | null {
  const n = parseNumber(text)
  return n !== null && n >= 14 && n <= 80 ? n : null
}

/** "No need to say": used by the optional age question. */
export function isSkip(text: string): boolean {
  return /skip|pass|don'?t want|rather not|nahi bata|नहीं बताना|नही बताना|नहीं बताऊंगा|छोड़ो|छोड़|सांगायचं नाही|नको सांगायला|सोड/.test(normalize(text))
}

const MODE_WORDS: Record<WorkMode, string[]> = {
  daily: ['daily', 'dihadi', 'diwari', 'per day', 'दिहाड़ी', 'दिहाडी', 'दैनिक', 'रोज', 'रोजंदारी', 'रोजगार'],
  contract: ['contract', 'thekedar', 'theka', 'ठेका', 'ठेके', 'ठेकेदार', 'कंत्राट', 'कॉन्ट्रैक्ट', 'कॉन्ट्रॅक्ट'],
  permanent: ['permanent', 'monthly', 'full time', 'पक्की', 'पक्का', 'स्थायी', 'महीने', 'महिन्या', 'पर्मनंट', 'पर्मनेंट', 'कायम'],
}

export function parseWorkMode(text: string): WorkMode | null {
  const said = normalize(text)
  const hit = (Object.keys(MODE_WORDS) as WorkMode[]).find((m) => MODE_WORDS[m].some((w) => said.includes(w)))
  return hit ?? null
}
