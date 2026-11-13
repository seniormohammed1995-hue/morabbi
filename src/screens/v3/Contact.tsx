import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cloudEnabled, sendFeedback, useProfile, usePendingCount, type SendResult } from '../../cloud/client'
import { FEEDBACK_TYPES, isEgyptMobile, normalizePhone, type FeedbackType } from '../../cloud/payload'
import { RULES } from '../../data/rules'
import { device } from '../../platform'
import { t } from '../../i18n'
import { num } from '../../i18n/format'
import { Icon } from '../../ui/Icon'
import { Button, Card, Choice, Field, Page, PageHeader } from '../../ui/kit'
import { hasDirectChat, openDirectChat } from './parts'

/** "صوتك يهمنا / اطلب توصية خاصة": type + message + optional phone → Google Sheet (or WhatsApp). */
export default function Contact() {
  const profile = useProfile()
  const pending = usePendingCount()
  const from = (useLocation().state as { from?: string } | null)?.from ?? 'contact'
  const [type, setType] = useState<FeedbackType>('recommendation')
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<SendResult | null>(null)

  useEffect(() => {
    if (profile?.phone) setPhone((p) => p || profile.phone)
  }, [profile?.phone])

  const submit = async () => {
    if (message.trim().length < 5) return setErr(t('contact.err.short'))
    const p = normalizePhone(phone)
    if (p && !isEgyptMobile(p)) return setErr(t('join.err.phone'))
    setErr(null)
    setBusy(true)
    try {
      const r = await sendFeedback({ type, message, phone: p, screen: from })
      setDone(r)
      if (r !== 'whatsapp') {
        device.chime('ok')
        device.vibrate(30)
      }
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Page>
        <PageHeader title={t('contact.title')} back />
        <Card tone="leaf" className="mt-6 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-leaf text-white">
            <Icon name="check" size={34} />
          </div>
          <h2 className="text-2xl font-extrabold">{t('contact.thanks.title')}</h2>
          <p className="mt-2 text-lg" role="status">
            {t(`contact.thanks.${done}`)}
          </p>
          <Button
            variant="secondary"
            full
            className="mt-5"
            onClick={() => {
              setDone(null)
              setMessage('')
            }}
          >
            {t('contact.another')}
          </Button>
        </Card>
      </Page>
    )
  }

  const left = RULES.maxMessageChars - message.length
  return (
    <Page>
      <PageHeader title={t('contact.title')} back />
      <Card tone="primary">
        <p className="font-bold leading-relaxed">{t('contact.headline')}</p>
        <p className="mt-1 text-sm font-bold text-leaf">{t('contact.sub')}</p>
      </Card>

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div>
          <p className="mb-2 font-bold">{t('contact.type')}</p>
          <Choice<FeedbackType>
            value={type}
            onChange={setType}
            options={FEEDBACK_TYPES.map((x) => ({ value: x, label: t(`contact.type.${x}`) }))}
          />
        </div>
        <Field label={t('contact.message')} htmlFor="contact-msg" hint={t('jr.left', { n: num(left) })}>
          <textarea
            id="contact-msg"
            rows={6}
            maxLength={RULES.maxMessageChars}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('contact.messagePh')}
            className="w-full rounded-xl border border-line bg-surface p-3 text-base leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </Field>
        <Field label={t('contact.phone')} htmlFor="contact-phone">
          <input
            id="contact-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-end text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </Field>
        {err && (
          <p role="alert" className="font-bold text-danger">
            {err}
          </p>
        )}
        <Button type="submit" icon={cloudEnabled() ? 'send' : 'whatsapp'} full disabled={busy}>
          {busy ? t('contact.sending') : cloudEnabled() ? t('contact.send') : t('contact.sendWa')}
        </Button>
        {!!pending && (
          <p className="text-center text-sm text-muted">{t('contact.pending', { n: num(pending) })}</p>
        )}
      </form>

      {hasDirectChat() && (
        <Button variant="ghost" icon="whatsapp" full className="mt-4" onClick={openDirectChat}>
          {t('wa.chat')}
        </Button>
      )}
    </Page>
  )
}
