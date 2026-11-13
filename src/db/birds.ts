import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Flock } from './index'
import { placeToHouse } from './migrations'
import type { BirdKind, Place, Purpose } from '../data/schema'
import { getProfile, KINDS } from '../data/birds'
import { addDays, todayISO } from '../calc/dates'
import { prefs } from '../platform'

const KV_KINDS = 'kinds'
const KEY_ONBOARDED = 'morabbi-onboarded-v2'

/** Kinds the user keeps (drives home, tools and tips). */
export function useKinds(): BirdKind[] | undefined {
  return useLiveQuery(
    async () => ((await db.kv.get(KV_KINDS))?.value as BirdKind[] | undefined) ?? [],
    [],
  )
}

export async function getKinds(): Promise<BirdKind[]> {
  return ((await db.kv.get(KV_KINDS))?.value as BirdKind[] | undefined) ?? []
}

export async function setKinds(kinds: BirdKind[]): Promise<void> {
  const ordered = KINDS.filter((k) => kinds.includes(k))
  await db.kv.put({ key: KV_KINDS, value: ordered })
}

/** Removing a kind hides it; its groups and records stay and come back when it is added again. */
export async function toggleKind(kind: BirdKind, on: boolean): Promise<void> {
  const cur = await getKinds()
  await setKinds(on ? [...new Set([...cur, kind])] : cur.filter((k) => k !== kind))
}

export const onboarding = {
  done: (): boolean => prefs.get(KEY_ONBOARDED) === '1',
  finish: (): void => prefs.set(KEY_ONBOARDED, '1'),
}

/**
 * Runs once on start. A v1 user (flocks but no kinds yet) is moved to the new system
 * silently: their kinds are taken from their flocks and onboarding is skipped.
 * Returns true when it migrated someone.
 */
export async function ensureV2Setup(): Promise<boolean> {
  if (onboarding.done()) return false
  const flocks = await db.flocks.toArray()
  if (flocks.length === 0) return false
  const existing = await getKinds()
  if (existing.length === 0) await setKinds([...new Set(flocks.map((f) => f.kind ?? 'chicken'))])
  onboarding.finish()
  return true
}

export interface NewGroup {
  profileId: string
  purpose: Purpose
  count: number
  /** Age today in days. */
  ageDays: number
  place: Place
  name?: string
  governorate?: string
}

/** Creates a simple group (any kind). Broilers keep their detailed species id so v1 screens work. */
export async function createGroup(g: NewGroup, today = todayISO()): Promise<number> {
  const p = getProfile(g.profileId)
  if (!p) throw new Error(`unknown profile ${g.profileId}`)
  const flock: Omit<Flock, 'id'> = {
    name: g.name ?? p.name.ar,
    kind: p.kind,
    profileId: p.id,
    place: g.place,
    speciesId: p.detailedId ?? '',
    purpose: g.purpose,
    placementDate: addDays(today, -Math.max(0, Math.round(g.ageDays))),
    initialCount: Math.max(1, Math.round(g.count)),
    houseType: placeToHouse(g.place),
    length: 0,
    width: 0,
    height: 0,
    governorate: g.governorate ?? '',
    experience: 'beginner',
    status: 'active',
    isDemo: false,
    createdAt: Date.now(),
  }
  return db.flocks.add(flock as Flock)
}

/** Active groups of the kinds the user keeps. */
export function useGroups(): Flock[] | undefined {
  return useLiveQuery(async () => {
    const kinds = await getKinds()
    const all = await db.flocks.where('status').equals('active').toArray()
    return all
      .filter((f) => kinds.includes(f.kind))
      .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.id - b.id)
  }, [])
}
