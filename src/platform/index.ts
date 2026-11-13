/**
 * Platform layer. Every browser-specific API used by the app goes through here.
 * On Android (Capacitor) notifications go through LocalNotifications (src/platform/native.ts)
 * so reminders fire while the app is closed; on the web they only fire while it is open.
 */
import {
  isNative,
  nativeNotifications,
  platformName,
  type DailyNotification,
  type NotificationTap,
  type TimedNotification,
} from './native'

export { isNative, platformName, wireBackButton } from './native'
export type { DailyNotification, NotificationTap, TimedNotification } from './native'

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

/** Native permission is async; cached here so `state()` stays synchronous for the UI. */
let nativePerm: PermissionState = 'default'

/** Small stable hash so string tags map to Android's numeric ids (above the reminder ids). */
function tagId(tag: string): number {
  let h = 0
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) | 0
  return 100_000 + (Math.abs(h) % 1_000_000)
}

/** Button texts for the Android reminder actions (set once from the i18n layer). */
let actionLabels: { done: string; snooze: string } | undefined

export const notifications = {
  /** Call once on start (reads the Android permission). `labels` are the action-button texts. */
  async init(labels?: { done: string; snooze: string }): Promise<void> {
    if (!isNative()) return
    actionLabels = labels ?? actionLabels
    try {
      nativePerm = await nativeNotifications.permission()
      if (nativePerm === 'granted') await nativeNotifications.ensureChannel(actionLabels)
    } catch {
      nativePerm = 'unsupported'
    }
  },
  /** True when reminders can fire with the app closed. */
  canScheduleClosed(): boolean {
    return isNative()
  },
  state(): PermissionState {
    if (isNative()) return nativePerm
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return Notification.permission
  },
  async request(): Promise<PermissionState> {
    if (isNative()) {
      try {
        nativePerm = await nativeNotifications.request()
        if (nativePerm === 'granted') await nativeNotifications.ensureChannel(actionLabels)
      } catch {
        nativePerm = 'unsupported'
      }
      return nativePerm
    }
    if (!('Notification' in window)) return 'unsupported'
    return Notification.requestPermission()
  },
  /**
   * Replaces everything the app scheduled with these daily and one-off notifications
   * (Android only; false on the web, where nothing can fire while the app is closed).
   */
  async schedule(
    daily: DailyNotification[],
    timed: TimedNotification[],
    ours: (id: number) => boolean,
  ): Promise<boolean> {
    if (!isNative() || nativePerm !== 'granted') return false
    try {
      await nativeNotifications.replaceAll(daily, timed, ours)
      return true
    } catch {
      return false
    }
  },
  /** Adds one more timed notification, e.g. a snoozed reminder (Android only). */
  async scheduleOne(n: TimedNotification, withActions = true): Promise<boolean> {
    if (!isNative() || nativePerm !== 'granted') return false
    try {
      await nativeNotifications.scheduleOne(n, withActions)
      return true
    } catch {
      return false
    }
  },
  /** Runs `handler` when the user taps a notification or one of its buttons (Android). */
  onTap(handler: (tap: NotificationTap) => void): void {
    if (isNative()) void nativeNotifications.onTap(handler).catch(() => undefined)
  },
  /** Shows a local notification now. Uses the service worker when available (required on Android Chrome). */
  async show(title: string, body: string, tag: string): Promise<boolean> {
    if (notifications.state() !== 'granted') return false
    if (isNative()) {
      try {
        await nativeNotifications.showNow(tagId(tag), title, body)
        return true
      } catch {
        return false
      }
    }
    const options: NotificationOptions = { body, tag, icon: 'icons/icon-192.png', lang: 'ar', dir: 'rtl' }
    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      if (reg) {
        await reg.showNotification(title, options)
        return true
      }
      new Notification(title, options)
      return true
    } catch {
      return false
    }
  },
}

