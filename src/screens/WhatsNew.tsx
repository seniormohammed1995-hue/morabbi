import { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config'
import { prefs } from '../platform'
import { t } from '../i18n'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/kit'
import { BetaStrip } from './Onboarding'

const KEY = 'morabbi-seen-release'

export function markVersionSeen(): void {
  prefs.set(KEY, CONFIG.releaseKey)
}

const ITEMS = ['wn.1', 'wn.2', 'wn.3', 'wn.4', 'wn.5'] as const

/** Shown once after an update to a new release (existing users only — onboarding marks it seen). */
export function WhatsNew() {
  const [open, setOpen] = useState(() => prefs.get(KEY) !== CONFIG.releaseKey)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (open && d && !d.open) d.showModal()
  }, [open])
  if (!open) return null
  const close = () => {
    markVersionSeen()
    ref.current?.close()
    setOpen(false)
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby="wn-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      className="m-auto max-h-[90dvh] w-[min(94vw,28rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink backdrop:bg-black/40"
    >
      <h2 id="wn-title" className="flex items-center gap-2 text-xl font-extrabold">
        <Icon name="star" className="text-accent" /> {t('wn.title', { v: CONFIG.releaseKey })}
      </h2>
      <ul className="mt-3 space-y-2">
        {ITEMS.map((k) => (
          <li key={k} className="flex gap-2">
            <Icon name="check" size={20} className="mt-0.5 shrink-0 text-leaf" />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
      <BetaStrip className="mt-4" />
      <Button full className="mt-4" onClick={close}>
        {t('wn.ok')}
      </Button>
    </dialog>
  )
}
