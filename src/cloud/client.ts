import { useLiveQuery } from 'dexie-react-hooks'
import { CONFIG, APP_VERSION } from '../config'
import { db } from '../db'
import { getKinds } from '../db/birds'
import { GOVERNORATES, RULES } from '../data/rules'
import { todayISO } from '../calc/dates'
import { cloud, device, platformName, share } from '../platform'
import { t } from '../i18n'
import { feedbackUrl } from '../feedback'
import {
  feedbackRow,
  feedbackWhatsappText,
  newsRow,
  userRow,
  type CloudRequest,
  type Envelope,
  type FeedbackType,
  type UserProfile,
} from './payload'

const KV_PROFILE = 'profile'
const KV_CLIENT = 'client-id'
const KV_PING = 'last-user-ping'
const KV_NEWS_SYNC = 'cloud-news'

export const cloudEnabled = (): boolean => CONFIG.sheetsEndpoint.trim().length > 0

// ---------- identity ----------

export async function clientId(): Promise<string> {
  const cur = (await db.kv.get(KV_CLIENT))?.value
  if (typeof cur === 'string' && cur) return cur
  const id = device.randomId()
  await db.kv.put({ key: KV_CLIENT, value: id })
  return id
}

async function envelope(): Promise<Envelope> {
  return { clientId: await clientId(), appVersion: APP_VERSION, platform: platformName() }
}

export async function getProfile(): Promise<UserProfile | undefined> {
  return (await db.kv.get(KV_PROFILE))?.value as UserProfile | undefined
}

export function useProfile(): UserProfile | null | undefined {
  return useLiveQuery(async () => (await getProfile()) ?? null, [])
}

const govName = (id: string) => GOVERNORATES.find((g) => g.id === id)?.name ?? id

/** Saves the sign-up on the phone and queues it for the sheet. */
export async function saveProfile(p: {
  name: string
  phone: string
  governorate: string
  kinds: UserProfile['kinds']
}): Promise<void> {
  const old = await getProfile()
  const profile: UserProfile = {
    clientId: await clientId(),
    name: p.name,
    phone: p.phone,
    governorate: p.governorate,
    kinds: p.kinds,
    createdAt: old?.createdAt ?? Date.now(),
  }
  await db.kv.put({ key: KV_PROFILE, value: profile })
  if (cloudEnabled()) {
    await enqueue(userRow({ ...profile, governorate: govName(profile.governorate) }, await envelope(), Date.now()))
    await db.kv.put({ key: KV_PING, value: todayISO() })
    void flushOutbox()
  }
}

/** Once a day: refresh "last seen" for a signed-up user (one row per user in the sheet). */
export async function pingUser(): Promise<void> {
  if (!cloudEnabled()) return
  const p = await getProfile()
  if (!p) return
  const today = todayISO()
  if ((await db.kv.get(KV_PING))?.value === today) return
  const kinds = await getKinds()
  await enqueue(
    userRow({ ...p, kinds: kinds.length ? kinds : p.kinds, governorate: govName(p.governorate) }, await envelope(), Date.now()),
  )
  await db.kv.put({ key: KV_PING, value: today })
}

// ---------- outbox ----------

export async function enqueue(req: CloudRequest): Promise<void> {
  const now = Date.now()
  await db.outbox.add({ sheet: req.sheet, row: req.row, createdAt: now, tries: 0, nextAt: now } as never)
}

export function usePendingCount(): number | undefined {
  return useLiveQuery(() => db.outbox.count(), [])
}

let flushing: Promise<number> | null = null

/** Sends every due row. Returns how many were sent. Safe to call often. */
export function flushOutbox(): Promise<number> {
  if (!cloudEnabled() || !device.online()) return Promise.resolve(0)
  flushing ??= (async () => {
    let sent = 0
    try {
      const due = await db.outbox.where('nextAt').belowOrEqual(Date.now()).toArray()
      for (const item of due) {
        const res = await cloud.post(CONFIG.sheetsEndpoint, { sheet: item.sheet, row: item.row })
        if (res.ok) {
          await db.outbox.delete(item.id)
          sent++
        } else if (item.tries + 1 >= RULES.outboxMaxTries) {
          await db.outbox.delete(item.id)
        } else {
          await db.outbox.update(item.id, {
            tries: item.tries + 1,
            nextAt: Date.now() + RULES.outboxRetryMinutes * 60_000,
            ...(res.error ? { lastError: res.error } : {}),
          })
          // Offline or the script is down: stop and keep the order for next time.
          break
        }
      }
    } finally {
      flushing = null
    }
    return sent
  })()
  return flushing
}

// ---------- feedback ----------

export type SendResult = 'sent' | 'queued' | 'whatsapp'

/** Sends a message from the "صوتك يهمنا" box: to the sheet when set up, otherwise through WhatsApp. */
export async function sendFeedback(input: {
  type: FeedbackType
  message: string
  phone: string
  screen: string
}): Promise<SendResult> {
  const p = await getProfile()
  const kinds = (await getKinds()).map((k) => t(`kind.${k}`)).join('، ')
  if (!cloudEnabled()) {
    const footer = t('contact.waFooter', {
      v: APP_VERSION,
      name: p?.name ?? '—',
      gov: p ? govName(p.governorate) : '—',
      birds: kinds || '—',
    })
    share.openExternal(feedbackUrl(feedbackWhatsappText(t(`contact.type.${input.type}`), input.message, footer)))
    return 'whatsapp'
  }
  await enqueue(
    feedbackRow(
      input,
      { name: p?.name ?? '', governorate: p ? govName(p.governorate) : '', kinds },
      await envelope(),
      Date.now(),
    ),
  )
  const before = await db.outbox.count()
  await flushOutbox()
  return (await db.outbox.count()) < before ? 'sent' : 'queued'
}

// ---------- flock news sync (opt-in) ----------

export function useNewsSync(): boolean | undefined {
  return useLiveQuery(async () => (await db.kv.get(KV_NEWS_SYNC))?.value === true, [])
}

export async function setNewsSync(on: boolean): Promise<void> {
  await db.kv.put({ key: KV_NEWS_SYNC, value: on })
}

/** Queues a journal entry for the sheet when the user turned "send my flock news" on. */
export async function queueNews(entry: {
  id: number
  date: string
  tag: string
  text: string
  group: string
}): Promise<boolean> {
  if (!cloudEnabled() || (await db.kv.get(KV_NEWS_SYNC))?.value !== true) return false
  const p = await getProfile()
  await enqueue(
    newsRow(entry, { name: p?.name ?? '', governorate: p ? govName(p.governorate) : '' }, await envelope(), Date.now()),
  )
  await db.journal.update(entry.id, { queuedAt: Date.now() })
  void flushOutbox()
  return true
}
