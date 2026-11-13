import type { SourceRef } from './schema'

/** Registry of every source cited by the data files. */
export const SOURCES = {
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
} as const satisfies Record<string, SourceRef>

export type SourceId = keyof typeof SOURCES
