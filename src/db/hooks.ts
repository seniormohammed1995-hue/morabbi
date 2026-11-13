import { useLiveQuery } from 'dexie-react-hooks'
import { db, type DailyLog, type Flock } from './index'
import { getSpecies, type SpeciesEntry } from '../data'
import { ageOn, todayISO } from '../calc/dates'
import { flockMetrics, type FlockMetrics } from '../calc/metrics'

export function useFlocks(): Flock[] | undefined {
  return useLiveQuery(() => db.flocks.orderBy('id').reverse().toArray(), [])
}

export function useFlock(id: number | null | undefined): Flock | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.flocks.get(id)) ?? null) : null), [id])
}

export function useLogs(flockId: number | null | undefined): DailyLog[] | undefined {
  return useLiveQuery(
    async () => (flockId ? db.logs.where('flockId').equals(flockId).sortBy('date') : []),
    [flockId],
  )
}

export function useTasksDone(flockId: number | null | undefined, day: number): Set<string> | undefined {
  return useLiveQuery(async () => {
    if (!flockId) return new Set<string>()
    const rows = await db.tasksDone.where('flockId').equals(flockId).filter((r) => r.day === day).toArray()
    return new Set(rows.map((r) => r.taskId))
  }, [flockId, day])
}

export interface FlockView {
  flock: Flock
  species: SpeciesEntry
  age: number
  today: string
  metrics: FlockMetrics
  logs: DailyLog[]
}

/** Flock + species + age + metrics bundled for screens. */
export function useFlockView(id: number | null | undefined): FlockView | null | undefined {
  const flock = useFlock(id)
  const logs = useLogs(id)
  if (flock === undefined || logs === undefined) return undefined
  if (flock === null) return null
  const species = getSpecies(flock.speciesId)
  if (!species) return null
  const today = todayISO()
  const age = ageOn(flock.placementDate, today)
  const metrics = flockMetrics(species.data, flock.initialCount, logs, age)
  return { flock, species, age, today, metrics, logs }
}
