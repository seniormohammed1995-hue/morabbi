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

/** v3: one "flock news" entry (أخبار قطيعي) written by the user. */
export type JournalTag = 'note' | 'eggs' | 'health' | 'emergency'
export interface JournalEntry {
  id: number
  date: string
  /** Time written (ms). */
  at: number
  tag: JournalTag
  text: string
  /** Group the note is about, if any. */
  flockId?: number
  /** Set when the entry was queued for the cloud (only if the user turned cloud sync on). */
  queuedAt?: number
}

/** v3: a row waiting to be sent to the Google Sheet (survives offline and app restarts). */
export interface OutboxItem {
  id: number
  sheet: string
  row: Record<string, string | number>
  createdAt: number
  tries: number
  /** Do not retry before this time (ms). */
  nextAt: number
  lastError?: string
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
  journal: EntityTable<JournalEntry, 'id'>
  outbox: EntityTable<OutboxItem, 'id'>
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

// v3.0: flock news journal and the cloud outbox. New tables only; existing rows are untouched.
db.version(3).stores({
  journal: '++id, date, at, flockId',
  outbox: '++id, nextAt',
})

export type NewFlock = Omit<Flock, 'id'>
export type NewLog = Omit<DailyLog, 'id'>
