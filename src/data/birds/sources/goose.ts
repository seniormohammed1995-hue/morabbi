import type { SourceRef } from '../../schema'

/** Sources cited by the goose profiles. Ids are prefixed to avoid clashes between files. */
export const GOOSE_SOURCES = {
  goose_faoMeat: {
    id: 'goose_faoMeat',
    title: 'FAO — Goose Production (APH Paper 154), ch. 9: Geese for meat production',
    publisher: 'FAO',
    year: 2002,
    url: 'https://www.fao.org/4/y4359e/y4359e0b.htm',
    kind: 'fao',
  },
  goose_faoIncub: {
    id: 'goose_faoIncub',
    title: 'FAO — Goose Production (APH Paper 154), ch. 8: Incubation',
    publisher: 'FAO',
    year: 2002,
    url: 'https://www.fao.org/4/y4359e/y4359e0a.htm',
    kind: 'fao',
  },
  goose_faoBreeder: {
    id: 'goose_faoBreeder',
    title: 'FAO — Goose Production (APH Paper 154), ch. 6: Breeder flock management',
    publisher: 'FAO',
    year: 2002,
    url: 'https://www.fao.org/4/y4359e/y4359e08.htm',
    kind: 'fao',
  },
  goose_faoBehaviour: {
    id: 'goose_faoBehaviour',
    title: 'FAO — Goose Production (APH Paper 154), ch. 2: Behaviour',
    publisher: 'FAO',
    year: 2002,
    url: 'https://www.fao.org/4/y4359e/y4359e04.htm',
    kind: 'fao',
  },
  goose_faoDisease: {
    id: 'goose_faoDisease',
    title: 'FAO — Goose Production (APH Paper 154), ch. 14: Goose diseases',
    publisher: 'FAO',
    year: 2002,
    url: 'https://www.fao.org/4/y4359e/y4359e0g.htm',
    kind: 'fao',
  },
  goose_egypt2021: {
    id: 'goose_egypt2021',
    title:
      'Abdel-Kafy et al. — Genetic and Phenotypic Characterization of Domestic Geese (Anser anser) in Egypt (Animals 11:3106)',
    publisher: 'MDPI / PMC',
    year: 2021,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8614349/',
    kind: 'journal',
  },
  goose_msuHatch: {
    id: 'goose_msuHatch',
    title:
      'Mississippi State University Extension — Hatchery management guide for game bird and small poultry flock owners',
    publisher: 'Mississippi State University Extension',
    url: 'https://extension.msstate.edu/agriculture/livestock/poultry/hatchery-management-guide-for-game-bird-and-small-poultry-flock-owners',
    kind: 'university',
  },
  goose_msdAI: {
    id: 'goose_msdAI',
    title: 'MSD Veterinary Manual — Avian Influenza in Poultry and Wild Birds',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/avian-influenza/avian-influenza-in-poultry-and-wild-birds',
    kind: 'vet-manual',
  },
  goose_msdND: {
    id: 'goose_msdND',
    title: 'MSD Veterinary Manual — Newcastle Disease in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/newcastle-disease-and-other-paramyxovirus-infections/newcastle-disease-in-poultry',
    kind: 'vet-manual',
  },
  goose_ucScraps: {
    id: 'goose_ucScraps',
    title: 'Pitesky & Reimers — Feeding your Flock (UC Davis / UC Cooperative Extension)',
    publisher: 'University of California Agriculture and Natural Resources',
    year: 2015,
    url: 'https://ucanr.edu/sites/default/files/2015-04/211138.pdf',
    kind: 'university',
  },
  goose_avTox: {
    id: 'goose_avTox',
    title: 'Vetere et al. — Avian toxicoses: a review (Frontiers in Veterinary Science 12:1572736)',
    publisher: 'Frontiers / PMC',
    year: 2025,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12375962/',
    kind: 'journal',
  },
  goose_msdAllium: {
    id: 'goose_msdAllium',
    title: 'MSD Veterinary Manual — Garlic and Onion (Allium spp) Toxicosis in Animals',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/toxicology/food-hazards/garlic-and-onion-allium-spp-toxicosis-in-animals',
    kind: 'vet-manual',
  },
} as const satisfies Record<string, SourceRef>
