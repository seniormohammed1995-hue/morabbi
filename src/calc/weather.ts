import type { BirdProfile, ClimateBand, Place, SourcedValue } from '../data/schema'
import { climateAt } from './birds'

/** Minimal hourly point used by the calculations (matches platform WeatherPoint). */
export interface Hour {
  time: string
  tempC: number
  rh: number
  gustKmh: number
  precipMm: number
  precipProb?: number
  code: number
  isDay: boolean
  /** Shortwave (sun) radiation, W/m². */
  radWm2: number
}

export interface WeatherParams {
  /** °C-equivalent per W/m² of sun on birds in full sun. */
  sunLoadPerWm2: SourcedValue
  /** Share of the sun load that reaches birds in each place (0–1). */
  placeSunShare: Record<Place, SourcedValue>
  /** Air speed assumed in still air for the THVI (m/s). */
  stillAirMs: SourcedValue
  /** THVI category limits. */
  thi: { alert: SourcedValue; danger: SourcedValue; emergency: SourcedValue }
  /** Water intake rises by this fraction per °C above `waterBaseC`. */
  waterPerDegree: SourcedValue
  waterBaseC: SourcedValue
}

/** Hours above rhMax (in the look-ahead window) before a humidity alert — app rule. */
export const HUMID_HOURS = 6

/** Wet-bulb temperature (°C) from air temperature (°C) and RH (%) — Stull (2011). Valid for RH 5–99 %, T −20…50 °C. */
export function wetBulb(t: number, rh: number): number {
  return (
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  )
}

/** Temperature-humidity-velocity index for broilers (Tao & Xin, 2003): (0.85·Tdb + 0.15·Twb)·V^−0.058, °C. */
export function thi(t: number, rh: number, airMs: number): number {
  return (0.85 * t + 0.15 * wetBulb(t, rh)) * Math.pow(Math.max(airMs, 0.2), -0.058)
}

export type HeatLevel = 'normal' | 'alert' | 'danger' | 'emergency'

export function heatLevel(index: number, p: WeatherParams['thi']): HeatLevel {
  if (index >= p.emergency.value) return 'emergency'
  if (index >= p.danger.value) return 'danger'
  if (index >= p.alert.value) return 'alert'
  return 'normal'
}

/** Estimated temperature where the birds are: air temperature + the sun load their place lets in. */
export function feltTemp(tempC: number, place: Place, radWm2: number, p: WeatherParams): number {
  return tempC + Math.max(0, radWm2) * p.sunLoadPerWm2.value * p.placeSunShare[place].value
}

export interface Reading {
  tempC: number
  rh: number
  /** 'manual' = thermometer at the birds (no place offset); 'estimate' = forecast + place offset. */
  kind: 'manual' | 'estimate'
  at: number
}

/** Current conditions at the birds: a recent thermometer reading wins over the estimate. */
export function currentReading(
  forecast:
    | { current: { tempC: number; rh: number; radWm2: number }; fetchedAt: number }
    | null
    | undefined,
  manual: { tempC: number; rh?: number; at: number } | null | undefined,
  place: Place,
  p: WeatherParams,
): Reading | null {
  if (manual)
    return {
      tempC: manual.tempC,
      rh: manual.rh ?? forecast?.current.rh ?? 50,
      kind: 'manual',
      at: manual.at,
    }
  if (!forecast) return null
  const c = forecast.current
  return {
    tempC: feltTemp(c.tempC, place, c.radWm2, p),
    rh: c.rh,
    kind: 'estimate',
    at: forecast.fetchedAt,
  }
}

export type Comfort = 'green' | 'yellow' | 'red'
export type ComfortWhy = 'ok' | 'cold' | 'hot' | 'humid'

