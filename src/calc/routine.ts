import type { BirdKind, BirdProfile, CycleTask, LocalizedText, Place } from '../data/schema'
import { climateAt } from './birds'
import { comfort, feltTemp, isYoung, waterEstimateL, type WeatherParams } from './weather'

export interface RoutineGroup {
  id: number
  kind: BirdKind
  profile: BirdProfile
  purpose: string
  age: number
  count: number
  place: Place
}

export type RoutineType = 'heat' | 'cold' | 'water' | 'feed' | 'eggs' | 'check' | 'cycle' | 'clean'

export interface RoutineItem {
  /** Stable for the day (used to remember "done"). */
  id: string
  type: RoutineType
  groups: Array<{ id: number; kind: BirdKind; waterL?: number; feedName?: LocalizedText }>
  /** For cycle tasks: the task text from the profile. */
  task?: CycleTask
}

export interface RoutineWeather {
  /** Air temperature now and the hottest/coldest hour today (°C), with the sun load at those hours. */
  maxC?: number
  maxRad?: number
  minC?: number
  rhNow?: number
}

/** Laying birds: egg or dual purpose, at or past first-egg age. */
export function isLaying(g: RoutineGroup): boolean {
  const c = g.profile.cycle
  const layingKind = g.kind !== 'pigeon'
  const purpose = g.purpose === 'eggs' || g.purpose === 'dual' || g.purpose === 'breeding'
  const firstEgg =
    c.endpoint === 'first-egg'
      ? c.endpointAge.value
      : g.profile.expected.eggsPerYear
        ? c.endpointAge.value
        : Infinity
  return layingKind && purpose && g.age >= firstEgg
}

const phaseAt = (p: BirdProfile, age: number) =>
  p.feeding.phases.find((ph) => age >= ph.fromDay && age <= ph.toDay) ?? p.feeding.phases.at(-1)!

/**
 * Today's routine: 3–5 short tasks across all groups, most important first.
 * Weather turns into an action at the top when it is dangerous today (heat or cold),
 * or when young birds need extra warmth.
 */
export function dailyRoutine(
  groups: RoutineGroup[],
  w: RoutineWeather,
  params: WeatherParams,
  max = 5,
): RoutineItem[] {
  if (groups.length === 0) return []
  const items: RoutineItem[] = []
  const g1 = (g: RoutineGroup) => ({ id: g.id, kind: g.kind })

  if (w.maxC !== undefined) {
    const hot = groups.filter((g) => {
      const t = feltTemp(w.maxC!, g.place, w.maxRad ?? 0, params)
      const c = comfort(climateAt(g.profile, g.age), t, w.rhNow ?? 50)
      return c.why === 'hot' && c.level === 'red'
    })
    if (hot.length) items.push({ id: 'heat', type: 'heat', groups: hot.map(g1) })
  }
  if (w.minC !== undefined) {
    // Young birds need warmth as soon as it drops below their comfort; adults only when it is dangerous.
    const cold = groups.filter((g) => {
      const c = comfort(climateAt(g.profile, g.age), w.minC!, w.rhNow ?? 50)
      return c.why === 'cold' && (c.level === 'red' || isYoung(g.profile, g.age))
    })
    if (cold.length) items.push({ id: 'cold', type: 'cold', groups: cold.map(g1) })
  }

  const hotC = w.maxC === undefined ? undefined : w.maxC
  items.push({
    id: 'water',
    type: 'water',
    groups: groups.map((g) => {
      const l = waterEstimateL(g.profile, g.age, g.count, hotC, params)
      return { ...g1(g), ...(l === undefined ? {} : { waterL: l }) }
    }),
  })
  items.push({
    id: 'feed',
    type: 'feed',
    groups: groups.map((g) => ({ ...g1(g), feedName: phaseAt(g.profile, g.age).name })),
  })

  const laying = groups.filter(isLaying)
  if (laying.length) items.push({ id: 'eggs', type: 'eggs', groups: laying.map(g1) })

  items.push({ id: 'check', type: 'check', groups: groups.map(g1) })

  // One-off cycle tasks due today (not the daily ones, which the routine already covers).
  for (const g of groups) {
    for (const task of g.profile.cycle.template.tasks) {
      if (task.daily || g.age < task.fromDay || g.age > task.toDay) continue
      items.push({ id: `cycle:${g.id}:${task.id}`, type: 'cycle', groups: [g1(g)], task })
    }
  }

  items.push({ id: 'clean', type: 'clean', groups: groups.map(g1) })

  // Keep weather actions, water and feed; fill the rest in order; never fewer than 3.
  return items.slice(0, Math.max(3, max))
}
