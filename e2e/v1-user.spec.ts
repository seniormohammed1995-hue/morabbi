import { expect, test, type Page } from '@playwright/test'
import { mockWeather } from './fixtures'

/** Creates the database exactly as v1 left it (Dexie v1 = IndexedDB version 10). */
async function seedV1(page: Page, placementDate: string) {
  await page.goto('/favicon.svg')
  await page.evaluate(async (placement) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('morabbi', 10)
      req.onupgradeneeded = () => {
        const d = req.result
        const flocks = d.createObjectStore('flocks', { keyPath: 'id', autoIncrement: true })
        flocks.createIndex('status', 'status')
        flocks.createIndex('speciesId', 'speciesId')
        flocks.createIndex('isDemo', 'isDemo')
        const logs = d.createObjectStore('logs', { keyPath: 'id', autoIncrement: true })
        logs.createIndex('flockId', 'flockId')
        logs.createIndex('[flockId+date]', ['flockId', 'date'], { unique: true })
        logs.createIndex('date', 'date')
        const done = d.createObjectStore('tasksDone', { keyPath: 'id', autoIncrement: true })
        done.createIndex('flockId', 'flockId')
        done.createIndex('[flockId+day+taskId]', ['flockId', 'day', 'taskId'], { unique: true })
        d.createObjectStore('kv', { keyPath: 'key' })
      }
      req.onsuccess = () => {
        const d = req.result
        const tx = d.transaction(['flocks', 'logs', 'tasksDone', 'kv'], 'readwrite')
        tx.objectStore('flocks').add({
          name: 'قطيع السطح',
          speciesId: 'broiler-white',
          purpose: 'meat',
          placementDate: placement,
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
        })
        tx.objectStore('logs').add({
          flockId: 1,
          date: placement,
          age: 0,
          deaths: 2,
          culls: 0,
          feedKg: 4,
          updatedAt: 1,
        })
        tx.objectStore('tasksDone').add({ flockId: 1, day: 0, taskId: 'receive', doneAt: 1 })
        tx.objectStore('kv').put({ key: 'feed-price', value: 650 })
        tx.oncomplete = () => {
          d.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    localStorage.setItem('morabbi-disclaimer-v1', '1')
    localStorage.setItem('morabbi-theme', 'light')
  }, placementDate)
}

async function readDb(page: Page) {
  return page.evaluate(async () => {
    const d = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('morabbi')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const all = <T>(store: string) =>
      new Promise<T[]>((res) => {
        const r = d.transaction(store).objectStore(store).getAll()
        r.onsuccess = () => res(r.result as T[])
      })
    const flocks = await all<{
      kind: string
      profileId: string
      place: string
      initialCount: number
      name: string
    }>('flocks')
    const kv = await all<{ key: string; value: unknown }>('kv')
    const out = {
      version: d.version,
      flocks: flocks.map((f) => [f.name, f.kind, f.profileId, f.place, f.initialCount]),
      logs: (await all('logs')).length,
      done: (await all('tasksDone')).length,
      price: kv.find((k) => k.key === 'feed-price')?.value,
    }
    d.close()
    return out
  })
}

test('v1 user opens after the update: moved to the new system with data intact', async ({
  page,
}) => {
  await mockWeather(page)
  const d = new Date(Date.now() - 10 * 86_400_000)
  const placement = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  await seedV1(page, placement)
  await page.goto('/')

  // No onboarding; "what's new" shows once.
  const dialog = page.getByRole('dialog', { name: /الجديد في نسخة/ })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'تمام' }).click()
  await expect(dialog).toHaveCount(0)

  // Their flock is on the combined home, linked to white broilers, with the v1 day view.
  await expect(page.getByRole('heading', { name: 'النهارده عند طيورك' })).toBeVisible()
  await page.getByRole('link', { name: /قطيع السطح/ }).click()
  await expect(page.getByText('تسمين أبيض').first()).toBeVisible()
  await expect(page.getByText('٣٠٠ طائر')).toBeVisible()
  await expect(page.getByRole('button', { name: /سجّل يوم النهارده|سجلت النهارده/ })).toBeVisible()

  // The database was upgraded in place: every v1 row is still there.
  expect(await readDb(page)).toEqual({
    version: 40,
    flocks: [['قطيع السطح', 'chicken', 'chicken-broiler-white', 'roof-open', 300]],
    logs: 1,
    done: 1,
    price: 650,
  })

  // Reopening does not show "what's new" again.
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'النهارده عند طيورك' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
