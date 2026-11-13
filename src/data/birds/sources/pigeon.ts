import type { SourceRef } from '../../schema'

/** Sources cited by the pigeon profiles. Ids are prefixed to avoid clashes between files. */
export const PIGEON_SOURCES = {
  pigeon_ext: {
    id: 'pigeon_ext',
    title:
      'Raising Pigeons in Small and Backyard Flocks (J. Jacob, University of Kentucky — Poultry Extension)',
    publisher: 'Cooperative Extension (extension.org)',
    url: 'https://poultry.extension.org/articles/poultry-management/raising-pigeons-in-small-and-backyard-flocks/',
    kind: 'university',
  },
  pigeon_wi4h: {
    id: 'pigeon_wi4h',
    title: 'Pigeons Member Guide, Pub. 4H135',
    publisher: 'University of Wisconsin-Extension 4-H',
    url: 'https://fyi.extension.wisc.edu/wi4hpublications/files/2015/10/4H135spf.pdf',
    kind: 'university',
  },
  pigeon_zag2019: {
    id: 'pigeon_zag2019',
    title:
      'Abdel Fattah et al. — Management and rearing systems and pigeon squab welfare and performance (Egyptian Baladi, Zagazig University). Animals 9(4):165',
    publisher: 'MDPI Animals (PMC)',
    year: 2019,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6523572',
    kind: 'journal',
  },
  pigeon_matrouh2025: {
    id: 'pigeon_matrouh2025',
    title:
      'Mohamed et al. — Early weaning in pigeons: squab performance and parents’ reproduction (White Mirthys, Matrouh University). BMC Vet Res 21',
    publisher: 'BMC Veterinary Research (PMC)',
    year: 2025,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11998371',
    kind: 'journal',
  },
  pigeon_baladi2026: {
    id: 'pigeon_baladi2026',
    title:
      'Mohamed et al. — Reproductive behaviour in White Mirthys and Egyptian Baladi pigeons (Matrouh University). BMC Vet Res 22',
    publisher: 'BMC Veterinary Research (PMC)',
    year: 2026,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13548609',
    kind: 'journal',
  },
  pigeon_peng2023: {
    id: 'pigeon_peng2023',
    title:
      'Peng et al. — Optimal dietary energy and protein levels for breeding pigeons in the winter "2 + 3" lactation pattern. Poultry Science 102:102964',
    publisher: 'Poultry Science (PMC)',
    year: 2023,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10428047',
    kind: 'journal',
  },
  pigeon_racing2021: {
    id: 'pigeon_racing2021',
    title:
      'Myocardial velocities of healthy racing pigeons measured by tissue Doppler imaging (40 racing pigeons, body weights). Vet. Sci. 8',
    publisher: 'MDPI Veterinary Sciences (PMC)',
    year: 2021,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7912189',
    kind: 'journal',
  },
  pigeon_heat2018: {
    id: 'pigeon_heat2018',
    title:
      'Black seed and water bath against heat stress in pigeons (34 °C, Egyptian summer). J. Basic Appl. Zool. 79:23',
    publisher: 'The Journal of Basic and Applied Zoology (Springer Open)',
    year: 2018,
    url: 'https://basicandappliedzoology.springeropen.com/articles/10.1186/s41936-018-0035-5',
    kind: 'journal',
  },
  pigeon_jeb1998: {
    id: 'pigeon_jeb1998',
    title:
      'Østnes & Bech — Thermal control of metabolic cold defence in pigeons Columba livia. J. Exp. Biol. 201:793–803',
    publisher: 'The Journal of Experimental Biology (author copy, NTNU)',
    year: 1998,
    url: 'https://clabec.folk.ntnu.no/JEBpigeons.pdf',
    kind: 'journal',
  },
  pigeon_ppmvEgypt2024: {
    id: 'pigeon_ppmvEgypt2024',
    title:
      'Hamouda et al. — PPMV-1 genotype VI virulence in pigeons and chickens and protective effectiveness of paramyxovirus vaccines in pigeons (Zagazig). Viruses 16:1585',
    publisher: 'MDPI Viruses (PMC)',
    year: 2024,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11512342',
    kind: 'journal',
  },
  pigeon_parasitesGiza2022: {
    id: 'pigeon_parasitesGiza2022',
    title:
      'Salem et al. — Incidence of gastrointestinal parasites in pigeons (Giza, Egypt). Poultry Science 101:101820',
    publisher: 'Poultry Science (PMC)',
    year: 2022,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9018452',
    kind: 'journal',
  },
  pigeon_saudi2026: {
    id: 'pigeon_saudi2026',
    title:
      'Aljumah et al. — Genetic diversity and productive performance in Saudi native and carrier pigeon genotypes (egg weights). Poultry Science 105',
    publisher: 'Poultry Science (PMC)',
    year: 2026,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13393671',
    kind: 'journal',
  },
  pigeon_msdND: {
    id: 'pigeon_msdND',
    title: 'MSD Veterinary Manual — Newcastle Disease in Poultry',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/newcastle-disease-and-other-paramyxovirus-infections/newcastle-disease-in-poultry',
    kind: 'vet-manual',
  },
  pigeon_msdTrich: {
    id: 'pigeon_msdTrich',
    title: 'MSD Veterinary Manual — Trichomonosis in Birds',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/exotic-and-laboratory-animals/trichomonosis/trichomonosis-in-birds',
    kind: 'vet-manual',
  },
  pigeon_msdAI: {
    id: 'pigeon_msdAI',
    title: 'MSD Veterinary Manual — Avian Influenza in Poultry and Wild Birds',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/poultry/avian-influenza/avian-influenza',
    kind: 'vet-manual',
  },
  pigeon_msdFood: {
    id: 'pigeon_msdFood',
    title: 'MSD Veterinary Manual — Food Hazards (pets, incl. birds and avocado)',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/special-pet-topics/poisoning/food-hazards',
    kind: 'vet-manual',
  },
  pigeon_msdSalt: {
    id: 'pigeon_msdSalt',
    title: 'MSD Veterinary Manual — Salt Toxicosis in Animals',
    publisher: 'MSD Veterinary Manual',
    url: 'https://www.msdvetmanual.com/toxicology/salt-toxicosis/salt-toxicosis-in-animals',
    kind: 'vet-manual',
  },
  pigeon_illinoisToxic: {
    id: 'pigeon_illinoisToxic',
    title: 'Bad for Birds: Prevent Poisoning in Avian Pets',
    publisher: 'University of Illinois College of Veterinary Medicine',
    year: 2026,
    url: 'https://vetmed.illinois.edu/pet-health-columns/bad-for-birds-prevent-poisoning-in-avian-pets/',
    kind: 'university',
  },
} as const satisfies Record<string, SourceRef>
