import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { addEggs } from './eggs'

describe('addEggs', () => {
  it('handles quick repeated taps without losing counts', async () => {
    await Promise.all([
      addEggs(1, '2026-11-13', 1),
      addEggs(1, '2026-11-13', 1),
      addEggs(1, '2026-11-13', 1),
    ])
    expect((await db.eggs.toArray()).map((e) => e.count)).toEqual([3])
    await addEggs(1, '2026-11-13', -5)
    expect(await db.eggs.count()).toBe(0)
  })
})
