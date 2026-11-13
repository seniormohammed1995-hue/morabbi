import { isNative } from './native'

/**
 * "ادخل بحساب Gmail". Web: Google Identity Services (the official button + One Tap).
 * Android: Credential Manager through @capgo/capacitor-social-login (loaded lazily, so the web
 * build never pulls it in). Both return a Google ID token; the app only reads it for display,
 * and the Apps Script verifies it with Google before storing the email.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client'

interface GisId {
  initialize(o: {
    client_id: string
    callback: (r: { credential?: string }) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    use_fedcm_for_prompt?: boolean
    context?: 'signin' | 'signup' | 'use'
    ux_mode?: 'popup' | 'redirect'
  }): void
  renderButton(el: HTMLElement, o: Record<string, string | number>): void
  prompt(): void
  disableAutoSelect(): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GisId } }
  }
}

let gisLoading: Promise<GisId> | null = null

function loadGis(): Promise<GisId> {
  gisLoading ??= new Promise<GisId>((resolve, reject) => {
    const ready = () => {
      const id = window.google?.accounts?.id
      if (id) resolve(id)
      else reject(new Error('gis missing'))
    }
    if (window.google?.accounts?.id) return ready()
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.onload = ready
    s.onerror = () => {
      gisLoading = null
      reject(new Error('gis load failed'))
    }
    document.head.appendChild(s)
  })
  return gisLoading
}

let nativeReady: Promise<unknown> | null = null

async function socialLogin(clientId: string) {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  nativeReady ??= SocialLogin.initialize({ google: { webClientId: clientId, mode: 'online' } })
  await nativeReady
  return SocialLogin
}

export const googleAuth = {
  /** Android uses our own button; the web must use Google's rendered button. */
  usesNativeButton: (): boolean => isNative(),

  /**
   * Web: draws Google's button inside `el` and shows One Tap. `onToken` gets the ID token.
   * Returns false when Google's script can't load (offline, blocked).
   */
  async renderWebButton(
    el: HTMLElement,
    clientId: string,
    onToken: (idToken: string) => void,
  ): Promise<boolean> {
    try {
      const id = await loadGis()
      id.initialize({
        client_id: clientId,
        callback: (r) => r.credential && onToken(r.credential),
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        context: 'signin',
        ux_mode: 'popup',
      })
      el.replaceChildren()
      id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'ar',
        width: Math.min(el.clientWidth || 320, 400),
      })
      id.prompt()
      return true
    } catch {
      return false
    }
  },

  /** Android: opens the account picker. Returns the ID token, or null if the user backed out. */
  async nativeSignIn(clientId: string): Promise<string | null> {
    try {
      const sl = await socialLogin(clientId)
      const res = await sl.login({ provider: 'google', options: {} })
      const r = res.result as { responseType?: string; idToken?: string | null }
      return r.responseType === 'online' && r.idToken ? r.idToken : null
    } catch {
      return null
    }
  },

  /** Forgets the Google session on this device (the profile on the phone stays). */
  async signOut(clientId: string): Promise<void> {
    try {
      if (isNative()) await (await socialLogin(clientId)).logout({ provider: 'google' })
      else window.google?.accounts?.id?.disableAutoSelect()
    } catch {
      /* already signed out */
    }
  },
}
