import { L } from '@/lib/localized'
import type { Area } from '@/api/types'

/** SAMPLE DATA - districts and talukas the mock API serves. Replaced by GET /areas. */
export const AREAS: Area[] = [
  {
    id: 'mumbai', name: L('मुंबई', 'मुंबई', 'Mumbai'), lat: 19.076, lng: 72.8777,
    talukas: [
      { id: 'andheri', name: L('अंधेरी', 'अंधेरी', 'Andheri') },
      { id: 'ghatkopar', name: L('घाटकोपर', 'घाटकोपर', 'Ghatkopar') },
      { id: 'kurla', name: L('कुर्ला', 'कुर्ला', 'Kurla') },
      { id: 'borivali', name: L('बोरीवली', 'बोरीवली', 'Borivali') },
    ],
  },
  {
    id: 'thane', name: L('ठाणे', 'ठाणे', 'Thane'), lat: 19.2183, lng: 72.9781,
    talukas: [
      { id: 'thane-city', name: L('ठाणे शहर', 'ठाणे शहर', 'Thane city') },
      { id: 'kalyan', name: L('कल्याण', 'कल्याण', 'Kalyan') },
      { id: 'bhiwandi', name: L('भिवंडी', 'भिवंडी', 'Bhiwandi') },
      { id: 'ulhasnagar', name: L('उल्हासनगर', 'उल्हासनगर', 'Ulhasnagar') },
    ],
  },
  {
    id: 'navi-mumbai', name: L('नवी मुंबई', 'नवी मुंबई', 'Navi Mumbai'), lat: 19.033, lng: 73.0297,
    talukas: [
      { id: 'vashi', name: L('वाशी', 'वाशी', 'Vashi') },
      { id: 'kharghar', name: L('खारघर', 'खारघर', 'Kharghar') },
      { id: 'panvel', name: L('पनवेल', 'पनवेल', 'Panvel') },
      { id: 'airoli', name: L('ऐरोली', 'ऐरोली', 'Airoli') },
    ],
  },
  {
    id: 'palghar', name: L('पालघर', 'पालघर', 'Palghar'), lat: 19.6967, lng: 72.7699,
    talukas: [
      { id: 'vasai', name: L('वसई', 'वसई', 'Vasai') },
      { id: 'virar', name: L('विरार', 'विरार', 'Virar') },
      { id: 'boisar', name: L('बोईसर', 'बोईसर', 'Boisar') },
    ],
  },
  {
    id: 'pune', name: L('पुणे', 'पुणे', 'Pune'), lat: 18.5204, lng: 73.8567,
    talukas: [
      { id: 'hinjewadi', name: L('हिंजवडी', 'हिंजवडी', 'Hinjewadi') },
      { id: 'chakan', name: L('चाकण', 'चाकण', 'Chakan') },
      { id: 'hadapsar', name: L('हडपसर', 'हडपसर', 'Hadapsar') },
      { id: 'pimpri', name: L('पिंपरी-चिंचवड', 'पिंपरी-चिंचवड', 'Pimpri-Chinchwad') },
    ],
  },
  {
    id: 'nashik', name: L('नाशिक', 'नाशिक', 'Nashik'), lat: 19.9975, lng: 73.7898,
    talukas: [
      { id: 'nashik-road', name: L('नाशिक रोड', 'नाशिक रोड', 'Nashik Road') },
      { id: 'sinnar', name: L('सिन्नर', 'सिन्नर', 'Sinnar') },
      { id: 'dindori', name: L('दिंडोरी', 'दिंडोरी', 'Dindori') },
    ],
  },
  {
    id: 'sambhajinagar', name: L('छत्रपती संभाजीनगर', 'छत्रपती संभाजीनगर', 'Chhatrapati Sambhajinagar'), lat: 19.8762, lng: 75.3433,
    talukas: [
      { id: 'waluj', name: L('वाळूज', 'वाळूज', 'Waluj') },
      { id: 'chikalthana', name: L('चिकलठाणा', 'चिकलठाणा', 'Chikalthana') },
      { id: 'paithan', name: L('पैठण', 'पैठण', 'Paithan') },
    ],
  },
  {
    id: 'latur', name: L('लातूर', 'लातूर', 'Latur'), lat: 18.4088, lng: 76.5604,
    talukas: [
      { id: 'latur-city', name: L('लातूर शहर', 'लातूर शहर', 'Latur city') },
      { id: 'udgir', name: L('उदगीर', 'उदगीर', 'Udgir') },
      { id: 'ausa', name: L('औसा', 'औसा', 'Ausa') },
    ],
  },
  {
    id: 'beed', name: L('बीड', 'बीड', 'Beed'), lat: 18.9894, lng: 75.7585,
    talukas: [
      { id: 'beed-city', name: L('बीड शहर', 'बीड शहर', 'Beed city') },
      { id: 'georai', name: L('गेवराई', 'गेवराई', 'Georai') },
      { id: 'majalgaon', name: L('माजलगाव', 'माजलगाव', 'Majalgaon') },
    ],
  },
  {
    id: 'nanded', name: L('नांदेड़', 'नांदेड', 'Nanded'), lat: 19.1383, lng: 77.321,
    talukas: [
      { id: 'nanded-city', name: L('नांदेड़ शहर', 'नांदेड शहर', 'Nanded city') },
      { id: 'bhokar', name: L('भोकर', 'भोकर', 'Bhokar') },
      { id: 'kandhar', name: L('कंधार', 'कंधार', 'Kandhar') },
    ],
  },
  { id: 'nagpur', name: L('नागपुर', 'नागपूर', 'Nagpur'), lat: 21.1458, lng: 79.0882, talukas: [] },
  { id: 'raigad', name: L('रायगढ़', 'रायगड', 'Raigad'), lat: 18.5158, lng: 73.1822, talukas: [] },
  { id: 'solapur', name: L('सोलापुर', 'सोलापूर', 'Solapur'), lat: 17.6599, lng: 75.9064, talukas: [] },
  { id: 'chandrapur', name: L('चंद्रपुर', 'चंद्रपूर', 'Chandrapur'), lat: 19.9615, lng: 79.2961, talukas: [] },
  { id: 'satara', name: L('सातारा', 'सातारा', 'Satara'), lat: 17.6805, lng: 74.0183, talukas: [] },
  { id: 'jalgaon', name: L('जलगाँव', 'जळगाव', 'Jalgaon'), lat: 21.0077, lng: 75.5626, talukas: [] },
  { id: 'kolhapur', name: L('कोल्हापुर', 'कोल्हापूर', 'Kolhapur'), lat: 16.705, lng: 74.2433, talukas: [] },
  { id: 'ratnagiri', name: L('रत्नागिरी', 'रत्नागिरी', 'Ratnagiri'), lat: 16.9902, lng: 73.312, talukas: [] },
]
