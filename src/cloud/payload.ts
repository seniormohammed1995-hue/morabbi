import { z } from 'zod'
import type { BirdKind } from '../data/schema'

/**
 * What the app sends to the Google Sheet (cloud/apps-script/Code.gs). Pure: no network here.
 * Sheet and column names must match the script.
 */
export const SHEETS = {
  users: 'Users_Data',
  feedback: 'Feedback_and_Reports',
  news: 'Flock_News',
  clicks: 'Affiliate_Clicks',
  /** Not a tab: asks the script to delete every row of one install (see Code.gs). */
  delete: 'Delete',
} as const
export type SheetName = (typeof SHEETS)[keyof typeof SHEETS]

export const FEEDBACK_TYPES = ['recommendation', 'case', 'suggestion', 'complaint'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export interface UserProfile {
  /** Random id made on this phone; lets the sheet update one row per user. */
  clientId: string
  name: string
  phone: string
  governorate: string
  kinds: BirdKind[]
  createdAt: number
  /** Set when the user signed in with Google (display only; the sheet trusts the token, not these). */
  email?: string
  picture?: string
}

/** What the app reads from a Google ID token for display. */
export interface GoogleIdentity {
  sub: string
  email: string
  name: string
  picture: string
  /** Seconds since epoch. */
  exp: number
}

function base64UrlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Reads the profile fields of a Google ID token (a JWT) without checking its signature —
 * only for showing the name/photo. The Apps Script checks the token with Google before it
 * stores the email (see Code.gs → verifyGoogle).
 */
export function readGoogleIdToken(token: string): GoogleIdentity | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const c = JSON.parse(base64UrlDecode(part)) as Record<string, unknown>
    if (typeof c.sub !== 'string' || typeof c.email !== 'string') return null
    return {
      sub: c.sub,
      email: c.email,
      name: typeof c.name === 'string' ? c.name : '',
      picture: typeof c.picture === 'string' ? c.picture : '',
      exp: typeof c.exp === 'number' ? c.exp : 0,
    }
  } catch {
    return null
  }
}

/** Google names can be long or one word; fit them to the sign-up form (2–40 letters). */
export const fitName = (name: string): string => name.trim().replace(/\s+/g, ' ').slice(0, 40)

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Arabic/Persian digits → Latin, spaces and dashes removed, +20 / 0020 → 0. */
export function normalizePhone(s: string): string {
  const latin = [...s]
    .map((c) => {
      const a = ARABIC_DIGITS.indexOf(c)
      if (a >= 0) return String(a)
      const p = PERSIAN_DIGITS.indexOf(c)
      return p >= 0 ? String(p) : c
    })
    .join('')
    .replace(/[\s\-()]/g, '')
  if (latin.startsWith('+20')) return '0' + latin.slice(3)
  if (latin.startsWith('0020')) return '0' + latin.slice(4)
  if (/^201\d{9}$/.test(latin)) return '0' + latin.slice(2)
  return latin
}

/** Egyptian mobile: 010 / 011 / 012 / 015 + 8 digits. */
export const isEgyptMobile = (s: string): boolean => /^01[0125]\d{8}$/.test(s)

export const ProfileForm = z.object({
  name: z.string().trim().min(2).max(40),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((p) => p === '' || isEgyptMobile(p)),
  governorate: z.string().min(1),
  kinds: z.array(z.string()).min(1),
})
export type ProfileFormIn = z.input<typeof ProfileForm>

/** Common fields on every row: who, when, which app version and platform. */
export interface Envelope {
  clientId: string
  appVersion: string
  platform: 'web' | 'android'
}

export interface CloudRequest {
  sheet: SheetName
  row: Record<string, string | number>
}

const iso = (ms: number) => new Date(ms).toISOString()

/**
 * `idToken` goes only with the sign-up right after "ادخل بـ Gmail"; the sheet keeps the email
 * it verified then, and later rows (daily "last seen") don't carry it.
 */
export function userRow(p: UserProfile, env: Envelope, now: number, idToken?: string): CloudRequest {
  return {
    sheet: SHEETS.users,
    row: {
      ...(idToken ? { id_token: idToken } : {}),
      client_id: p.clientId,
      name: p.name,
      phone: p.phone,
      governorate: p.governorate,
      bird_kinds: p.kinds.join(', '),
      first_seen: iso(p.createdAt),
      last_seen: iso(now),
      app_version: env.appVersion,
      platform: env.platform,
    },
  }
}

export function feedbackRow(
  input: { type: FeedbackType; message: string; phone: string; screen: string },
  who: { name: string; governorate: string; kinds: string },
  env: Envelope,
  now: number,
): CloudRequest {
  return {
    sheet: SHEETS.feedback,
    row: {
      sent_at: iso(now),
      client_id: env.clientId,
      name: who.name,
      phone: normalizePhone(input.phone),
      governorate: who.governorate,
      bird_kinds: who.kinds,
      type: input.type,
      message: input.message.trim(),
      screen: input.screen,
      app_version: env.appVersion,
      platform: env.platform,
      status: 'new',
    },
  }
}

export function newsRow(
  entry: { date: string; tag: string; text: string; group: string },
  who: { name: string; governorate: string },
  env: Envelope,
  now: number,
): CloudRequest {
  return {
    sheet: SHEETS.news,
    row: {
      sent_at: iso(now),
      client_id: env.clientId,
      name: who.name,
      governorate: who.governorate,
      date: entry.date,
      tag: entry.tag,
      group: entry.group,
      note: entry.text.trim(),
      app_version: env.appVersion,
    },
  }
}

export function clickRow(
  click: { productId: string; product: string; category: string; channel: 'online' | 'whatsapp' },
  env: Envelope,
  now: number,
): CloudRequest {
  return {
    sheet: SHEETS.clicks,
    row: {
      clicked_at: iso(now),
      client_id: env.clientId,
      product_id: click.productId,
      product: click.product,
      category: click.category,
      channel: click.channel,
      app_version: env.appVersion,
      platform: env.platform,
    },
  }
}

/** Plain-text WhatsApp fallback for a feedback message when no sheet is set up. */
export function feedbackWhatsappText(typeLabel: string, message: string, footer: string): string {
  return `【${typeLabel}】\n${message.trim()}\n\n${footer}`
}

/** Asks the sheet to remove everything sent from this install. */
export function deleteRequest(clientId: string, now: number): CloudRequest {
  return {
    sheet: SHEETS.delete,
    row: { client_id: clientId, requested_at: new Date(now).toISOString() },
  }
}
