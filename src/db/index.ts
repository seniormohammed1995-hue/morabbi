import Dexie, { type EntityTable } from 'dexie'
import type { BirdKind, HouseType, Place, Purpose } from '../data/schema'
import { migrateFlockV2, type V1Flock } from './migrations'

export type Experience = 'beginner' | 'some' | 'pro'

export interface Flock {
  id: number
  name: string
  /** v2: bird kind and breed profile (src/data/birds). */
  kind: BirdKind
  profileId: string
  /** v2: where the birds are kept (weather adjustment). */
  place: Place
  /** Detailed species data id (planner, metrics). Only broilers have one; '' otherwise. */
  speciesId: string
  purpose: Purpose
  /** Chick placement / hatch date (age 0), YYYY-MM-DD. For adults it is back-dated from the age the user gave. */
  placementDate: string
  initialCount: number
  houseType: HouseType
  length: number
  width: number
  height: number
  governorate: string
  experience: Experience
  status: 'active' | 'closed'
  isDemo: boolean
  createdAt: number
  closedAt?: number
}

export interface DailyLog {
  id: number
  flockId: number
  date: string
  age: number
  deaths: number
  culls: number
  feedKg: number
  waterL?: number
  sampleWeightG?: number
  sampleSize?: number
  tempC?: number
  rhPct?: number
  eggs?: number
  notes?: string
  photo?: Blob
  updatedAt: number
}

export interface TaskDone {
  id: number
  flockId: number
  taskId: string
  day: number
  doneAt: number
}

/** One row per flock per day in the egg counter. */
export interface EggLog {
  id: number
  flockId: number
  date: string
  count: number
}

/** A bird sitting on eggs (natural incubation). */
export interface Brood {
  id: number
  kind: BirdKind
  profileId: string
  /** Parent group, if any. */
  flockId?: number
  /** Day the bird started sitting (day 0). */
  startDate: string
  eggs: number
  status: 'sitting' | 'hatched' | 'failed'
  hatched?: number
  /** Group created from the hatchlings. */
  newFlockId?: number
  createdAt: number
}

export interface KV {
  key: string
  value: unknown
}

export const db = new Dexie('morabbi') as Dexie & {
  flocks: EntityTable<Flock, 'id'>
  logs: EntityTable<DailyLog, 'id'>
  tasksDone: EntityTable<TaskDone, 'id'>
  kv: EntityTable<KV, 'key'>
  eggs: EntityTable<EggLog, 'id'>
  broods: EntityTable<Brood, 'id'>
}

db.version(1).stores({
  flocks: '++id, status, speciesId, isDemo',
  logs: '++id, flockId, &[flockId+date], date',
  tasksDone: '++id, flockId, &[flockId+day+taskId]',
  kv: 'key',
})

// v2.0: bird kinds and profiles on flocks, egg counter, natural sitting tracker.
db.version(2)
  .stores({
    flocks: '++id, status, speciesId, isDemo, kind',
    eggs: '++id, flockId, &[flockId+date], date',
    broods: '++id, status, flockId',
  })
  .upgrade(async (tx) => {
    await tx
      .table('flocks')
      .toCollection()
      .modify((f: V1Flock & Partial<Flock>) => {
        Object.assign(f, migrateFlockV2(f))
      })
  })

export type NewFlock = Omit<Flock, 'id'>
export type NewLog = Omit<DailyLog, 'id'>
