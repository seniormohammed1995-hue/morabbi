import type { SourceRef } from './schema'
import { COMMON_SOURCES } from './birds/sources/common'
import { CHICKEN_SOURCES } from './birds/sources/chicken'
import { PIGEON_SOURCES } from './birds/sources/pigeon'
import { QUAIL_SOURCES } from './birds/sources/quail'
import { DUCK_SOURCES } from './birds/sources/duck'
import { GOOSE_SOURCES } from './birds/sources/goose'
import { TURKEY_SOURCES } from './birds/sources/turkey'
import { KITCHEN_SOURCES } from './birds/sources/kitchen'

const BASE_SOURCES = {
  po22: {
    id: 'po22',
    title: 'Aviagen — Ross 308 Broiler Performance Objectives 2022 (As-Hatched)',
    publisher: 'Aviagen',
    year: 2022,
    url: 'https://aa-na.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf',
    kind: 'breed-guide',
  },
  hb25: {
    id: 'hb25',
    title: 'Aviagen — Ross Broiler Management Handbook 2025',
    publisher: 'Aviagen',
    year: 2025,
    url: 'https://aviagen.com/assets/Tech_Center/Ross_Broiler/Aviagen-ROSS-Broiler-Handbook-EN.pdf',
    kind: 'breed-guide',
  },
  ns22: {
    id: 'ns22',
    title: 'Aviagen — Ross Broiler Nutrition Specifications 2022',
    publisher: 'Aviagen',
    year: 2022,
    url: 'https://eseu.aviagen.com/assets/Tech_Center/Ross_Broiler/Ross-BroilerNutritionSpecifications2022-EN.pdf',
    kind: 'breed-guide',
  },
  cobb21: {
    id: 'cobb21',
    title: 'Cobb-Vantress — Broiler Management Guide 2021',
    publisher: 'Cobb-Vantress',
    year: 2021,
    url: 'https://cobbgenetics.com/assets/Cobb-Files/Broiler-Guide_English-2021-min.pdf',
    kind: 'breed-guide',
  },
  aviagenTunnel: {
    id: 'aviagenTunnel',
    title: 'Aviagen — Tunnel Ventilation for Broilers (poster)',
    publisher: 'Aviagen',
    url: 'https://aa-intl.aviagen.com/assets/Tech_Center/BB_Resources_Tools/Poster-TunnelVentilation-Broilers-EN.pdf',
    kind: 'breed-guide',
  },
  eu2007: {
    id: 'eu2007',
    title: 'Council Directive 2007/43/EC — minimum rules for the protection of chickens kept for meat production',
    publisher: 'European Union',
    year: 2007,
    url: 'https://www.legislation.gov.uk/eudr/2007/43/annex/I',
    kind: 'regulation',
  },
  missouriBrooding: {
    id: 'missouriBrooding',
    title: 'University of Missouri Extension — G8351 Brooding and Rearing Chicks',
    publisher: 'University of Missouri Extension',
    url: 'https://extension.missouri.edu/media/wysiwyg/Extensiondata/Pub/pdf/agguides/poultry/g08351.pdf',
    kind: 'university',
  },
  ukyNatural: {
    id: 'ukyNatural',
    title: 'University of Kentucky — Poultry Production Manual, Ch. 8: Natural Ventilation',
    publisher: 'University of Kentucky',
    url: 'https://afs.mgcafe.uky.edu/poultry/chapter-8-natural-ventilation-cold-weather',
    kind: 'university',
  },
  egyVaccine2024: {
    id: 'egyVaccine2024',
    title: 'Heliyon 2024 — Egyptian broiler field trial (vaccination program used), PMC11420471',
    publisher: 'Heliyon / PubMed Central',
    year: 2024,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11420471',
    kind: 'university',
  },
  egyVaccine2020: {
    id: 'egyVaccine2020',
    title: 'Poultry Science 2020 — Egyptian broiler vaccination trial, PMC7141634',
    publisher: 'Poultry Science / PubMed Central',
    year: 2020,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7141634',
    kind: 'university',
  },
  msdResidues: {
    id: 'msdResidues',
    title: 'MSD Veterinary Manual — Chemical Residues in Animal Source Foods',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/pharmacology/pharmacology-introduction/chemical-residues-in-animal-source-foods-and-animal-fiber',
    kind: 'university',
  },
  egyFeedMarket: {
    id: 'egyFeedMarket',
    title: 'المال نيوز — أسعار الأعلاف في مصر (حجم الشيكارة 50 كجم)',
    publisher: 'Almal News',
    year: 2026,
    url: 'https://almalnews.com/2145295/',
    kind: 'app-rule',
  },
  fpMaize: { id: 'fpMaize', title: 'Feedipedia (FAO/INRAE/CIRAD) — Maize grain, yellow', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/11668', kind: 'fao' },
  fpSbm44: { id: 'fpSbm44', title: 'Feedipedia — Soybean meal, low protein, type 44-46', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/11682', kind: 'fao' },
  fpSbm48: { id: 'fpSbm48', title: 'Feedipedia — Soybean meal, type 48', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/26068', kind: 'fao' },
  fpBran: { id: 'fpBran', title: 'Feedipedia — Wheat bran', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/12751', kind: 'fao' },
  fpGluten: { id: 'fpGluten', title: 'Feedipedia — Maize gluten meal', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/12288', kind: 'fao' },
  fpFish: { id: 'fpFish', title: 'Feedipedia — Fish meal (type 62)', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/208', kind: 'fao' },
  fpLimestone: { id: 'fpLimestone', title: 'Feedipedia — Limestone', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/59', kind: 'fao' },
  fpMinerals: { id: 'fpMinerals', title: 'Feedipedia — Manufactured sources of minerals', publisher: 'Feedipedia', url: 'https://feedipedia.org/node/13729', kind: 'fao' },
} as const satisfies Record<string, SourceRef>

/** Registry of every source cited by the data files (base + one file per bird kind). */
export const SOURCES = {
  ...BASE_SOURCES,
  ...COMMON_SOURCES,
  ...CHICKEN_SOURCES,
  ...PIGEON_SOURCES,
  ...QUAIL_SOURCES,
  ...DUCK_SOURCES,
  ...GOOSE_SOURCES,
  ...TURKEY_SOURCES,
  ...KITCHEN_SOURCES,
} as const satisfies Record<string, SourceRef>

export type SourceId = keyof typeof SOURCES
