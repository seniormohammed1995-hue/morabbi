import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Brood } from './index'
import { createGroup, toggleKind } from './birds'
import { getProfile } from '../data/birds'
import type { Place } from '../data/schema'
import { broodState } from '../calc/brood'
import { todayISO } from '../calc/dates'
import { notifications } from '../platform'
import { t, lt } from '../i18n'

export function useBroods(): Brood[] | undefined {
  return useLiveQuery(() => db.broods.orderBy('id').reverse().toArray(), [])
}

export async function addBrood(b: Omit<Brood, 'id' | 'status' | 'createdAt'>): Promise<number> {
  return db.broods.add({ ...b, status: 'sitting', createdAt: Date.now() } as Brood)
}

export async function failBrood(id: number): Promise<void> {
  await db.broods.update(id, { status: 'failed' })
}

/** Marks a sitting as hatched and turns the hatchlings into a new group of age 0. Returns the new group id. */
export async function hatchToGroup(
  id: number,
  hatched: number,
  place: Place,
  today = todayISO(),
): Promise<number> {
  const b = await db.broods.get(id)
  if (!b) throw new Error('brood not found')
  const p = getProfile(b.profileId)
  if (!p) throw new Error('profile not found')
  const groupId = await createGroup(
    {
      profileId: p.id,
      purpose: p.purposes[0]!,
      count: hatched,
      ageDays: 0,
      place,
      name: t('brood.newGroupName', { name: lt(p.name) }),
    },
    today,
  )
  await db.broods.update(id, { status: 'hatched', hatched, newFlockId: groupId })
  await toggleKind(p.kind, true)
  return groupId
}

/** One notification per day listing natural-sitting checks due today. */
export async function runBroodReminders(): Promise<void> {
  if (notifications.state() !== 'granted') return
  const today = todayISO()
  const key = 'brood-reminder'
  if ((await db.kv.get(key))?.value === today) return
  const lines: string[] = []
  for (const b of await db.broods.where('status').equals('sitting').toArray()) {
    const p = getProfile(b.profileId)
    if (!p) continue
    const s = broodState(b.startDate, today, p.breeding.incubationDays.value, p.breeding.checks)
    for (const c of s.today) lines.push(`${lt(p.name)}: ${lt(c.title)}`)
  }
  if (lines.length === 0) return
  if (await notifications.show(t('brood.notify'), lines.join('\n'), `brood-${today}`))
    await db.kv.put({ key, value: today })
}
