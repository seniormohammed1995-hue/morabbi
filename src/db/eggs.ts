import { useLiveQuery } from 'dexie-react-hooks'
import { db, type EggLog } from './index'

export function useEggs(flockId: number | undefined): EggLog[] | undefined {
  return useLiveQuery(
    async () => (flockId ? db.eggs.where('flockId').equals(flockId).toArray() : []),
    [flockId],
  )
}

/**
 * Adds `delta` to a group's egg count on a date (never below 0; 0 removes the row).
 * Runs in one transaction so quick repeated taps can't collide.
 */
export async function addEggs(flockId: number, date: string, delta: number): Promise<number> {
  return db.transaction('rw', db.eggs, async () => {
    const existing = await db.eggs.where('[flockId+date]').equals([flockId, date]).first()
    const n = Math.max(0, Math.round((existing?.count ?? 0) + delta))
    if (existing) {
      if (n === 0) await db.eggs.delete(existing.id)
      else await db.eggs.update(existing.id, { count: n })
    } else if (n > 0) {
      await db.eggs.add({ flockId, date, count: n } as EggLog)
    }
    return n
  })
}
