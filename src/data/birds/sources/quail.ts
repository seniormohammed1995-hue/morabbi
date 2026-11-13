import type { SourceRef } from '../../schema'

/** Sources cited by the quail profiles. Ids are prefixed to avoid clashes between files. */
export const QUAIL_SOURCES = {
  quail_msuBrood: {
    id: 'quail_msuBrood',
    title: 'Mississippi State University Extension — Temperatures recommended for brooding quail',
    publisher: 'Mississippi State University Extension',
    url: 'https://extension.msstate.edu/agriculture/livestock/poultry/temperatures-recommended-for-brooding-quail',
    kind: 'university',
  },
  quail_msuHatch: {
    id: 'quail_msuHatch',
    title:
      'Mississippi State University Extension — Hatchery management guide for game bird and small poultry flock owners',
    publisher: 'Mississippi State University Extension',
    url: 'https://extension.msstate.edu/agriculture/livestock/poultry/hatchery-management-guide-for-game-bird-and-small-poultry-flock-owners',
    kind: 'university',
  },
  quail_tnau: {
    id: 'quail_tnau',
    title: 'TNAU Agritech Portal — Japanese quail: breeds, care and management',
    publisher: 'Tamil Nadu Agricultural University',
    url: 'https://agritech.tnau.ac.in/animal_husbandry/ani_poulltry_quail_index.html',
    kind: 'university',
  },
  quail_extOrg: {
    id: 'quail_extOrg',
    title: 'Raising Japanese Quail in Small and Backyard Flocks (Jacob & McCrea)',
    publisher: 'Poultry Extension (University of Kentucky / Delaware State University)',
    url: 'https://poultry.extension.org/articles/poultry-management/raising-japanese-quail-in-small-and-backyard-flocks/',
    kind: 'university',
  },
  quail_ucdHeat: {
    id: 'quail_ucdHeat',
    title:
      'Truong & King — Lipid oxidation and antioxidant capacity in multigenerational heat stressed Japanese quail (Poultry Science 102:103005)',
    publisher: 'University of California, Davis (eScholarship)',
    year: 2023,
    url: 'https://escholarship.org/content/qt62h6j3v4/qt62h6j3v4.pdf',
    kind: 'journal',
  },
  quail_oke2025: {
    id: 'quail_oke2025',
    title: 'Oke et al. — Innovations in Quail Welfare (Veterinary Medicine and Science 11:e70424)',
    publisher: 'Wiley / PMC',
    year: 2025,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12160613/',
    kind: 'journal',
  },
  quail_msdUE: {
    id: 'quail_msdUE',
    title: 'MSD Veterinary Manual — Ulcerative Enteritis in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/ulcerative-enteritis/ulcerative-enteritis-in-poultry',
    kind: 'vet-manual',
  },
  quail_msdAI: {
    id: 'quail_msdAI',
    title: 'MSD Veterinary Manual — Avian Influenza in Poultry and Wild Birds',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/avian-influenza/avian-influenza-in-poultry-and-wild-birds',
    kind: 'vet-manual',
  },
  quail_msdND: {
    id: 'quail_msdND',
    title: 'MSD Veterinary Manual — Newcastle Disease in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/newcastle-disease-and-other-paramyxovirus-infections/newcastle-disease-in-poultry',
    kind: 'vet-manual',
  },
  quail_ucScraps: {
    id: 'quail_ucScraps',
    title: 'Pitesky & Reimers — Feeding your Flock (UC Davis / UC Cooperative Extension)',
    publisher: 'University of California Agriculture and Natural Resources',
    year: 2015,
    url: 'https://ucanr.edu/sites/default/files/2015-04/211138.pdf',
    kind: 'university',
  },
  quail_avTox: {
    id: 'quail_avTox',
    title: 'Vetere et al. — Avian toxicoses: a review (Frontiers in Veterinary Science 12:1572736)',
    publisher: 'Frontiers / PMC',
    year: 2025,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12375962/',
    kind: 'journal',
  },
  quail_msdAllium: {
    id: 'quail_msdAllium',
    title: 'MSD Veterinary Manual — Garlic and Onion (Allium spp) Toxicosis in Animals',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/toxicology/food-hazards/garlic-and-onion-allium-spp-toxicosis-in-animals',
    kind: 'vet-manual',
  },
} as const satisfies Record<string, SourceRef>
