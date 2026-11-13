import { z } from 'zod'
import { db, type DailyLog, type Flock, type NewFlock, type NewLog } from './index'
import { getSpecies } from '../data'
import { addDays, ageOn, todayISO } from '../calc/dates'
import { dailyFeedG } from '../calc/feed'
import { valueAt } from '../calc/interp'
import { RULES } from '../data/rules'

// ---------- Flocks ----------

export async function createFlock(f: NewFlock): Promise<number> {
  return db.flocks.add(f as Flock)
}

export async function updateFlock(id: number, patch: Partial<Flock>): Promise<void> {
  await db.flocks.update(id, patch)
}

export async function deleteFlock(id: number): Promise<void> {
  await db.transaction('rw', db.flocks, db.logs, db.tasksDone, async () => {
    await db.logs.where('flockId').equals(id).delete()
    await db.tasksDone.where('flockId').equals(id).delete()
    await db.flocks.delete(id)
  })
}

// ---------- Logs ----------

/** Inserts or replaces the log for a flock+date. */
export async function saveLog(log: NewLog): Promise<number> {
  const existing = await db.logs.where('[flockId+date]').equals([log.flockId, log.date]).first()
  if (existing) {
    await db.logs.put({ ...log, id: existing.id } as DailyLog)
    return existing.id
  }
  return db.logs.add(log as DailyLog)
}

export async function deleteLog(id: number): Promise<void> {
  await db.logs.delete(id)
}

// ---------- Tasks ----------

export async function toggleTask(flockId: number, day: number, taskId: string): Promise<void> {
  const existing = await db.tasksDone.where('[flockId+day+taskId]').equals([flockId, day, taskId]).first()
  if (existing) await db.tasksDone.delete(existing.id)
  else await db.tasksDone.add({ flockId, day, taskId, doneAt: Date.now() } as never)
}

// ---------- Demo flock ----------

/** Deterministic pseudo-random generator so the demo looks the same every time. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export const DEMO_AGE = 20

/** Creates a demo broiler flock placed 20 days ago with 20 days of realistic logs. */
export async function createDemoFlock(today = todayISO()): Promise<number> {
  const entry = getSpecies('broiler-white')!
  const sp = entry.data
  const placement = addDays(today, -DEMO_AGE)
  const count = 500
  const id = await createFlock({
    name: 'قطيع تجريبي — سطح ٥٠٠ فرخة',
    speciesId: sp.id,
    purpose: 'meat',
    placementDate: placement,
    initialCount: count,
    houseType: 'roof',
    length: 10,
    width: 6,
    height: 2.5,
    governorate: 'qalyubia',
    experience: 'beginner',
    status: 'active',
    isDemo: true,
    createdAt: Date.now(),
  })
  const rand = rng(42)
  let alive = count
  const logs: NewLog[] = []
  for (let age = 0; age < DEMO_AGE; age++) {
    const deaths = age < 4 ? Math.round(rand() * 3) : Math.round(rand() * 1.4)
    const feedKg = Math.round(((dailyFeedG(sp, age) * alive) / 1000) * (0.94 + rand() * 0.1) * 10) / 10
    const weigh = age === 7 || age === 14 || age === 19
    const log: NewLog = {
      flockId: id,
      date: addDays(placement, age),
      age,
      deaths,
      culls: 0,
      feedKg,
      waterL: Math.round(feedKg * sp.growth.waterToFeedRatio.value),
      tempC: Math.round(valueAt(sp.environment.temperature, age).value + (rand() - 0.5) * 2),
      updatedAt: Date.now(),
    }
    if (weigh) {
      log.sampleWeightG = Math.round(valueAt(sp.growth.bodyWeight, age).value * (0.93 + rand() * 0.06))
      log.sampleSize = RULES.weighSampleMin
    }
    if (age === 12) log.notes = 'الفرشة مبلولة شوية حوالين السقايات — اتغيرت.'
    logs.push(log)
    alive -= deaths
  }
  await db.logs.bulkAdd(logs as DailyLog[])
  // Past vaccinations in the demo were given on schedule.
  await db.tasksDone.bulkAdd(
    sp.health.vaccinations
      .filter((v) => v.day < DEMO_AGE)
      .map((v) => ({ flockId: id, day: v.day, taskId: `vac:${v.id}`, doneAt: Date.now() }) as never),
  )
  return id
}

// ---------- Backup ----------

const BACKUP_VERSION = 1

const BackupSchema = z.object({
  app: z.literal('morabbi'),
  version: z.number().int(),
  exportedAt: z.string(),
  flocks: z.array(z.record(z.string(), z.unknown())),
  logs: z.array(z.record(z.string(), z.unknown())),
  tasksDone: z.array(z.record(z.string(), z.unknown())),
})

async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })
}

async function dataUrlToBlob(u: string): Promise<Blob> {
  return (await fetch(u)).blob()
}

export async function exportBackup(): Promise<Blob> {
  const [flocks, logs, tasksDone] = await Promise.all([db.flocks.toArray(), db.logs.toArray(), db.tasksDone.toArray()])
  const logsOut = await Promise.all(
    logs.map(async (l) => (l.photo ? { ...l, photo: await blobToDataUrl(l.photo) } : l)),
  )
  const payload = {
    app: 'morabbi',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    flocks,
    logs: logsOut,
    tasksDone,
  }
  return new Blob([JSON.stringify(payload)], { type: 'application/json' })
}

/** Replaces all data with a backup. Throws if the file is not a valid backup. */
export async function importBackup(text: string): Promise<number> {
  const parsed = BackupSchema.parse(JSON.parse(text))
  const logs = await Promise.all(
    parsed.logs.map(async (l) =>
      typeof l.photo === 'string' ? { ...l, photo: await dataUrlToBlob(l.photo) } : l,
    ),
  )
  await db.transaction('rw', db.flocks, db.logs, db.tasksDone, async () => {
    await Promise.all([db.flocks.clear(), db.logs.clear(), db.tasksDone.clear()])
    await db.flocks.bulkAdd(parsed.flocks as unknown as Flock[])
    await db.logs.bulkAdd(logs as unknown as DailyLog[])
    await db.tasksDone.bulkAdd(parsed.tasksDone as never[])
  })
  return parsed.flocks.length
}

export async function resetAll(): Promise<void> {
  await Promise.all([db.flocks.clear(), db.logs.clear(), db.tasksDone.clear(), db.kv.clear()])
}

// ---------- CSV ----------

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV (UTF-8 with BOM so Excel shows Arabic correctly). */
export function logsToCsv(flock: Flock, logs: DailyLog[]): Blob {
  const header = ['التاريخ', 'العمر', 'النافق', 'المستبعد', 'العلف كجم', 'المية لتر', 'وزن العينة جم', 'حجم العينة', 'الحرارة', 'الرطوبة', 'ملاحظات']
  const rows = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => [l.date, ageOn(flock.placementDate, l.date), l.deaths, l.culls, l.feedKg, l.waterL, l.sampleWeightG, l.sampleSize, l.tempC, l.rhPct, l.notes])
  const body = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  return new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })
}
