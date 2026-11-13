import { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../../config'
import { googleEnabled } from '../../cloud/client'
import { readGoogleIdToken, type GoogleIdentity } from '../../cloud/payload'
import { device, googleAuth } from '../../platform'
import { t } from '../../i18n'
import { Icon } from '../../ui/Icon'
import { Button, Card } from '../../ui/kit'

export interface GoogleResult {
  idToken: string
  identity: GoogleIdentity
}

/** Round photo from the Google account, or a plain user icon. */
export function Avatar({ src, size = 40 }: { src?: string | undefined; size?: number }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
        style={{ width: size, height: size }}
      >
        <Icon name="user" size={Math.round(size * 0.55)} />
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className="shrink-0 rounded-full"
    />
  )
}

/**
 * "ادخل بحساب Gmail بضغطة" — hidden when CONFIG.googleClientId is empty.
 * Web: Google's own button (and One Tap). Android: our button opens the account picker.
 */
export function GoogleSignIn({ onResult }: { onResult: (r: GoogleResult) => void }) {
  const holder = useRef<HTMLDivElement>(null)
  const cb = useRef(onResult)
  cb.current = onResult
  const [webState, setWebState] = useState<'loading' | 'ready' | 'offline'>('loading')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const native = googleAuth.usesNativeButton()

  const accept = (idToken: string) => {
    const identity = readGoogleIdToken(idToken)
    if (!identity) return setFailed(true)
    setFailed(false)
    device.chime('ok')
    cb.current({ idToken, identity })
  }

  useEffect(() => {
    if (!googleEnabled() || native || !holder.current) return
    let alive = true
    void googleAuth.renderWebButton(holder.current, CONFIG.googleClientId, accept).then((ok) => {
      if (alive) setWebState(ok ? 'ready' : 'offline')
    })
    return () => {
      alive = false
    }
    // accept only reads refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native])

  if (!googleEnabled()) return null

  return (
    <Card tone="plain" className="mb-4">
      <h2 className="font-extrabold">{t('g.title')}</h2>
      <p className="mb-3 text-sm text-muted">{t('g.sub')}</p>
      {native ? (
        <Button
          variant="secondary"
          icon="user"
          full
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              const tok = await googleAuth.nativeSignIn(CONFIG.googleClientId)
              if (tok) accept(tok)
              else setFailed(true)
            } finally {
              setBusy(false)
            }
          }}
        >
          {t('g.btn')}
        </Button>
      ) : (
        <>
          <div ref={holder} className="flex min-h-11 justify-center" />
          {webState === 'offline' && <p className="text-sm text-muted">{t('g.offline')}</p>}
        </>
      )}
      {failed && (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          {t('g.failed')}
        </p>
      )}
    </Card>
  )
}
