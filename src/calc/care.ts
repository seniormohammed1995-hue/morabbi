/**
 * Age-based care schedule (v3.1): what changes for a group on a given day, read from its
 * breed profile — feed phase changes, warmth steps, one-off cycle tasks, vaccinations and
 * the cycle endpoint — plus medicine withdrawal countdowns. Pure functions; the scheduler
 * (src/reminders.ts) turns them into a morning digest notification.
 */
import type {
  BirdProfile,
  ClimateBand,
  CycleTask,
  ProfileFeedPhase,
  Vaccination,
} from '../data/schema'
import { addDays, daysBetween } from './dates'

export interface CareGroup {
  id: number
  profile: BirdProfile
  /** Age in days on `today`. */
  age: number
  /** Vaccinations to remind about (the profile's own, or the detailed species programme). */
  vaccinations: Vaccination[]
}

export type CareEvent = { id: string; groupId: number; date: string; age: number } & (
  | { type: 'feed'; phase: ProfileFeedPhase }
  | { type: 'climate'; band: ClimateBand }
  | { type: 'task'; task: CycleTask }
  | { type: 'vaccine'; vaccination: Vaccination }
  | { type: 'endpoint'; endpoint: BirdProfile['cycle']['endpoint'] }
)

/** Order inside one day: health first, then what the keeper has to change. */
const ORDER: Record<CareEvent['type'], number> = {
  vaccine: 0,
  feed: 1,
  climate: 2,
  task: 3,
  endpoint: 4,
}

/** Events for one group at one age (usually none). */
export function eventsAtAge(g: CareGroup, age: number, date: string): CareEvent[] {
  if (age < 0) return []
  const base = { groupId: g.id, date, age }
  const out: CareEvent[] = []
  const p = g.profile

  for (const v of g.vaccinations)
    if (v.day === age)
      out.push({ ...base, id: `vaccine:${g.id}:${v.id}`, type: 'vaccine', vaccination: v })

  if (age > 0) {
    const phase = p.feeding.phases.find((ph) => ph.fromDay === age)
    if (phase) out.push({ ...base, id: `feed:${g.id}:${phase.id}`, type: 'feed', phase })

    const bands = p.climate.bands
    const i = bands.findIndex((b) => b.fromDay === age)
    if (i > 0) {
      const band = bands[i]!
      const prev = bands[i - 1]!
      const changed =
        band.comfortMin.value !== prev.comfortMin.value ||
        band.comfortMax.value !== prev.comfortMax.value
      if (changed) out.push({ ...base, id: `climate:${g.id}:${age}`, type: 'climate', band })
    }
  }

  for (const task of p.cycle.template.tasks)
    if (!task.daily && task.fromDay === age)
      out.push({ ...base, id: `task:${g.id}:${task.id}`, type: 'task', task })

  if (age > 0 && age === Math.round(p.cycle.endpointAge.value))
    out.push({ ...base, id: `endpoint:${g.id}`, type: 'endpoint', endpoint: p.cycle.endpoint })

  return out.sort((a, b) => ORDER[a.type] - ORDER[b.type])
}

/** All events from `today` for `days` days (today included), sorted by date. */
export function careEvents(groups: CareGroup[], today: string, days: number): CareEvent[] {
  const out: CareEvent[] = []
  for (let d = 0; d < days; d++) {
    const date = addDays(today, d)
    for (const g of groups) out.push(...eventsAtAge(g, g.age + d, date))
  }
  return out
}

/** Groups events by date, keeping date order. */
export function byDate<T extends { date: string }>(
  events: T[],
): Array<{ date: string; events: T[] }> {
  const map = new Map<string, T[]>()
  for (const e of events) {
    const list = map.get(e.date)
    if (list) list.push(e)
    else map.set(e.date, [e])
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({ date, events: list }))
}

// ---------- Medicine withdrawal ----------

export interface TreatmentLike {
  /** Date of the last dose, YYYY-MM-DD. */
  lastDose: string
  /** Days to wait before eating eggs / meat, as written on the label. */
  eggDays?: number
  meatDays?: number
}

export interface WithdrawalSide {
  /** First day the product is safe again. */
  safeFrom: string
  /** Whole days still to wait (0 when over). */
  daysLeft: number
}

export interface WithdrawalStatus {
  eggs?: WithdrawalSide
  meat?: WithdrawalSide
  /** True while either side is still inside its withdrawal period. */
  active: boolean
}

/**
 * The last-dose day itself does not count: with a 7-day period and a last dose on the 1st,
 * the product is safe again from the 8th.
 */
export function withdrawalStatus(tr: TreatmentLike, today: string): WithdrawalStatus {
  const side = (days: number | undefined): WithdrawalSide | undefined => {
    if (days === undefined || days <= 0) return undefined
    const safeFrom = addDays(tr.lastDose, days)
    return { safeFrom, daysLeft: Math.max(0, daysBetween(today, safeFrom)) }
  }
  const eggs = side(tr.eggDays)
  const meat = side(tr.meatDays)
  return {
    ...(eggs ? { eggs } : {}),
    ...(meat ? { meat } : {}),
    active: (eggs?.daysLeft ?? 0) > 0 || (meat?.daysLeft ?? 0) > 0,
  }
}
