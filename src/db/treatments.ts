import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Treatment } from './index'

/** Medicine courses, newest last dose first. */
export function useTreatments(): Treatment[] | undefined {
  return useLiveQuery(async () => (await db.treatments.orderBy('lastDose').toArray()).reverse(), [])
}

export async function addTreatment(tr: Omit<Treatment, 'id' | 'createdAt'>): Promise<number> {
  return db.treatments.add({ ...tr, createdAt: Date.now() } as Treatment)
}

export async function deleteTreatment(id: number): Promise<void> {
  await db.treatments.delete(id)
}
