import type { FeedPhase, SpeciesData } from '../data/schema'
import { valueAt } from './interp'

export function feedPhaseAt(sp: SpeciesData, day: number): FeedPhase {
  const phases = sp.feed.phases
  return (
    phases.find((p) => day >= p.fromDay && day <= p.toDay) ??
    (day < phases[0]!.fromDay ? phases[0]! : phases[phases.length - 1]!)
  )
}

/** Standard daily feed intake, g per bird. */
export function dailyFeedG(sp: SpeciesData, day: number): number {
  return valueAt(sp.growth.dailyFeed, day).value
}

/** Expected water, litres per bird per day, from feed intake × water:feed ratio. */
export function dailyWaterL(sp: SpeciesData, day: number): number {
  return (dailyFeedG(sp, day) * sp.growth.waterToFeedRatio.value) / 1000
}

export interface PhaseFeed {
  phase: FeedPhase
  kg: number
  bags: number
}

export interface CycleFeed {
  totalKg: number
  bags: number
  byPhase: PhaseFeed[]
}

/**
 * Feed needed for a full cycle from day `fromDay` to market age for `birds` placed,
 * assuming mortality spreads linearly over the cycle (expectedMortalityPct of birds lost by the end).
 */
export function cycleFeed(
  sp: SpeciesData,
  birds: number,
  untilDay: number,
  expectedMortalityPct = 0,
  fromDay = 0,
): CycleFeed {
  const bag = sp.feed.bagKg.value
  const byPhase = new Map<string, PhaseFeed>()
  let total = 0
  for (let d = fromDay; d < untilDay; d++) {
    const alive = birds * (1 - (expectedMortalityPct / 100) * (d / Math.max(1, untilDay)))
    const kg = (dailyFeedG(sp, d) * alive) / 1000
    const phase = feedPhaseAt(sp, d)
    const entry = byPhase.get(phase.id) ?? { phase, kg: 0, bags: 0 }
    entry.kg += kg
    byPhase.set(phase.id, entry)
    total += kg
  }
  const list = [...byPhase.values()].map((p) => ({ ...p, bags: Math.ceil(p.kg / bag) }))
  return { totalKg: total, bags: list.reduce((s, p) => s + p.bags, 0), byPhase: list }
}