/** Comfort light from the profile's limits for that age. */
export function comfort(
  band: ClimateBand,
  tempC: number,
  rh: number,
): { level: Comfort; why: ComfortWhy } {
  if (tempC < band.dangerLow.value) return { level: 'red', why: 'cold' }
  if (tempC > band.dangerHigh.value) return { level: 'red', why: 'hot' }
  if (tempC < band.comfortMin.value) return { level: 'yellow', why: 'cold' }
  if (tempC > band.comfortMax.value) return { level: 'yellow', why: 'hot' }
  if (rh > band.rhMax.value) return { level: 'yellow', why: 'humid' }
  return { level: 'green', why: 'ok' }
}

export const comfortFor = (profile: BirdProfile, age: number, r: Reading) =>
  comfort(climateAt(profile, age), r.tempC, r.rh)

/** Water for a group today (litres), from feed intake × water:feed, raised for heat. Undefined when not sourced. */
export function waterEstimateL(
  profile: BirdProfile,
  age: number,
  count: number,
  tempC: number | undefined,
  p: WeatherParams,
): number | undefined {
  const table = profile.feeding.dailyFeed
  const ratio = profile.feeding.waterToFeed
  if (!table || !ratio) return undefined
  const pts = table.points
  const d = Math.min(Math.max(age, pts[0]!.day), pts.at(-1)!.day)
  let g = pts[0]!.value
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    if (d <= b.day) {
      g = a.value + ((b.value - a.value) * (d - a.day)) / (b.day - a.day)
      break
    }
    g = b.value
  }
  const base = (g / 1000) * ratio.value * count
  const extra =
    tempC === undefined ? 0 : Math.max(0, tempC - p.waterBaseC.value) * p.waterPerDegree.value
  return base * (1 + extra)
}

// ---------- Alerts ----------

export type AlertType = 'heat' | 'cold' | 'humid' | 'wind' | 'rain'

export interface GroupCtx {
  id: number
  profile: BirdProfile
  age: number
  place: Place
}

export interface WeatherAlert {
  /** Stable per type + day of the event, used for the daily cap and "already shown". */
  id: string
  type: AlertType
  /** First hour of the event. */
  at: string
  /** Higher = more urgent. */
  severity: number
  groupIds: number[]
  /** Worst value in the window: °C for heat/cold, % for humid, km/h for wind, % or mm for rain. */
  value: number
  /** Temperature range the young birds need (cold alerts). */
  need?: { min: number; max: number }
}

const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])

const hoursAhead = (hours: Hour[], nowIso: string, n: number) => {
  const i = hours.findIndex((h) => h.time >= nowIso.slice(0, 13))
  return i < 0 ? [] : hours.slice(i, i + n)
}

/** A group is "young" while its age band asks for more warmth than the adult band. */
export function isYoung(profile: BirdProfile, age: number): boolean {
  const adult = profile.climate.bands.at(-1)!
  return climateAt(profile, age).comfortMin.value > adult.comfortMin.value
}

/**
 * Builds weather alerts for the next hours. `nowIso` is local time YYYY-MM-DDTHH:mm.
 * Each type returns at most one alert (its first/worst occurrence).
 */
