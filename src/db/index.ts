import Dexie, { type EntityTable } from 'dexie'
import type { HouseType, Purpose } from '../data/schema'

export type Experience = 'beginner' | 'some' | 'pro'

export interface Flock {
  id: number
  name: string
  speciesId: string
  purpose: Purpose
  /** Chick placement date (age 0), YYYY-MM-DD. */
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

export interface KV {
  key: string
  value: unknown
}

export const db = new Dexie('morabbi') as Dexie & {
  flocks: EntityTable<Flock, 'id'>
  logs: EntityTable<DailyLog, 'id'>
  tasksDone: EntityTable<TaskDone, 'id'>
  kv: EntityTable<KV, 'key'>
}

db.version(1).stores({
  flocks: '++id, status, speciesId, isDemo',
  logs: '++id, flockId, &[flockId+date], date',
  tasksDone: '++id, flockId, &[flockId+day+taskId]',
  kv: 'key',
})

export type NewFlock = Omit<Flock, 'id'>
export type NewLog = Omit<DailyLog, 'id'>
