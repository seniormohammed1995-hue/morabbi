import { z } from 'zod'

/** Text content that can be translated later. Arabic is mandatory in v1. */
export const LocalizedText = z.object({
  ar: z.string().min(1),
  en: z.string().min(1).optional(),
})
export type LocalizedText = z.infer<typeof LocalizedText>

export const Confidence = z.enum(['high', 'medium', 'low'])
export type Confidence = z.infer<typeof Confidence>

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** Provenance attached to every technical value. */
const Provenance = {
  unit: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.url(),
  confidence: Confidence,
  lastReviewed: isoDate,
  note: LocalizedText.optional(),
}

/** A single sourced number. `min`/`max` describe a range when sources disagree. */
export const SourcedValue = z
  .object({
    value: z.number().finite(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    ...Provenance,
  })
  .refine((v) => (v.min === undefined || v.min <= v.value) && (v.max === undefined || v.max >= v.value), {
    message: 'value must be within [min, max]',
  })
export type SourcedValue = z.infer<typeof SourcedValue>

export const AgePoint = z.object({
  day: z.number().int().min(0),
  value: z.number().finite(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
})
export type AgePoint = z.infer<typeof AgePoint>

/** A value that changes with age; interpolated linearly between points. */
export const AgeTable = z
  .object({
    points: z.array(AgePoint).min(2),
    ...Provenance,
  })
  .refine((t) => t.points.every((p, i, a) => i === 0 || a[i - 1]!.day < p.day), {
    message: 'points must be sorted by strictly increasing day',
  })
export type AgeTable = z.infer<typeof AgeTable>

/** A value that changes with body weight (kg); interpolated linearly. */
export const WeightTable = z
  .object({
    points: z.array(z.object({ kg: z.number().positive(), value: z.number().finite() })).min(2),
    ...Provenance,
  })
  .refine((t) => t.points.every((p, i, a) => i === 0 || a[i - 1]!.kg < p.kg), {
    message: 'points must be sorted by strictly increasing kg',
  })
export type WeightTable = z.infer<typeof WeightTable>

export const SpeciesGroup = z.enum(['broiler', 'layer', 'duck', 'turkey', 'goose', 'quail', 'pigeon'])
export type SpeciesGroup = z.infer<typeof SpeciesGroup>

export const Purpose = z.enum(['meat', 'eggs', 'dual', 'breeding', 'squab', 'hobby'])
export type Purpose = z.infer<typeof Purpose>

export const HouseType = z.enum(['roof', 'room', 'yard', 'closed', 'open'])
export type HouseType = z.infer<typeof HouseType>

export const Season = z.enum(['summer', 'winter', 'mild'])
export type Season = z.infer<typeof Season>

export const FeedPhase = z.object({
  id: z.string().min(1),
  name: LocalizedText,
  fromDay: z.number().int().min(0),
  toDay: z.number().int().min(0),
  crudeProtein: SourcedValue,
  energy: SourcedValue,
  form: LocalizedText,
})
export type FeedPhase = z.infer<typeof FeedPhase>

export const VaccineRoute = z.enum(['drinking-water', 'eye-drop', 'spray', 'injection', 'hatchery'])
export type VaccineRoute = z.infer<typeof VaccineRoute>

export const Vaccination = z.object({
  id: z.string().min(1),
  day: z.number().int().min(0),
  disease: LocalizedText,
  vaccine: LocalizedText,
  route: VaccineRoute,
  note: LocalizedText.optional(),
  source: z.string().min(1),
  sourceUrl: z.url(),
  confidence: Confidence,
  lastReviewed: isoDate,
})
export type Vaccination = z.infer<typeof Vaccination>

/** Heater option and how many birds one unit can brood. */
export const HeaterOption = z.object({
  id: z.enum(['heat-lamp', 'gas-brooder']),
  name: LocalizedText,
  chicksPerUnit: SourcedValue,
  /** Suitable flock size range (chicks). */
  minFlock: z.number().int().min(0),
  maxFlock: z.number().int().min(1),
  note: LocalizedText,
})
export type HeaterOption = z.infer<typeof HeaterOption>

export const FloorOption = z.object({
  id: z.enum(['concrete', 'earth', 'tiles', 'raised-wire', 'cages']),
  name: LocalizedText,
  rating: z.enum(['recommended', 'acceptable', 'not-recommended']),
  pros: LocalizedText,
  cons: LocalizedText,
})
export type FloorOption = z.infer<typeof FloorOption>

export const LitterOption = z.object({
  id: z.enum(['wood-shavings', 'straw', 'rice-hulls', 'rice-straw', 'sand']),
  name: LocalizedText,
  rating: z.enum(['recommended', 'acceptable', 'not-recommended']),
  depthSummer: SourcedValue,
  depthWinter: SourcedValue,
  note: LocalizedText,
})
export type LitterOption = z.infer<typeof LitterOption>

export const Sign = z.object({
  fromDay: z.number().int().min(0),
  toDay: z.number().int().min(0),
  text: LocalizedText,
  severity: z.enum(['info', 'watch', 'urgent']),
})

/** A task in the cycle template. Day is relative to placement (negative = before chicks arrive). */
export const CycleTask = z.object({
  id: z.string().min(1),
  fromDay: z.number().int(),
  toDay: z.number().int(),
  title: LocalizedText,
  detail: LocalizedText.optional(),
  kind: z.enum(['prep', 'brooding', 'feed', 'health', 'weigh', 'house', 'litter', 'market']),
  /** When true the task appears once per day within the range. */
  daily: z.boolean().default(false),
})
export type CycleTask = z.infer<typeof CycleTask>

export const Stage = z.object({
  id: z.string().min(1),
  name: LocalizedText,
  fromDay: z.number().int(),
  toDay: z.number().int(),
  summary: LocalizedText,
})
export type Stage = z.infer<typeof Stage>

export const CycleTemplate = z.object({
  speciesId: z.string().min(1),
  prepDays: z.number().int().min(1),
  stages: z.array(Stage).min(1),
  tasks: z.array(CycleTask).min(1),
  signs: z.array(Sign),
})
export type CycleTemplate = z.infer<typeof CycleTemplate>

export const SpeciesData = z.object({
  id: z.string().min(1),
  group: SpeciesGroup,
  name: LocalizedText,
  description: LocalizedText,
  purposes: z.array(Purpose).min(1),
  dataStatus: z.enum(['full', 'limited']),
  marketAge: SourcedValue,
  growth: z.object({
    bodyWeight: AgeTable,
    dailyFeed: AgeTable,
    cumulativeFeed: AgeTable,
    waterToFeedRatio: SourcedValue,
    /** Day-7 weight should be at least this multiple of day-0 weight. */
    day7WeightMultiple: SourcedValue,
  }),
  environment: z.object({
    temperature: AgeTable,
    spotBroodingTemperature: AgeTable,
    humidity: AgeTable,
    lightHours: AgeTable,
    lightIntensity: AgeTable,
  }),
  space: z.object({
    /** Maximum stocking density at market (kg live weight / m²) per house type. */
    maxDensityKgPerM2: z.record(HouseType, SourcedValue),
    /** Hot-season reduction factor applied to density (e.g. 0.85). */
    summerDensityFactor: SourcedValue,
    /** Brooding area density (chicks per m²) by age while partial brooding. */
    broodingDensity: AgeTable,
    fullHouseDay: SourcedValue,
  }),
  equipment: z.object({
    chickFeederTrayBirds: SourcedValue,
    chickDrinkerBirds: SourcedValue,
    supplementaryUntilDay: SourcedValue,
    panFeederBirds: SourcedValue,
    troughCmPerBird: SourcedValue,
    nippleBirds: SourcedValue,
    bellDrinkerBirds: SourcedValue,
    heaters: z.array(HeaterOption).min(1),
  }),
  ventilation: z.object({
    /** Minimum ventilation per bird (m³/h) by body weight (kg). */
    minPerBird: WeightTable,
    tunnelAirSpeed: SourcedValue,
    ammoniaMaxPpm: SourcedValue,
    co2MaxPpm: SourcedValue,
    rhMax: SourcedValue,
    padFaceVelocity: SourcedValue,
    fanCapacity: SourcedValue,
    windowAreaPct: SourcedValue,
  }),
  feed: z.object({
    phases: z.array(FeedPhase).min(1),
    bagKg: SourcedValue,
    /** Things never to feed this species. */
    forbidden: z.array(LocalizedText).min(1),
    /** Practical notes on supplements / kitchen scraps for home rearing. */
    homeNotes: z.array(LocalizedText).min(1),
  }),
  health: z.object({
    vaccinations: z.array(Vaccination),
    withdrawalNote: LocalizedText,
  }),
  housing: z.object({
    floors: z.array(FloorOption).min(1),
    litters: z.array(LitterOption).min(1),
    wetLitter: LocalizedText,
    litterChange: LocalizedText,
    smallSpaceTips: z.array(LocalizedText).min(1),
    behaviour: z.object({
      cold: LocalizedText,
      hot: LocalizedText,
      draught: LocalizedText,
      comfortable: LocalizedText,
    }),
  }),
})
export type SpeciesData = z.infer<typeof SpeciesData>

/** Feed ingredient composition (as-fed basis). */
export const Ingredient = z.object({
  id: z.string().min(1),
  name: LocalizedText,
  kind: z.enum(['energy', 'protein', 'byproduct', 'mineral', 'custom']),
  crudeProtein: SourcedValue,
  energy: SourcedValue,
  calcium: SourcedValue.optional(),
  note: LocalizedText.optional(),
})
export type Ingredient = z.infer<typeof Ingredient>

export const SourceRef = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  year: z.number().int().optional(),
  url: z.url(),
  kind: z.enum(['breed-guide', 'fao', 'egypt-gov', 'university', 'journal', 'vet-manual', 'regulation', 'app-rule']),
})
export type SourceRef = z.infer<typeof SourceRef>

