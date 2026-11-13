import type { SourceRef } from '../../schema'

/** Sources shared by all kinds: weather, heat stress, water, litter. */
export const COMMON_SOURCES = {
  taoXin2003: {
    id: 'taoXin2003',
    title:
      'Tao & Xin (2003) — Acute synergistic effects of air temperature, humidity and velocity on homeostasis of market-size broilers, Trans. ASAE 46(2):491–497',
    publisher: 'ASAE (via FAO AGRIS)',
    year: 2003,
    url: 'https://agris.fao.org/search/en/records/65df49616eef00c2cea25a05',
    kind: 'journal',
  },
  stull2011: {
    id: 'stull2011',
    title:
      'Stull (2011) — Wet-bulb temperature from relative humidity and air temperature, J. Appl. Meteor. Climatol. 50:2267–2269',
    publisher: 'NCAR NCL documentation',
    year: 2011,
    url: 'https://www.ncl.ucar.edu/Document/Functions/Contributed/wetbulb_stull.shtml',
    kind: 'journal',
  },
  mader2006: {
    id: 'mader2006',
    title:
      'Mader, Davis & Brown-Brandl (2006) — Environmental factors influencing heat stress in feedlot cattle, J. Anim. Sci. 84:712–719 (solar radiation adjustment)',
    publisher: 'University of Nebraska–Lincoln',
    year: 2006,
    url: 'https://digitalcommons.unl.edu/animalscifacpub/608',
    kind: 'journal',
  },
  rossPocket2015: {
    id: 'rossPocket2015',
    title: 'Aviagen — Ross Broiler Pocket Guide (2015)',
    publisher: 'Aviagen',
    year: 2015,
    url: 'https://aviagen.com/assets/Tech_Center/BB_Resources_Tools/Pocket_Guides/Ross-Broiler-Pocket-Guide-2015-EN.pdf',
    kind: 'breed-guide',
  },
  psuEggs: {
    id: 'psuEggs',
    title: 'Penn State Extension — Proper Handling of Eggs: From Hen to Consumption',
    publisher: 'Penn State Extension',
    url: 'https://extension.psu.edu/proper-handling-of-eggs-from-hen-to-consumption',
    kind: 'university',
  },
  psuTurkey: {
    id: 'psuTurkey',
    title: 'Penn State Extension — Small Flock Turkey Production',
    publisher: 'Penn State Extension',
    url: 'https://extension.psu.edu/small-flock-turkey-production',
    kind: 'university',
  },
  ugaLitter: {
    id: 'ugaLitter',
    title: 'University of Georgia Extension Bulletin 1267 — Litter Quality and Broiler Performance',
    publisher: 'University of Georgia Extension',
    url: 'https://fieldreport.caes.uga.edu/publications/B1267/litter-quality-and-broiler-performance',
    kind: 'university',
  },
  egyMoaSummer: {
    id: 'egyMoaSummer',
    title: 'وزارة الزراعة واستصلاح الأراضي — إرشادات وقاية المزارع الحيوانية والداجنة من الحر (منشورة في جريدة المال)',
    publisher: 'وزارة الزراعة واستصلاح الأراضي (مصر)',
    url: 'https://almalnews.com/508854/',
    kind: 'egypt-gov',
  },
  uaexHeat: {
    id: 'uaexHeat',
    title: 'University of Arkansas FSA8010 — Dealing With Summer Heat in Free Range Poultry',
    publisher: 'University of Arkansas Cooperative Extension',
    url: 'https://www.uaex.uada.edu/publications/PDF/FSA-8010.pdf',
    kind: 'university',
  },
  aviagenWater: {
    id: 'aviagenWater',
    title: 'Aviagen (Arbor Acres) — Water Quality technical update',
    publisher: 'Aviagen',
    url: 'https://aviagen.com/assets/Tech_Center/AA_Technical_Articles/AAUpdateWaterQuality.pdf',
    kind: 'breed-guide',
  },
  msuLitter: {
    id: 'msuLitter',
    title: 'Mississippi State Extension P2744 — Managing Litter Moisture in Broiler Houses',
    publisher: 'Mississippi State University Extension',
    url: 'https://extension.msstate.edu/publications/managing-litter-moisture-broiler-houses-built-up-litter',
    kind: 'university',
  },
  msuLitterGood: {
    id: 'msuLitterGood',
    title:
      'Mississippi State Extension P3657 — Good Litter Management Improves Broiler Performance, Health, and Welfare',
    publisher: 'Mississippi State University Extension',
    url: 'https://extension.msstate.edu/publications/good-litter-management-improves-broiler-performance-health-and-welfare',
    kind: 'university',
  },
  osuCoop: {
    id: 'osuCoop',
    title: 'Oregon State University Extension EC 1644 — Backyard chicken coop design',
    publisher: 'Oregon State University Extension',
    url: 'https://extension.oregonstate.edu/catalog/pub/ec1644',
    kind: 'university',
  },
  ufStorm: {
    id: 'ufStorm',
    title: 'UF/IFAS VM276 — Hurricane preparedness for poultry',
    publisher: 'University of Florida IFAS Extension',
    url: 'https://edis.ifas.ufl.edu/publication/VM276',
    kind: 'university',
  },
  msdBackyard: {
    id: 'msdBackyard',
    title: 'MSD Veterinary Manual — Management of Backyard Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/exotic-and-laboratory-animals/backyard-poultry/management-of-backyard-poultry',
    kind: 'vet-manual',
  },
  msdNewcastle: {
    id: 'msdNewcastle',
    title: 'MSD Veterinary Manual — Newcastle Disease in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/newcastle-disease-and-other-paramyxovirus-infections/newcastle-disease-in-poultry',
    kind: 'vet-manual',
  },
  msdAI: {
    id: 'msdAI',
    title: 'MSD Veterinary Manual — Avian Influenza',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/avian-influenza/avian-influenza',
    kind: 'vet-manual',
  },
  faoBiosecurity: {
    id: 'faoBiosecurity',
    title: 'FAO — Guide for the Prevention and Control of Avian Flu in Small Scale Poultry (2006)',
    publisher: 'FAO',
    url: 'https://www.fao.org/4/ai005e/ai005e00.pdf',
    kind: 'fao',
  },
} as const satisfies Record<string, SourceRef>
