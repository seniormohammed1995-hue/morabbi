import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APK_URL, CONFIG } from '../../config'
import { feedbackUrl, openFeedback } from '../../feedback'
import { useProfile } from '../../cloud/client'
import { isNative, share } from '../../platform'
import { t } from '../../i18n'
import { Icon } from '../../ui/Icon'
import { Button, Card, cx, toast } from '../../ui/kit'

export const inviteText = (): string => `${t('share.msg')}\n${CONFIG.appUrl}`

export async function shareApp(): Promise<void> {
  const ok = await share.link(t('app.name'), t('share.msg'), CONFIG.appUrl)
  if (!ok) share.openExternal(`https://wa.me/?text=${encodeURIComponent(inviteText())}`)
}

export const hasDirectChat = (): boolean => CONFIG.feedbackWhatsapp.replace(/\D/g, '').length > 0

export function openDirectChat(): void {
  share.openExternal(feedbackUrl(t('wa.chatMsg', { name: CONFIG.developer.name })))
}

/** The big "صوتك يهمنا" banner (home, settings, tools). */
export function ContactBanner({ className }: { className?: string }) {
  const nav = useNavigate()
  return (
    <section
      aria-labelledby="contact-banner-h"
      className={cx(
        'relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-bl from-primary-soft via-surface to-accent-soft p-4 shadow-md',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-ink shadow">
          <Icon name="chat" size={26} />
        </span>
        <div className="min-w-0">
          <h2 id="contact-banner-h" className="text-lg font-extrabold text-primary">
            {t('contact.title')}
          </h2>
          <p className="mt-1 font-semibold leading-relaxed">{t('contact.headline')}</p>
          <p className="mt-1 text-sm font-bold text-leaf">{t('contact.sub')}</p>
        </div>
      </div>
      <Button icon="send" full className="mt-3" onClick={() => nav('/contact')}>
        {t('contact.cta')}
      </Button>
    </section>
  )
}

export function ShareAppCard({ className }: { className?: string }) {
  return (
    <Card tone="leaf" className={className}>
      <div className="flex items-start gap-3">
        <Icon name="heart" size={26} className="mt-0.5 shrink-0 text-leaf" />
        <div>
          <h2 className="font-extrabold">{t('share.title')}</h2>
          <p className="text-sm text-muted">{t('share.body')}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          icon="whatsapp"
          onClick={() =>
            share.openExternal(`https://wa.me/?text=${encodeURIComponent(inviteText())}`)
          }
        >
          {t('share.whatsapp')}
        </Button>
        {share.canShare() ? (
          <Button variant="secondary" icon="share" onClick={() => void shareApp()}>
            {t('share.btn')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon="copy"
            onClick={async () => {
              if (await share.copy(inviteText())) toast(t('share.copied'))
            }}
          >
            {t('share.copy')}
          </Button>
        )}
      </div>
    </Card>
  )
}

/** "حمّل نسخة الأندرويد" — web only. */
export function ApkCard({ className }: { className?: string }) {
  const nav = useNavigate()
  if (isNative()) return null
  return (
    <Card tone="accent" className={className}>
      <div className="flex items-start gap-3">
        <Icon name="android" size={28} className="mt-0.5 shrink-0 text-leaf" />
        <div>
          <h2 className="font-extrabold">{t('apk.cta')}</h2>
          <p className="text-sm text-muted">{t('apk.why')}</p>
        </div>
      </div>
      {CONFIG.playStoreUrl ? (
        <Button
          icon="android"
          full
          className="mt-3"
          onClick={() => share.openExternal(CONFIG.playStoreUrl)}
        >
          {t('apk.play')}
        </Button>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button icon="download" onClick={() => share.openExternal(APK_URL)}>
            {t('apk.download')}
          </Button>
          <Button variant="secondary" onClick={() => nav('/android')}>
            {t('apk.steps')}
          </Button>
        </div>
      )}
    </Card>
  )
}

/** Shown on home until the user signs up. */
export function JoinCard() {
  const profile = useProfile()
  const nav = useNavigate()
  if (profile !== null) return null
  return (
    <Card tone="primary">
      <div className="flex items-center gap-3">
        <Icon name="user" size={28} className="shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">{t('join.card.title')}</h2>
          <p className="text-sm text-muted">{t('join.card.body')}</p>
        </div>
        <Button className="shrink-0 px-4" onClick={() => nav('/join')}>
          {t('join.card.cta')}
        </Button>
      </div>
    </Card>
  )
}

const FAB_HIDDEN = ['/contact', '/sick']

/** Floating WhatsApp button with quick feedback / direct chat / in-app message. */
export function WhatsAppFab() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (open && d && !d.open) d.showModal()
    if (!open && d?.open) d.close()
  }, [open])
  if (FAB_HIDDEN.includes(pathname)) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('wa.menu')}
        className="no-print fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] end-3 z-30 flex min-h-12 items-center gap-2 rounded-full bg-[#25D366] px-4 font-bold text-[#0b3d1f] shadow-lg"
      >
        <Icon name="whatsapp" size={22} />
        {t('wa.fab')}
      </button>
      {open && (
        <dialog
          ref={ref}
          aria-labelledby="wa-title"
          onCancel={(e) => {
            e.preventDefault()
            setOpen(false)
          }}
          onClick={(e) => e.target === ref.current && setOpen(false)}
          className="m-auto mb-0 w-full max-w-xl rounded-t-3xl border border-line bg-surface p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] text-ink backdrop:bg-black/40 sm:mb-auto sm:rounded-3xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="wa-title" className="text-lg font-extrabold">
              {t('wa.menu')}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
              className="grid h-10 w-10 place-items-center rounded-full bg-surface-2"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="grid gap-2">
            <Button
              icon="whatsapp"
              full
              onClick={() => {
                setOpen(false)
                void openFeedback(pathname)
              }}
            >
              {t('wa.quick')}
            </Button>
            {hasDirectChat() && (
              <Button
                variant="secondary"
                icon="chat"
                full
                onClick={() => {
                  setOpen(false)
                  openDirectChat()
                }}
              >
                {t('wa.chat')}
              </Button>
            )}
            <Button
              variant="ghost"
              icon="send"
              full
              onClick={() => {
                setOpen(false)
                nav('/contact')
              }}
            >
              {t('wa.form')}
            </Button>
          </div>
        </dialog>
      )}
    </>
  )
}

/** Small round link used in the developer card. */
export function SocialLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: 'whatsapp' | 'facebook' | 'youtube' | 'github'
  label: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-surface p-2 text-sm font-bold"
    >
      <Icon name={icon} size={28} className="text-primary" />
      {label}
    </a>
  )
}