export function buildAlerts(
  hours: Hour[],
  groups: GroupCtx[],
  nowIso: string,
  p: WeatherParams,
  windows: Record<AlertType, number>,
  limits: { gustKmh: number; rainProbPct: number },
): WeatherAlert[] {
  const out: WeatherAlert[] = []
  if (groups.length === 0 || hours.length === 0) return out
  const day = (time: string) => time.slice(0, 10)

  // Heat: felt temperature above the danger limit for any group, or THI in danger range.
  {
    let first: Hour | undefined
    let worst = -Infinity
    const ids = new Set<number>()
    for (const h of hoursAhead(hours, nowIso, windows.heat)) {
      for (const g of groups) {
        const t = feltTemp(h.tempC, g.place, h.radWm2, p)
        const band = climateAt(g.profile, g.age)
        const level = heatLevel(thi(t, h.rh, p.stillAirMs.value), p.thi)
        const hot = t > band.dangerHigh.value || level === 'danger' || level === 'emergency'
        if (hot) {
          first ??= h
          ids.add(g.id)
          worst = Math.max(worst, t)
        }
      }
    }
    if (first)
      out.push({
        id: `heat:${day(first.time)}`,
        type: 'heat',
        at: first.time,
        severity: 3,
        groupIds: [...ids],
        value: worst,
      })
  }

  // Cold night on young birds: felt temperature below what their age needs, at night.
  {
    let first: Hour | undefined
    let worst = Infinity
    const ids = new Set<number>()
    let need: { min: number; max: number } | undefined
    for (const h of hoursAhead(hours, nowIso, windows.cold)) {
      if (h.isDay) continue
      for (const g of groups) {
        const band = climateAt(g.profile, g.age)
        const t = feltTemp(h.tempC, g.place, 0, p)
        const young = isYoung(g.profile, g.age)
        if ((young && t < band.comfortMin.value) || t < band.dangerLow.value) {
          first ??= h
          ids.add(g.id)
          worst = Math.min(worst, t)
          if (young && (!need || band.comfortMin.value > need.min))
            need = { min: band.comfortMin.value, max: band.comfortMax.value }
        }
      }
    }
    if (first)
      out.push({
        id: `cold:${day(first.time)}`,
        type: 'cold',
        at: first.time,
        severity: 3,
        groupIds: [...ids],
        value: worst,
        ...(need ? { need } : {}),
      })
  }

  // Humid: several hours above the group's humidity limit (wet litter, ammonia).
  {
    const ids = new Set<number>()
    let first: Hour | undefined
    let worst = 0
    for (const g of groups) {
      const band = climateAt(g.profile, g.age)
      const wet = hoursAhead(hours, nowIso, windows.humid).filter((h) => h.rh > band.rhMax.value)
      if (wet.length >= HUMID_HOURS) {
        ids.add(g.id)
        if (!first || wet[0]!.time < first.time) first = wet[0]
        worst = Math.max(worst, ...wet.map((h) => h.rh))
      }
    }
    if (first)
      out.push({
        id: `humid:${day(first.time)}`,
        type: 'humid',
        at: first.time,
        severity: 1,
        groupIds: [...ids],
        value: worst,
      })
  }

  // Wind / dust.
  {
    const w = hoursAhead(hours, nowIso, windows.wind).filter((h) => h.gustKmh >= limits.gustKmh)
    if (w.length)
      out.push({
        id: `wind:${day(w[0]!.time)}`,
        type: 'wind',
        at: w[0]!.time,
        severity: 2,
        groupIds: groups.map((g) => g.id),
        value: Math.max(...w.map((h) => h.gustKmh)),
      })
  }

  // Rain.
  {
    const r = hoursAhead(hours, nowIso, windows.rain).filter(
      (h) =>
        (h.precipProb ?? 0) >= limits.rainProbPct || (RAIN_CODES.has(h.code) && h.precipMm > 0),
    )
    if (r.length)
      out.push({
        id: `rain:${day(r[0]!.time)}`,
        type: 'rain',
        at: r[0]!.time,
        severity: 2,
        groupIds: groups.map((g) => g.id),
        value: Math.max(...r.map((h) => h.precipProb ?? 0)),
      })
  }

  return out
}

/**
 * Keeps at most `max` alerts per day: those already shown today stay, then the most urgent
 * enabled ones fill the remaining slots. Returns the alerts to display.
 */
export function capAlerts(
  alerts: WeatherAlert[],
  enabled: Record<AlertType, boolean>,
  shownToday: string[],
  max: number,
): WeatherAlert[] {
  const on = alerts.filter((a) => enabled[a.type])
  const already = on.filter((a) => shownToday.includes(a.id))
  const fresh = on
    .filter((a) => !shownToday.includes(a.id))
    .sort((a, b) => b.severity - a.severity || a.at.localeCompare(b.at))
  const room = Math.max(0, max - shownToday.length)
  return [...already, ...fresh.slice(0, room)].slice(0, max)
}
