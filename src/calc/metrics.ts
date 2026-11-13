import type { SpeciesData } from '../data/schema'
import { RULES } from '../data/rules'
import { valueAt } from './interp'
import { dailyFeedG } from './feed'

export interface LogLike {
  date: string
  age: number
  deaths: number
  culls: number
  feedKg: number
  sampleWeightG?: number
}

export interface SeriesPoint {
  day: number
  weightG?: number
  stdWeightG: number
  feedG?: number
  stdFeedG: number
}

export type AlertKind = 'weightLow' | 'weightHigh' | 'feedLow' | 'feedHigh' | 'mortalityDay' | 'firstWeek' | 'noLog'

export interface Alert {
  kind: AlertKind
  severity: 'watch' | 'urgent'
  pct?: number
  max?: number
}

export interface FlockMetrics {
  alive: number
  deaths: number
  culls: number
  mortalityPct: number
  firstWeekMortalityPct?: number
  day7Multiple?: number
  feedTotalKg: number
  feedPerBirdKg: number
  avgWeightG?: number
  weightAge?: number
  weightDeviationPct?: number
  fcr?: number
  series: SeriesPoint[]
  alerts: Alert[]
}

/**
 * Computes flock indicators from daily logs.
 * @param age current flock age (days) — used for the "missing log" alert.
 */
export function flockMetrics(
  sp: SpeciesData,
  initialCount: number,
  logsIn: readonly LogLike[],
  age: number,
): FlockMetrics {
  const logs = [...logsIn].sort((a, b) => a.age - b.age)
  let alive = initialCount
  let deaths = 0
  let culls = 0
  let feed = 0
  let firstWeekDeaths = 0
  let lastWeigh: { age: number; weight: number; feedSoFar: number; alive: number } | undefined
  const series: SeriesPoint[] = []

  for (const l of logs) {
    const aliveStart = alive
    deaths += l.deaths
    culls += l.culls
    if (l.age <= 7) firstWeekDeaths += l.deaths
    alive = Math.max(0, alive - l.deaths - l.culls)
    feed += l.feedKg
    const point: SeriesPoint = {
      day: l.age,
      stdWeightG: valueAt(sp.growth.bodyWeight, l.age).value,
      stdFeedG: dailyFeedG(sp, l.age),
    }
    if (l.feedKg > 0 && aliveStart > 0) point.feedG = (l.feedKg * 1000) / aliveStart
    if (l.sampleWeightG !== undefined && l.sampleWeightG > 0) {
      point.weightG = l.sampleWeightG
      lastWeigh = { age: l.age, weight: l.sampleWeightG, feedSoFar: feed, alive }
    }
    series.push(point)
  }

  const m: FlockMetrics = {
    alive,
    deaths,
    culls,
    mortalityPct: initialCount > 0 ? (deaths / initialCount) * 100 : 0,
    feedTotalKg: feed,
    feedPerBirdKg: initialCount > 0 ? feed / initialCount : 0,
    series,
    alerts: [],
  }

  if (logs.some((l) => l.age >= 7) && initialCount > 0) {
    m.firstWeekMortalityPct = (firstWeekDeaths / initialCount) * 100
  }

  if (lastWeigh) {
    m.avgWeightG = lastWeigh.weight
    m.weightAge = lastWeigh.age
    const std = valueAt(sp.growth.bodyWeight, lastWeigh.age).value
    m.weightDeviationPct = ((lastWeigh.weight - std) / std) * 100
    const liveKg = (lastWeigh.alive * lastWeigh.weight) / 1000
    if (liveKg > 0 && lastWeigh.feedSoFar > 0) m.fcr = lastWeigh.feedSoFar / liveKg
  }

  m.alerts = alertsFor(sp, m, logs, age)
  return m
}

function alertsFor(sp: SpeciesData, m: FlockMetrics, logs: LogLike[], age: number): Alert[] {
  const out: Alert[] = []
  const dev = RULES.deviation

  if (m.weightDeviationPct !== undefined) {
    const p = m.weightDeviationPct
    if (p < -dev.weightPct) out.push({ kind: 'weightLow', severity: p < -2 * dev.weightPct ? 'urgent' : 'watch', pct: -p })
    else if (p > dev.weightPct) out.push({ kind: 'weightHigh', severity: 'watch', pct: p })
  }

  const recent = m.series.filter((s) => s.feedG !== undefined).slice(-3)
  if (recent.length >= 2) {
    const actual = recent.reduce((s, p) => s + p.feedG!, 0) / recent.length
    const std = recent.reduce((s, p) => s + p.stdFeedG, 0) / recent.length
    const p = ((actual - std) / std) * 100
    if (p < -dev.feedPct) out.push({ kind: 'feedLow', severity: 'watch', pct: -p })
    else if (p > dev.feedPct) out.push({ kind: 'feedHigh', severity: 'watch', pct: p })
  }

  const last = logs.at(-1)
  if (last && last.age > 7) {
    const aliveBefore = m.alive + last.deaths + last.culls
    const p = aliveBefore > 0 ? (last.deaths / aliveBefore) * 100 : 0
    if (p > RULES.dailyMortalityAlertPct) out.push({ kind: 'mortalityDay', severity: 'urgent', pct: p })
  }

  const day7 = m.series.find((s) => s.day === 7 && s.weightG !== undefined)
  const minMultiple = sp.growth.day7WeightMultiple.value
  if (day7 && age <= 21) {
    const day0 = sp.growth.bodyWeight.points[0]!.value
    const multiple = day7.weightG! / day0
    m.day7Multiple = multiple
    if (multiple < minMultiple) out.push({ kind: 'firstWeek', severity: 'watch', pct: multiple, max: minMultiple })
  }

  if (age >= 1 && !logs.some((l) => l.age === age - 1)) out.push({ kind: 'noLog', severity: 'watch' })

  return out
}