export const files = {
  /** Saves a blob as a downloaded file. */
  save(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  },
  /** Opens the system file picker. Resolves null if the user cancels. */
  pick(accept: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.onchange = () => resolve(input.files?.[0] ?? null)
      input.addEventListener('cancel', () => resolve(null))
      input.click()
    })
  },
  /** Opens a printable window (used for "save as PDF"). */
  print(html: string, title: string): boolean {
    const w = window.open('', '_blank')
    if (!w) return false
    w.document.write(
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title>` +
        `<style>body{font-family:Cairo,system-ui,sans-serif;margin:24px;color:#3a2a1e}svg{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4px 8px;text-align:right}</style>` +
        `</head><body>${html}<script>window.onload=()=>{window.print()}</script></body></html>`,
    )
    w.document.close()
    return true
  },
}

/** Downscales an image file to a JPEG blob (keeps IndexedDB small). */
export async function compressImage(file: File, maxSide = 1024, quality = 0.75): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality),
  )
}

/** Renders an SVG element to a PNG blob. */
export async function svgToPng(svg: SVGSVGElement, width: number): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg)
  const vb = svg.viewBox.baseVal
  const height = Math.round((width * vb.height) / vb.width)
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png'))
}

export const share = {
  canShare(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  },
  async text(title: string, text: string): Promise<boolean> {
    if (!share.canShare()) return false
    try {
      await navigator.share({ title, text })
      return true
    } catch {
      return false
    }
  },
  /** System share sheet with a link (Android's share sheet inside the APK too). */
  async link(title: string, text: string, url: string): Promise<boolean> {
    if (!share.canShare()) return false
    try {
      await navigator.share({ title, text, url })
      return true
    } catch {
      return false
    }
  },
  /** Copies text to the clipboard. */
  async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  },
  /** Opens an external URL (WhatsApp, source links) outside the app. */
  openExternal(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer')
  },
}

let audio: AudioContext | null = null

export const device = {
  vibrate(ms: number): void {
    try {
      navigator.vibrate?.(ms)
    } catch {
      /* vibration is optional */
    }
  },
  /** A short two-note chime (Web Audio, no sound files). Silent if audio is blocked. */
  chime(kind: 'ok' | 'alert' = 'ok'): void {
    if (!device.soundOn()) return
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      audio ??= new Ctx()
      const ctx = audio
      const notes = kind === 'ok' ? [660, 880] : [880, 660]
      notes.forEach((f, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        const t0 = ctx.currentTime + i * 0.14
        o.type = 'sine'
        o.frequency.value = f
        g.gain.setValueAtTime(0.0001, t0)
        g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
        o.connect(g).connect(ctx.destination)
        o.start(t0)
        o.stop(t0 + 0.25)
      })
    } catch {
      /* sound is optional */
    }
  },
  soundOn(): boolean {
    return prefs.get('morabbi-sound') !== '0'
  },
  setSound(on: boolean): void {
    prefs.set('morabbi-sound', on ? '1' : '0')
  },
  /** Random id for this install (sent with cloud rows). */
  randomId(): string {
    try {
      return crypto.randomUUID()
    } catch {
      return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    }
  },
  online(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false
  },
  /** Requests persistent storage so the browser does not evict IndexedDB data. */
  async persistStorage(): Promise<boolean> {
    try {
      return (await navigator.storage?.persist?.()) ?? false
    } catch {
      return false
    }
  },
}

export const prefs = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* storage may be blocked; preferences are non-critical */
    }
  },
}

/**
 * Google Apps Script web app. The body goes as text/plain so the browser makes a "simple"
 * request (no CORS preflight, which Apps Script cannot answer); Apps Script replies through a
 * redirect that allows any origin, so the JSON answer is readable.
 */
export const cloud = {
  async post(
    url: string,
    body: unknown,
    timeoutMs = 15_000,
  ): Promise<{ ok: boolean; error?: string }> {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        redirect: 'follow',
        signal: ctl.signal,
      })
      if (!res.ok) return { ok: false, error: `http ${res.status}` }
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      return json?.ok ? { ok: true } : { ok: false, error: json?.error ?? 'bad response' }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'network' }
    } finally {
      clearTimeout(timer)
    }
  },
}

export const runtime = { isNative, platformName }
