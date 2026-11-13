import type { SourceRef } from '../../schema'

/** Sources cited by the turkey profiles. Ids are prefixed to avoid clashes between files. */
export const TURKEY_SOURCES = {
  turkey_but6: {
    id: 'turkey_but6',
    title: 'Aviagen Turkeys — B.U.T. 6 Commercial Performance Objectives (POCLLB6 v2)',
    publisher: 'Aviagen Turkeys',
    year: 2022,
    url: 'https://aviagenturkeys.com/wp-content/uploads/2025/08/POCLLB6_V2_BUT-6-Commercial-Goals_UK_2022.pdf',
    kind: 'breed-guide',
  },
  turkey_aviNutr: {
    id: 'turkey_aviNutr',
    title: 'Aviagen Turkeys — Commercial Nutrition Recommendations (NU22)',
    publisher: 'Aviagen Turkeys',
    year: 2024,
    url: 'https://aviagenturkeys.com/wp-content/uploads/2025/08/NU22_EN_Commercial-Nutrition-Recommendations-2024.pdf',
    kind: 'breed-guide',
  },
  turkey_unh: {
    id: 'turkey_unh',
    title: 'UNH Extension — Raising Turkeys',
    publisher: 'University of New Hampshire Cooperative Extension',
    url: 'https://extension.unh.edu/resource/raising-turkeys',
    kind: 'university',
  },
  turkey_mendes2015: {
    id: 'turkey_mendes2015',
    title:
      'Mendes et al. — Turkey Wattle Temperature Response to Distinct Environmental Factors (Braz. J. Poultry Sci. 17(4))',
    publisher: 'Brazilian Journal of Poultry Science (SciELO)',
    year: 2015,
    url: 'https://www.scielo.br/j/rbca/a/4J8fc5XWP6xYnSPHYZksPds/?lang=en',
    kind: 'journal',
  },
  turkey_baladi2026: {
    id: 'turkey_baladi2026',
    title:
      'Khalil et al. — GH-mRNA expression and selection index for body weight traits in Baladi turkeys (Archives Animal Breeding 69:411)',
    publisher: 'Copernicus / Archives Animal Breeding',
    year: 2026,
    url: 'https://aab.copernicus.org/articles/69/411/2026/',
    kind: 'journal',
  },
  turkey_msuHatch: {
    id: 'turkey_msuHatch',
    title:
      'Mississippi State University Extension — Hatchery management guide for game bird and small poultry flock owners',
    publisher: 'Mississippi State University Extension',
    url: 'https://extension.msstate.edu/agriculture/livestock/poultry/hatchery-management-guide-for-game-bird-and-small-poultry-flock-owners',
    kind: 'university',
  },
  turkey_faoIncub: {
    id: 'turkey_faoIncub',
    title:
      'FAO — Goose Production (APH Paper 154), ch. 8: Incubation (natural incubation under broody birds)',
    publisher: 'FAO',
    year: 2002,
    url: 'https://www.fao.org/4/y4359e/y4359e0a.htm',
    kind: 'fao',
  },
  turkey_msdBlackhead: {
    id: 'turkey_msdBlackhead',
    title: 'MSD Veterinary Manual — Histomoniasis in Poultry (blackhead)',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/histomoniasis/histomoniasis-in-poultry',
    kind: 'vet-manual',
  },
  turkey_msdUE: {
    id: 'turkey_msdUE',
    title: 'MSD Veterinary Manual — Ulcerative Enteritis in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/ulcerative-enteritis/ulcerative-enteritis-in-poultry',
    kind: 'vet-manual',
  },
  turkey_msdAI: {
    id: 'turkey_msdAI',
    title: 'MSD Veterinary Manual — Avian Influenza in Poultry and Wild Birds',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/avian-influenza/avian-influenza-in-poultry-and-wild-birds',
    kind: 'vet-manual',
  },
  turkey_msdND: {
    id: 'turkey_msdND',
    title: 'MSD Veterinary Manual — Newcastle Disease in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/newcastle-disease-and-other-paramyxovirus-infections/newcastle-disease-in-poultry',
    kind: 'vet-manual',
  },
  turkey_ucScraps: {
    id: 'turkey_ucScraps',
    title: 'Pitesky & Reimers — Feeding your Flock (UC Davis / UC Cooperative Extension)',
    publisher: 'University of California Agriculture and Natural Resources',
    year: 2015,
    url: 'https://ucanr.edu/sites/default/files/2015-04/211138.pdf',
    kind: 'university',
  },
  turkey_avTox: {
    id: 'turkey_avTox',
    title: 'Vetere et al. — Avian toxicoses: a review (Frontiers in Veterinary Science 12:1572736)',
    publisher: 'Frontiers / PMC',
    year: 2025,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12375962/',
    kind: 'journal',
  },
  turkey_msdAllium: {
    id: 'turkey_msdAllium',
    title: 'MSD Veterinary Manual — Garlic and Onion (Allium spp) Toxicosis in Animals',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/toxicology/food-hazards/garlic-and-onion-allium-spp-toxicosis-in-animals',
    kind: 'vet-manual',
  },
} as const satisfies Record<string, SourceRef>
