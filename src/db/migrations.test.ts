import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateFlockV2 } from './migrations'

const V1_FLOCK = {
  name: 'قطيع السطح',
  speciesId: 'broiler-white',
  purpose: 'meat',
  placementDate: '2026-10-20',
  initialCount: 300,
  houseType: 'roof',
  length: 8,
  width: 5,
  height: 2.5,
  governorate: 'giza',
  experience: 'beginner',
  status: 'active',
  isDemo: false,
  createdAt: 1,
}

/** Builds a database exactly as v1 shipped it, with one flock, logs and a done task. */
async function seedV1(): Promise<void> {
  const v1 = new Dexie('morabbi')
  v1.version(1).stores({
    flocks: '++id, status, speciesId, isDemo',
    logs: '++id, flockId, &[flockId+date], date',
    tasksDone: '++id, flockId, &[flockId+day+taskId]',
    kv: 'key',
  })
  await v1.open()
  const id = await v1.table('flocks').add(V1_FLOCK)
  await v1.table('logs').bulkAdd([
    { flockId: id, date: '2026-10-20', age: 0, deaths: 2, culls: 0, feedKg: 4, updatedAt: 1 },
    {
      flockId: id,
      date: '2026-10-21',
      age: 1,
      deaths: 1,
      culls: 0,
      feedKg: 5,
      sampleWeightG: 60,
      updatedAt: 1,
    },
  ])
  await v1.table('tasksDone').add({ flockId: id, day: 0, taskId: 'receive', doneAt: 1 })
  await v1.table('kv').put({ key: 'price', value: 600 })
  v1.close()
}

afterEach(async () => {
  const { db } = await import('./index')
  db.close()
  await Dexie.delete('morabbi')
})

describe('Dexie v1 → v2 migration', () => {
  it('keeps every v1 row and links the flock to its bird profile', async () => {
    await seedV1()
    const { db } = await import('./index')
    await db.open()
    expect(db.verno).toBe(2)
    const flocks = await db.flocks.toArray()
    expect(flocks).toHaveLength(1)
    const f = flocks[0]!
    expect(f).toMatchObject({
      ...V1_FLOCK,
      kind: 'chicken',
      profileId: 'chicken-broiler-white',
      place: 'roof-open',
    })
    expect(await db.logs.where('flockId').equals(f.id).count()).toBe(2)
    expect((await db.logs.toArray()).map((l) => l.deaths)).toEqual([2, 1])
    expect(await db.tasksDone.count()).toBe(1)
    expect((await db.kv.get('price'))?.value).toBe(600)
    // New tables exist and work.
    await db.eggs.add({ flockId: f.id, date: '2026-11-01', count: 3 } as never)
    expect(await db.eggs.count()).toBe(1)
    expect(await db.broods.count()).toBe(0)
  })

  it('opens a fresh database at v2', async () => {
    const { db } = await import('./index')
    await db.open()
    expect(db.verno).toBe(2)
    expect(await db.flocks.count()).toBe(0)
  })
})

describe('migrateFlockV2', () => {
  it('maps house types to places and keeps existing v2 fields', () => {
    expect(migrateFlockV2({ speciesId: 'broiler-white', houseType: 'room' }).place).toBe('room')
    expect(migrateFlockV2({ speciesId: 'broiler-white', houseType: 'open' }).place).toBe('yard')
    expect(
      migrateFlockV2({
        speciesId: 'x',
        houseType: 'roof',
        kind: 'duck',
        profileId: 'duck-pekin',
        place: 'yard',
      }),
    ).toEqual({
      kind: 'duck',
      profileId: 'duck-pekin',
      place: 'yard',
    })
  })
})