// ---------- Health ----------

export const SymptomGroup = z.enum(['general', 'respiratory', 'digestive', 'nervous', 'legs', 'chicks'])
export type SymptomGroup = z.infer<typeof SymptomGroup>

export const Symptom = z.object({
  id: z.string().min(1),
  group: SymptomGroup,
  label: LocalizedText,
})
export type Symptom = z.infer<typeof Symptom>

export const Condition = z.object({
  id: z.string().min(1),
  name: LocalizedText,
  groups: z.array(SpeciesGroup).min(1),
  /** Weighted signs: 3 = hallmark, 2 = common, 1 = possible. */
  signs: z.array(z.object({ symptom: z.string().min(1), weight: z.union([z.literal(1), z.literal(2), z.literal(3)]) })).min(2),
  ageFrom: z.number().int().min(0),
  ageTo: z.number().int().min(0),
  urgency: z.enum(['vet-now', 'vet-soon', 'manage']),
  notifiable: z.boolean(),
  summary: LocalizedText,
  actions: z.array(LocalizedText).min(1),
  source: z.string().min(1),
  sourceUrl: z.url(),
  confidence: Confidence,
  lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type Condition = z.infer<typeof Condition>

// ---------- v2: bird profiles (one per breed) ----------

export const BirdKind = z.enum(['chicken', 'pigeon', 'quail', 'duck', 'goose', 'turkey'])
export type BirdKind = z.infer<typeof BirdKind>

/** Where the birds are kept — drives the weather adjustment. */
export const Place = z.enum(['roof-open', 'roof-shaded', 'room', 'balcony', 'yard'])
export type Place = z.infer<typeof Place>

/** A sourced statement (text instead of a number). */
export const SourcedText = z.object({
  text: LocalizedText,
  source: z.string().min(1),
  sourceUrl: z.url(),
  confidence: Confidence,
  lastReviewed: isoDate,
})
export type SourcedText = z.infer<typeof SourcedText>

/**
 * Temperature (°C) and humidity (%) limits for an age band.
 * green = comfortMin..comfortMax · yellow = between comfort and danger · red = beyond danger.
 */
export const ClimateBand = z
  .object({
    fromDay: z.number().int().min(0),
    toDay: z.number().int().min(0),
    comfortMin: SourcedValue,
    comfortMax: SourcedValue,
    dangerLow: SourcedValue,
    dangerHigh: SourcedValue,
    /** Relative humidity above this is uncomfortable (wet litter, ammonia). */
    rhMax: SourcedValue,
  })
  .refine(
    (b) =>
      b.dangerLow.value <= b.comfortMin.value &&
      b.comfortMin.value <= b.comfortMax.value &&
      b.comfortMax.value <= b.dangerHigh.value,
    { message: 'need dangerLow ≤ comfortMin ≤ comfortMax ≤ dangerHigh' },
  )
export type ClimateBand = z.infer<typeof ClimateBand>

export const SpaceBand = z.object({
  fromDay: z.number().int().min(0),
  toDay: z.number().int().min(0),
  /** Max birds (or pairs for pigeons) per m² of floor. */
  perM2: SourcedValue,
})
export type SpaceBand = z.infer<typeof SpaceBand>

export const ProfileFeedPhase = z.object({
  id: z.string().min(1),
  name: LocalizedText,
  fromDay: z.number().int().min(0),
  toDay: z.number().int().min(0),
  crudeProtein: SourcedValue.optional(),
  note: LocalizedText.optional(),
})
export type ProfileFeedPhase = z.infer<typeof ProfileFeedPhase>

export const ScrapVerdict = z.enum(['ok', 'limit', 'no'])
export type ScrapVerdict = z.infer<typeof ScrapVerdict>

/** Verdict on a household scrap (id from src/data/scraps.ts) for this bird. */
export const ScrapRule = z.object({
  item: z.string().min(1),
  verdict: ScrapVerdict,
  reason: LocalizedText,
  source: z.string().min(1),
  sourceUrl: z.url(),
  confidence: Confidence,
})
export type ScrapRule = z.infer<typeof ScrapRule>

export const MixRule = z.object({
  kind: BirdKind,
  reason: LocalizedText,
  source: z.string().min(1),
  sourceUrl: z.url(),
  confidence: Confidence,
})
export type MixRule = z.infer<typeof MixRule>

/** A check during natural incubation, `day` counted from the day the bird starts sitting (day 0). */
export const BroodCheck = z.object({
  id: z.string().min(1),
  day: z.number().int().min(0),
  title: LocalizedText,
  detail: LocalizedText,
})
export type BroodCheck = z.infer<typeof BroodCheck>

export const BirdProfile = z.object({
  id: z.string().min(1),
  kind: BirdKind,
  name: LocalizedText,
  description: LocalizedText,
  purposes: z.array(Purpose).min(1),
  dataStatus: z.enum(['full', 'limited']),
  /** Counting unit: pigeons are managed in breeding pairs. */
  unit: z.enum(['birds', 'pairs']),
  /** Detailed SpeciesData id (planner, ventilation, equipment) when available. */
  detailedId: z.string().optional(),
  /** Typical age (days) of birds people buy or keep when they don't know — used for "مش عارف". */
  defaultAge: z.number().int().min(0),
  // 1. Housing
  housing: z.object({
    type: LocalizedText,
    space: z.array(SpaceBand).min(1),
    perchCm: SourcedValue.optional(),
    birdsPerNest: SourcedValue.optional(),
    water: LocalizedText,
    notes: z.array(LocalizedText).min(1),
  }),
  // 2. Feeding by age + household scraps
  feeding: z.object({
    phases: z.array(ProfileFeedPhase).min(1),
    /** Feed intake g/bird/day by age, when a sourced table exists. */
    dailyFeed: AgeTable.optional(),
    /** Litres of water per kg of feed at ~21°C. */
    waterToFeed: SourcedValue.optional(),
    scraps: z.array(ScrapRule).min(1),
    notes: z.array(LocalizedText).min(1),
  }),
  // 3. Cycle (chick → sale / first egg / first squabs)
  cycle: z.object({
    endpoint: z.enum(['market', 'first-egg', 'first-squab']),
    endpointAge: SourcedValue,
    template: CycleTemplate,
  }),
  // 4. Breeding (natural sitting)
  breeding: z.object({
    broody: z.enum(['yes', 'weak', 'no']),
    incubationDays: SourcedValue,
    eggsPerSitting: SourcedValue.optional(),
    checks: z.array(BroodCheck).min(1),
    care: z.array(LocalizedText).min(1),
  }),
  // 5. Health
  health: z.object({
    vaccinations: z.array(Vaccination),
    problems: z.array(SourcedText).min(1),
    dangerSigns: z.array(LocalizedText).min(1),
  }),
  // 6. Climate by age
  climate: z.object({ bands: z.array(ClimateBand).min(1) }),
  // 7. Mixing
  mixing: z.object({ okWith: z.array(BirdKind), avoid: z.array(MixRule) }),
  // 8. Expected numbers (at least one)
  expected: z
    .object({
      bodyWeight: AgeTable.optional(),
      adultWeightKg: SourcedValue.optional(),
      eggsPerYear: SourcedValue.optional(),
      eggWeightG: SourcedValue.optional(),
      feedToMarketKg: SourcedValue.optional(),
      squabsPerPairYear: SourcedValue.optional(),
    })
    .refine((e) => Object.values(e).some((v) => v !== undefined), { message: 'expected needs at least one number' }),
})
export type BirdProfile = z.infer<typeof BirdProfile>
