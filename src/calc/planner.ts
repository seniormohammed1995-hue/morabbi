import type { HeaterOption, HouseType, Season, SpeciesData, WeightTable } from '../data/schema'
import { RULES, GOVERNORATES, type ClimateZone } from '../data/rules'
import { parseISODate, addDays } from './dates'
import { valueAt } from './interp'

// ---------- Season ----------

export function seasonForDate(iso: string): Season {
  const month = parseISODate(iso).getMonth() + 1
  if ((RULES.summerMonths as readonly number[]).includes(month)) return 'summer'
  if ((RULES.winterMonths as readonly number[]).includes(month)) return 'winter'
  return 'mild'
}

export function zoneOf(governorateId: string): ClimateZone {
  return GOVERNORATES.find((g) => g.id === governorateId)?.zone ?? 'delta'
}

// ---------- Growth helpers ----------

export function marketAgeDays(sp: SpeciesData): number {
  return Math.round(sp.marketAge.value)
}

/** Target body weight in kg at a given age. */
export function weightKgAt(sp: SpeciesData, day: number): number {
  return valueAt(sp.growth.bodyWeight, day).value / 1000
}

export function marketWeightKg(sp: SpeciesData): number {
  return weightKgAt(sp, marketAgeDays(sp))
}

export function marketDate(sp: SpeciesData, placementDate: string): string {
  return addDays(placementDate, marketAgeDays(sp))
}

// ---------- Density ----------

export interface DensityInput {
  houseType: HouseType
  season: Season
  areaM2: number
  count: number
}

export interface DensityResult {
  maxKgPerM2: number
  maxBirds: number
  marketWeightKg: number
  birdsPerM2AtMarket: number
  kgPerM2AtMarket: number
  ratio: number
  status: 'ok' | 'tight' | 'over'
  /** Minimum area needed for the requested count. */
  requiredAreaM2: number
  summerFactor: number
}

export function maxDensityKg(sp: SpeciesData, houseType: HouseType, season: Season): number {
  const base = sp.space.maxDensityKgPerM2[houseType]?.value
  if (base === undefined) throw new Error(`No density for house type ${houseType}`)
  return season === 'summer' && houseType !== 'closed' ? base * sp.space.summerDensityFactor.value : base
}

export function density(sp: SpeciesData, input: DensityInput): DensityResult {
  const maxKg = maxDensityKg(sp, input.houseType, input.season)
  const w = marketWeightKg(sp)
  const maxBirds = Math.max(0, Math.floor((input.areaM2 * maxKg) / w))
  const ratio = maxBirds === 0 ? Infinity : input.count / maxBirds
  const status = ratio > 1 ? 'over' : ratio > RULES.tightDensityRatio ? 'tight' : 'ok'
  return {
    maxKgPerM2: maxKg,
    maxBirds,
    marketWeightKg: w,
    birdsPerM2AtMarket: input.areaM2 > 0 ? input.count / input.areaM2 : Infinity,
    kgPerM2AtMarket: input.areaM2 > 0 ? (input.count * w) / input.areaM2 : Infinity,
    ratio,
    status,
    requiredAreaM2: (input.count * w) / maxKg,
    summerFactor:
      input.season === 'summer' && input.houseType !== 'closed' ? sp.space.summerDensityFactor.value : 1,
  }
}

// ---------- Brooding area ----------

export interface BroodStep {
  day: number
  areaM2: number
  fraction: number
  full: boolean
}

/** Brooding area needed for `chicks` at `day`, capped at the whole floor. */
export function broodingArea(sp: SpeciesData, chicks: number, day: number, floorM2: number): BroodStep {
  const fullDay = sp.space.fullHouseDay.value
  if (day >= fullDay) return { day, areaM2: floorM2, fraction: 1, full: true }
  const perM2 = valueAt(sp.space.broodingDensity, day).value
  const area = Math.min(floorM2, chicks / perM2)
  return { day, areaM2: area, fraction: floorM2 > 0 ? area / floorM2 : 1, full: area >= floorM2 }
}

