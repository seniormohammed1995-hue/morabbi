import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../config', () => ({
  CONFIG: { sheetsEndpoint: 'https://script.example/exec', feedbackWhatsapp: '' },
  APP_VERSION: '3.0.0',
}))

const post = vi.fn()
vi.mock('../platform', async (orig) => {
  const real = await orig<typeof import('../platform')>()
  return {
    ...real,
    cloud: { post: (...a: unknown[]) => post(...a) },
    device: { ...real.device, online: () => true, randomId: () => 'test-id' },
    platformName: () => 'web',
  }
})

const { db } = await import('../db')
const { enqueue, flushOutbox, requestDeletion, saveProfile, sendFeedback } =
  await import('./client')

beforeEach(async () => {
  post.mockReset()
  await db.open()
  await Promise.all([db.outbox.clear(), db.kv.clear()])
})
afterEach(() => vi.useRealTimers())

describe('outbox', () => {
  it('sends due rows in order and removes them', async () => {
    post.mockResolvedValue({ ok: true })
    await enqueue({ sheet: 'Users_Data', row: { a: 1 } })
    await enqueue({ sheet: 'Feedback_and_Reports', row: { b: 2 } })
    expect(await flushOutbox()).toBe(2)
    expect(post.mock.calls.map((c) => (c[1] as { sheet: string }).sheet)).toEqual([
      'Users_Data',
      'Feedback_and_Reports',
    ])
    expect(await db.outbox.count()).toBe(0)
  })

  it('keeps a failed row, delays the retry and stops there', async () => {
    post.mockResolvedValue({ ok: false, error: 'network' })
    await enqueue({ sheet: 'Users_Data', row: { a: 1 } })
    await enqueue({ sheet: 'Users_Data', row: { a: 2 } })
    expect(await flushOutbox()).toBe(0)
    expect(post).toHaveBeenCalledTimes(1)
    const [first] = await db.outbox.orderBy('id').toArray()
    expect(first!.tries).toBe(1)
    expect(first!.nextAt).toBeGreaterThan(Date.now())
    expect(first!.lastError).toBe('network')
  })
})

describe('profile and feedback', () => {
  it('queues a Users_Data row keyed by the install id on sign-up', async () => {
    post.mockResolvedValue({ ok: false })
    await saveProfile({ name: 'أحمد', phone: '', governorate: 'giza', kinds: ['chicken'] })
    const [row] = await db.outbox.toArray()
    expect(row!.sheet).toBe('Users_Data')
    expect(row!.row).toMatchObject({ client_id: 'test-id', name: 'أحمد', governorate: 'الجيزة' })
  })

  it('reports "sent" when the sheet accepts the message and "queued" when offline', async () => {
    post.mockResolvedValueOnce({ ok: true })
    expect(
      await sendFeedback({ type: 'case', message: 'الفراخ بتكح', phone: '', screen: 'x' }),
    ).toBe('sent')
    post.mockResolvedValueOnce({ ok: false, error: 'network' })
    expect(await sendFeedback({ type: 'case', message: 'تاني', phone: '', screen: 'x' })).toBe(
      'queued',
    )
    expect(await db.outbox.count()).toBe(1)
  })
})

describe('delete my data', () => {
  it('drops pending rows, forgets the profile and asks the sheet to delete this install', async () => {
    post.mockResolvedValueOnce({ ok: false, error: 'network' })
    await saveProfile({ name: 'أحمد', phone: '', governorate: 'giza', kinds: ['chicken'] })
    expect(await db.outbox.count()).toBe(1)
    post.mockResolvedValueOnce({ ok: true })
    expect(await requestDeletion()).toBe('sent')
    const last = post.mock.calls.at(-1)![1] as { sheet: string; row: { client_id: string } }
    expect(last.sheet).toBe('Delete')
    expect(last.row.client_id).toBe('test-id')
    expect(await db.outbox.count()).toBe(0)
    expect(await db.kv.get('profile')).toBeUndefined()
    expect(await db.kv.get('client-id')).toBeUndefined()
  })

  it('keeps the request for later when offline', async () => {
    post.mockResolvedValue({ ok: false, error: 'network' })
    expect(await requestDeletion()).toBe('queued')
    const [row] = await db.outbox.toArray()
    expect(row!.sheet).toBe('Delete')
  })
})
