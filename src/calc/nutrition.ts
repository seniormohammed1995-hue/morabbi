import type { BirdProfile, ProfileFeedPhase } from '../data/schema'
import { valueAt } from './interp'
import { waterEstimateL, type WeatherParams } from './weather'

export interface DailyNeeds {
  /** Feed phase for this age. */
  phase: ProfileFeedPhase
  /** Grams per bird per day, when the breed has a sourced intake table. */
  feedG?: number
  /** Total kg per day for the whole group. */
  feedKg?: number
  /** Total litres per day (feed × water ratio, adjusted for heat). */
  waterL?: number
}

export function phaseAt(p: BirdProfile, age: number): ProfileFeedPhase {
  return (
    p.feeding.phases.find((ph) => age >= ph.fromDay && age <= ph.toDay) ?? p.feeding.phases.at(-1)!
  )
}

/**
 * Feed and water for a group per day. Pigeons are counted in pairs (2 birds each).
 * Numbers exist only for breeds with a sourced daily-feed table; otherwise only the phase is known.
 */
export function dailyNeeds(
  p: BirdProfile,
  age: number,
  count: number,
  tempC: number | undefined,
  params: WeatherParams,
): DailyNeeds {
  const birds = p.unit === 'pairs' ? count * 2 : count
  const phase = phaseAt(p, age)
  const table = p.feeding.dailyFeed
  if (!table) return { phase }
  const feedG = valueAt(table, age).value
  const waterL = waterEstimateL(p, age, birds, tempC, params)
  return {
    phase,
    feedG,
    feedKg: (feedG * birds) / 1000,
    ...(waterL === undefined ? {} : { waterL }),
  }
}

/**
 * Splits a day's food between balanced feed and household scraps so scraps stay at or under
 * `maxPct` of the total weight. Returns kg.
 */
export function scrapsSplit(totalKg: number, maxPct: number): { scrapsKg: number; feedKg: number } {
  const pct = Math.min(Math.max(maxPct, 0), 100) / 100
  const scrapsKg = totalKg * pct
  return { scrapsKg, feedKg: totalKg - scrapsKg }
}
