import { CONFIG, APP_VERSION } from './config'
import { getProfile } from './data/birds'
import { db } from './db'
import { getKinds } from './db/birds'
import { share } from './platform'
import { t } from './i18n'

/** Feedback text: app version, the birds the user keeps and where the button was pressed. */
export async function feedbackMessage(from: string): Promise<string> {
  const kinds = await getKinds()
  const groups = (await db.flocks.where('status').equals('active').toArray()).filter((f) =>
    kinds.includes(f.kind),
  )
  const breeds = [...new Set(groups.map((g) => getProfile(g.profileId)?.name.ar).filter(Boolean))]
  return t('fb.message', {
    v: APP_VERSION,
    birds: breeds.length ? breeds.join('، ') : kinds.map((k) => t(`kind.${k}`)).join('، ') || '—',
    from,
  })
}

export function feedbackUrl(text: string, phone: string = CONFIG.feedbackWhatsapp): string {
  const to = phone.replace(/\D/g, '')
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`
}

export async function openFeedback(from: string): Promise<void> {
  share.openExternal(feedbackUrl(await feedbackMessage(from)))
}
