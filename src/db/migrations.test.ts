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

describe('Dexie v1 → v3 migration', () => {
  it('keeps every v1 row and links the flock to its bird profile', async () => {
    await seedV1()
    const { db } = await import('./index')
    await db.open()
    expect(db.verno).toBe(4)
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
    expect(await db.journal.count()).toBe(0)
  })

  it('opens a fresh database at v3', async () => {
    const { db } = await import('./index')
    await db.open()
    expect(db.verno).toBe(4)
    expect(await db.flocks.count()).toBe(0)
  })
})

/** Builds a database as v2.0 shipped it, with a group, eggs and a sitting. */
async function seedV2(): Promise<void> {
  const v2 = new Dexie('morabbi')
  v2.version(1).stores({
    flocks: '++id, status, speciesId, isDemo',
    logs: '++id, flockId, &[flockId+date], date',
    tasksDone: '++id, flockId, &[flockId+day+taskId]',
    kv: 'key',
  })
  v2.version(2).stores({
    flocks: '++id, status, speciesId, isDemo, kind',
    eggs: '++id, flockId, &[flockId+date], date',
    broods: '++id, status, flockId',
  })
  await v2.open()
  const id = await v2
    .table('flocks')
    .add({ ...V1_FLOCK, kind: 'duck', profileId: 'duck-pekin', place: 'yard' })
  await v2.table('eggs').add({ flockId: id, date: '2026-11-10', count: 4 })
  await v2.table('broods').add({ kind: 'duck', profileId: 'duck-pekin', startDate: '2026-11-01', eggs: 8, status: 'sitting', createdAt: 1 })
  await v2.table('kv').put({ key: 'kinds', value: ['duck'] })
  v2.close()
}

describe('Dexie v2 → v3 migration', () => {
  it('keeps every v2 row and adds the journal and outbox tables', async () => {
    await seedV2()
    const { db } = await import('./index')
    await db.open()
    expect(db.verno).toBe(4)
    const [f] = await db.flocks.toArray()
    expect(f).toMatchObject({ kind: 'duck', profileId: 'duck-pekin', place: 'yard' })
    expect(await db.eggs.count()).toBe(1)
    expect(await db.broods.count()).toBe(1)
    expect((await db.kv.get('kinds'))?.value).toEqual(['duck'])
    await db.journal.add({ date: '2026-11-13', at: 1, tag: 'note', text: 'تمام', flockId: f!.id } as never)
    await db.outbox.add({ sheet: 'Users_Data', row: { a: 1 }, createdAt: 1, tries: 0, nextAt: 0 } as never)
    expect(await db.journal.where('flockId').equals(f!.id).count()).toBe(1)
    expect(await db.outbox.where('nextAt').belowOrEqual(5).count()).toBe(1)
  })
})

async function seedV3(): Promise<void> {
  await seedV2()
  const v3 = new Dexie('morabbi')
  v3.version(1).stores({
    flocks: '++id, status, speciesId, isDemo',
    logs: '++id, flockId, &[flockId+date], date',
    tasksDone: '++id, flockId, &[flockId+day+taskId]',
    kv: 'key',
  })
  v3.version(2).stores({
    flocks: '++id, status, speciesId, isDemo, kind',
    eggs: '++id, flockId, &[flockId+date], date',
    broods: '++id, status, flockId',
  })
  v3.version(3).stores({ journal: '++id, date, at, flockId', outbox: '++id, nextAt' })
  await v3.open()
  await v3.table('journal').add({ date: '2026-11-13', at: 1, tag: 'eggs', text: '١٢ بيضة' })
  await v3.table('outbox').add({ sheet: 'Users_Data', row: { a: 1 }, createdAt: 1, tries: 0, nextAt: 0 })
  await v3.table('kv').put({ key: 'reminders', value: { water: { on: true, everyHours: 4, from: '06:00', to: '22:00' } } })
  v3.close()
}

describe('Dexie v3 → v4 migration', () => {
  it('keeps every v3 row and adds the treatments table', async () => {
    await seedV3()
    const { db } = await import('./index')
    await db.open()
    expect(db.verno).toBe(4)
    const [f] = await db.flocks.toArray()
    expect(f).toMatchObject({ kind: 'duck', profileId: 'duck-pekin' })
    expect(await db.journal.count()).toBe(1)
    expect(await db.outbox.count()).toBe(1)
    expect(await db.eggs.count()).toBe(1)
    await db.treatments.add({ flockId: f!.id, name: 'مضاد حيوي', lastDose: '2026-11-10', eggDays: 7, createdAt: 1 } as never)
    expect(await db.treatments.where('flockId').equals(f!.id).count()).toBe(1)
  })

  it('fills in the new reminder types for settings saved by v3.0', async () => {
    await seedV3()
    const { db } = await import('./index')
    await db.open()
    const { getReminderSettings } = await import('../reminders')
    const s = await getReminderSettings()
    expect(s.water.everyHours).toBe(4)
    expect(s.temp.on).toBe(true)
    expect(s.eggs.times.length).toBeGreaterThan(0)
    expect(s.digest.on).toBe(true)
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
