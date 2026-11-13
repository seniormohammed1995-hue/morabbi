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

export const Purpose = z.enum(['meat', 'eggs', 'breeding'])
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

export const SourceRef = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  year: z.number().int().optional(),
  url: z.url(),
  kind: z.enum(['breed-guide', 'fao', 'egypt-gov', 'university', 'regulation', 'app-rule']),
})
export type SourceRef = z.infer<typeof SourceRef>