/** Expansion schedule at each brooding-density table point until the whole floor is used. */
export function broodingSchedule(sp: SpeciesData, chicks: number, floorM2: number): BroodStep[] {
  const days = sp.space.broodingDensity.points.map((p) => p.day)
  const fullDay = sp.space.fullHouseDay.value
  const steps: BroodStep[] = []
  for (const d of days) {
    if (d >= fullDay) break
    const s = broodingArea(sp, chicks, d, floorM2)
    steps.push(s)
    if (s.full) return steps
  }
  steps.push({ day: fullDay, areaM2: floorM2, fraction: 1, full: true })
  return steps
}

// ---------- Heating ----------

export interface HeaterPlan {
  heater: HeaterOption
  count: number
  alternatives: HeaterOption[]
}

export function heaterPlan(sp: SpeciesData, chicks: number, preferredId?: string): HeaterPlan {
  const fits = sp.equipment.heaters.filter((h) => chicks >= h.minFlock && chicks <= h.maxFlock)
  const pool = fits.length > 0 ? fits : sp.equipment.heaters
  const heater =
    pool.find((h) => h.id === preferredId) ??
    // Default: the smallest-capacity suitable unit — more units spread heat more evenly.
    [...pool].sort((a, b) => a.chicksPerUnit.value - b.chicksPerUnit.value)[0]!
  return {
    heater,
    count: Math.max(1, Math.ceil(chicks / heater.chicksPerUnit.value)),
    alternatives: pool.filter((h) => h.id !== heater.id),
  }
}

// ---------- Ventilation ----------

export interface VentilationResult {
  minM3h: number
  maxM3h: number
  fans: number
  padAreaM2: number
  windowAreaM2: number
  liveKg: number
}

/** Linear interpolation on a body-weight table (clamped at the ends). */
export function valueAtWeight(tbl: WeightTable, kg: number): number {
  const p = tbl.points
  if (kg <= p[0]!.kg) return p[0]!.value
  for (let i = 1; i < p.length; i++) {
    const b = p[i]!
    if (kg <= b.kg) {
      const a = p[i - 1]!
      return a.value + ((b.value - a.value) * (kg - a.kg)) / (b.kg - a.kg)
    }
  }
  return p[p.length - 1]!.value
}

/**
 * Minimum ventilation from the per-bird table; maximum (hot weather) from the tunnel
 * design air speed across the house cross-section (width × height).
 */
export function ventilation(
  sp: SpeciesData,
  birds: number,
  day: number,
  floorM2: number,
  crossSectionM2: number,
): VentilationResult {
  const w = weightKgAt(sp, day)
  const liveKg = birds * w
  const v = sp.ventilation
  const minM3h = birds * valueAtWeight(v.minPerBird, w)
  const maxM3h = Math.max(minM3h, crossSectionM2 * v.tunnelAirSpeed.value * 3600)
  return {
    liveKg,
    minM3h,
    maxM3h,
    fans: Math.max(1, Math.ceil(maxM3h / v.fanCapacity.value)),
    padAreaM2: maxM3h / 3600 / v.padFaceVelocity.value,
    windowAreaM2: (floorM2 * v.windowAreaPct.value) / 100,
  }
}

// ---------- Feeders & drinkers ----------

export interface EquipmentResult {
  chickTrays: number
  chickDrinkers: number
  supplementary: boolean
  panFeeders: number
  troughM: number
  nipples: number
  bellDrinkers: number
}

export function equipment(sp: SpeciesData, birds: number, day: number): EquipmentResult {
  const e = sp.equipment
  const supplementary = day <= e.supplementaryUntilDay.value
  return {
    supplementary,
    chickTrays: supplementary ? Math.ceil(birds / e.chickFeederTrayBirds.value) : 0,
    chickDrinkers: supplementary ? Math.ceil(birds / e.chickDrinkerBirds.value) : 0,
    panFeeders: Math.ceil(birds / e.panFeederBirds.value),
    troughM: (birds * e.troughCmPerBird.value) / 100,
    nipples: Math.ceil(birds / e.nippleBirds.value),
    bellDrinkers: Math.ceil(birds / e.bellDrinkerBirds.value),
  }
}

// ---------- Litter ----------

/** Litter volume in m³ for a floor area and depth in cm. */
export function litterVolumeM3(floorM2: number, depthCm: number): number {
  return (floorM2 * depthCm) / 100
}

/** Length of a square chick guard enclosing the given brooding area. */
export function guardLengthM(areaM2: number): number {
  return 4 * Math.sqrt(areaM2)
}
