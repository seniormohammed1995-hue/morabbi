import { describe, expect, it } from 'vitest'
import {
  clickRow,
  feedbackRow,
  fitName,
  readGoogleIdToken,
  isEgyptMobile,
  newsRow,
  normalizePhone,
  ProfileForm,
  SHEETS,
  userRow,
} from './payload'

const env = { clientId: 'c-1', appVersion: '3.0.0', platform: 'web' as const }

describe('normalizePhone', () => {
  it('turns Arabic digits and country codes into a local number', () => {
    expect(normalizePhone('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678')
    expect(normalizePhone('+20 101 234 5678')).toBe('01012345678')
    expect(normalizePhone('00201012345678')).toBe('01012345678')
    expect(normalizePhone('201012345678')).toBe('01012345678')
  })
  it('accepts Egyptian mobiles only', () => {
    expect(isEgyptMobile('01512345678')).toBe(true)
    expect(isEgyptMobile('01312345678')).toBe(false)
    expect(isEgyptMobile('0101234567')).toBe(false)
  })
})

describe('ProfileForm', () => {
  it('accepts an empty phone and trims the name', () => {
    const r = ProfileForm.safeParse({ name: ' أحمد ', phone: '', governorate: 'cairo', kinds: ['chicken'] })
    expect(r.success && r.data.name).toBe('أحمد')
  })
  it('rejects a one-letter name, a bad phone, or no birds', () => {
    expect(ProfileForm.safeParse({ name: 'أ', phone: '', governorate: 'cairo', kinds: ['chicken'] }).success).toBe(false)
    expect(ProfileForm.safeParse({ name: 'أحمد', phone: '123', governorate: 'cairo', kinds: ['chicken'] }).success).toBe(false)
    expect(ProfileForm.safeParse({ name: 'أحمد', phone: '', governorate: 'cairo', kinds: [] }).success).toBe(false)
  })
})

describe('rows', () => {
  it('builds a user row keyed by client id', () => {
    const r = userRow(
      { clientId: 'c-1', name: 'أحمد', phone: '', governorate: 'القاهرة', kinds: ['chicken', 'duck'], createdAt: 0 },
      env,
      86_400_000,
    )
    expect(r.sheet).toBe(SHEETS.users)
    expect(r.row.client_id).toBe('c-1')
    expect(r.row.bird_kinds).toBe('chicken, duck')
    expect(r.row.last_seen).toBe('1970-01-02T00:00:00.000Z')
  })
  it('builds a feedback row with a normalised phone and trimmed text', () => {
    const r = feedbackRow(
      { type: 'case', message: '  الفراخ بتكح  ', phone: '+201012345678', screen: 'home' },
      { name: 'أحمد', governorate: 'القاهرة', kinds: 'فراخ' },
      env,
      0,
    )
    expect(r.sheet).toBe(SHEETS.feedback)
    expect(r.row.message).toBe('الفراخ بتكح')
    expect(r.row.phone).toBe('01012345678')
    expect(r.row.status).toBe('new')
  })
  it('builds a flock-news row', () => {
    const r = newsRow(
      { date: '2026-11-13', tag: 'eggs', text: '12 بيضة', group: 'البلدي' },
      { name: 'أحمد', governorate: 'القاهرة' },
      env,
      0,
    )
    expect(r.sheet).toBe(SHEETS.news)
    expect(r.row.note).toBe('12 بيضة')
  })
})

describe('Google sign-in', () => {
  const b64url = (o: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  const token = (claims: unknown) => `${b64url({ alg: 'RS256' })}.${b64url(claims)}.sig`

  it('reads name, email and photo from an ID token, Arabic names included', () => {
    const id = readGoogleIdToken(
      token({ sub: '42', email: 'um.ahmed@gmail.com', name: 'أم أحمد', picture: 'https://x/p.jpg', exp: 99 }),
    )
    expect(id).toEqual({ sub: '42', email: 'um.ahmed@gmail.com', name: 'أم أحمد', picture: 'https://x/p.jpg', exp: 99 })
  })
  it('rejects junk and tokens without an email', () => {
    expect(readGoogleIdToken('nope')).toBeNull()
    expect(readGoogleIdToken('a.%%%.c')).toBeNull()
    expect(readGoogleIdToken(token({ sub: '42' }))).toBeNull()
  })
  it('fits long names to the form', () => {
    expect(fitName('  Mohamed   Ali ')).toBe('Mohamed Ali')
    expect(fitName('x'.repeat(60))).toHaveLength(40)
  })
  it('sends the token only when given, and builds a click row', () => {
    const p = { clientId: 'c-1', name: 'أحمد', phone: '', governorate: 'القاهرة', kinds: [], createdAt: 0 }
    expect(userRow(p, env, 0).row.id_token).toBeUndefined()
    expect(userRow(p, env, 0, 'tok').row.id_token).toBe('tok')
    const c = clickRow({ productId: 'incubator', product: 'فقاسة', category: 'heat', channel: 'whatsapp' }, env, 0)
    expect(c.sheet).toBe(SHEETS.clicks)
    expect(c.row.channel).toBe('whatsapp')
    expect(c.row.client_id).toBe('c-1')
  })
})
