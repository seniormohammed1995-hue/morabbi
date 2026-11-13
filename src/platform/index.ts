/**
 * Platform layer. Every browser-specific API used by the app goes through here,
 * so wrapping with Capacitor later means swapping this file's implementation
 * (LocalNotifications, Filesystem, Share plugins) without touching screens.
 */

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export const notifications = {
  state(): PermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return Notification.permission
  },
  async request(): Promise<PermissionState> {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.requestPermission()
  },
  /** Shows a local notification now. Uses the service worker when available (required on Android). */
  async show(title: string, body: string, tag: string): Promise<boolean> {
    if (notifications.state() !== 'granted') return false
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
  /** Opens an external URL (WhatsApp, source links) outside the app. */
  openExternal(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer')
  },
}

export const device = {
  vibrate(ms: number): void {
    try {
      navigator.vibrate?.(ms)
    } catch {
      /* vibration is optional */
    }
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
