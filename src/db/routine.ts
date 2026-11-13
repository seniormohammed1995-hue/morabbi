import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './index'

const key = (date: string) => `routine:${date}`

/** Routine item ids ticked on a date. */
export function useRoutineDone(date: string): Set<string> | undefined {
  return useLiveQuery(
    async () => new Set(((await db.kv.get(key(date)))?.value as string[] | undefined) ?? []),
    [date],
  )
}

export async function toggleRoutine(date: string, id: string): Promise<void> {
  await db.transaction('rw', db.kv, async () => {
    const cur = new Set(((await db.kv.get(key(date)))?.value as string[] | undefined) ?? [])
    if (cur.has(id)) cur.delete(id)
    else cur.add(id)
    await db.kv.put({ key: key(date), value: [...cur] })
  })
}
