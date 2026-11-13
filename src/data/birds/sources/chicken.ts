import type { SourceRef } from '../../schema'

/** Sources cited by the chicken profiles. Ids are prefixed to avoid clashes between files. */
export const CHICKEN_SOURCES = {
  chicken_hylineAlt: {
    id: 'chicken_hylineAlt',
    title: 'Hy-Line Brown Commercial Layers — Alternative Systems Performance Standards (May 2026)',
    publisher: 'Hy-Line International',
    year: 2026,
    url: 'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/Brown/Brown%20Alt/BRN%20ALT%20STD%20ENG.pdf',
    kind: 'breed-guide',
  },
  chicken_hylineHeat: {
    id: 'chicken_hylineHeat',
    title: 'Hy-Line Technical Update — Understanding Heat Stress in Layers',
    publisher: 'Hy-Line International',
    url: 'https://www.hyline.com/Upload/Resources/TU%20HEAT%20ENG.pdf',
    kind: 'breed-guide',
  },
  chicken_sassoRural: {
    id: 'chicken_sassoRural',
    title:
      "SASSO — Management guide rural poultry: Farmer's guide to SASSO dual purpose management (2022)",
    publisher: 'SASSO / Hendrix Genetics',
    year: 2022,
    url: 'https://www.hendrix-genetics.com/documents/1665/SASSO_Management_guide_Rural_poultry_2022_EN.pdf',
    kind: 'breed-guide',
  },
  chicken_sassoRainbowX: {
    id: 'chicken_sassoRainbowX',
    title:
      'SASSO Africa — Rainbow X male breeder: performance of Rainbow X × SA51A colored chicken',
    publisher: 'SASSO / Hendrix Genetics',
    url: 'https://africa.sasso-poultry.com/en/sasso-products/colored-chickens/male-breeders/rainbow-x/',
    kind: 'breed-guide',
  },
  chicken_fao2004Breeds: {
    id: 'chicken_fao2004Breeds',
    title: 'FAO (Sonaiya & Swan 2004) — Small-scale poultry production, Ch. 2: Species and breeds',
    publisher: 'FAO',
    year: 2004,
    url: 'https://www.fao.org/4/y5169e/y5169e03.htm',
    kind: 'fao',
  },
  chicken_fao2004Feed: {
    id: 'chicken_fao2004Feed',
    title: 'FAO (Sonaiya & Swan 2004) — Small-scale poultry production, Ch. 3: Feed resources',
    publisher: 'FAO',
    year: 2004,
    url: 'https://www.fao.org/4/y5169e/y5169e04.htm',
    kind: 'fao',
  },
  chicken_fao2004Mgmt: {
    id: 'chicken_fao2004Mgmt',
    title: 'FAO (Sonaiya & Swan 2004) — Small-scale poultry production, Ch. 4: General management',
    publisher: 'FAO',
    year: 2004,
    url: 'https://www.fao.org/4/y5169e/y5169e05.htm',
    kind: 'fao',
  },
  chicken_fao2004Incub: {
    id: 'chicken_fao2004Incub',
    title:
      'FAO (Sonaiya & Swan 2004) — Small-scale poultry production, Ch. 5: Incubation and hatching',
    publisher: 'FAO',
    year: 2004,
    url: 'https://www.fao.org/4/y5169e/y5169e06.htm',
    kind: 'fao',
  },
  chicken_faoEgypt2008: {
    id: 'chicken_faoEgypt2008',
    title: 'FAO — Poultry sector country review: Egypt (Hosny 2006, re-edited 2008)',
    publisher: 'FAO',
    year: 2008,
    url: 'https://openknowledge.fao.org/server/api/core/bitstreams/e6d4a5b5-617d-4c46-8630-e2bca13e0b12/content',
    kind: 'fao',
  },
  chicken_faoEgyptChar2009: {
    id: 'chicken_faoEgyptChar2009',
    title:
      'FAO (Yakout, Kosba & Thieme 2009) — Characterization of domestic chicken and duck production systems in Egypt',
    publisher: 'FAO / Egyptian Poultry Science Association',
    year: 2009,
    url: 'https://openknowledge.fao.org/server/api/core/bitstreams/6d92f64d-a41b-460a-aff3-7e4c8259d8bd/content',
    kind: 'fao',
  },
  chicken_lrrd2011: {
    id: 'chicken_lrrd2011',
    title:
      'El-Labban et al. (2011) — Egg production traits in Mandarah and Matrouh local strains (APRI, Inshas), LRRD 23(1)',
    publisher:
      'Livestock Research for Rural Development / Animal Production Research Institute, Egypt',
    year: 2011,
    url: 'https://lrrd.org/lrrd23/1/ella23010.htm',
    kind: 'journal',
  },
  chicken_negash2023: {
    id: 'chicken_negash2023',
    title:
      'Negash et al. (2023) — Reciprocal F1 crosses of Fayoumi with two exotic breeds: egg production traits, Trop Anim Health Prod 55:303 (PMC10509068)',
    publisher: 'Tropical Animal Health and Production / PubMed Central',
    year: 2023,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10509068/',
    kind: 'journal',
  },
  chicken_extFeeding: {
    id: 'chicken_extFeeding',
    title:
      'Extension Foundation (poultry.extension.org) — Feeding chickens for egg production in small and backyard flocks',
    publisher: 'Extension Foundation (US Cooperative Extension)',
    url: 'https://poultry.extension.org/articles/feeds-and-feeding-of-poultry/feeding-chickens-for-egg-production/',
    kind: 'university',
  },
  chicken_ufScraps: {
    id: 'chicken_ufScraps',
    title: 'UF/IFAS Extension Holmes County — 10 Foods You Should Never Feed Chickens (2026)',
    publisher: 'University of Florida IFAS Extension',
    year: 2026,
    url: 'https://blogs.ifas.ufl.edu/holmesco/2026/05/25/10-foods-you-should-never-feed-chickens/',
    kind: 'university',
  },
  chicken_msdHisto: {
    id: 'chicken_msdHisto',
    title: 'MSD Veterinary Manual — Histomoniasis in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/histomoniasis/histomoniasis-in-poultry',
    kind: 'vet-manual',
  },
  chicken_msdAI: {
    id: 'chicken_msdAI',
    title: 'MSD Veterinary Manual — Avian Influenza in Poultry and Wild Birds',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/avian-influenza-in-poultry-and-wild-birds/avian-influenza-in-poultry-and-wild-birds',
    kind: 'vet-manual',
  },
  chicken_msdND: {
    id: 'chicken_msdND',
    title: 'MSD Veterinary Manual — Newcastle Disease in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/newcastle-disease-and-other-avian-paramyxovirus-infections/newcastle-disease-in-poultry',
    kind: 'vet-manual',
  },
  chicken_msdMyco: {
    id: 'chicken_msdMyco',
    title: 'MSD Veterinary Manual — Mycotoxicoses in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/mycotoxicoses-in-poultry/mycotoxicoses-in-poultry',
    kind: 'vet-manual',
  },
} as const satisfies Record<string, SourceRef>
