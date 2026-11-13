import { Link } from 'react-router-dom'
import { APP_VERSION, CONFIG } from '../config'
import { t } from '../i18n'
import { Icon } from '../ui/Icon'
import { Card, Page, PageHeader } from '../ui/kit'
import { BetaStrip } from './Onboarding'
import { Attribution } from './weather/WeatherBar'
import { ApkCard, ContactBanner, hasDirectChat, ShareAppCard, SocialLink } from './v3/parts'
import { feedbackUrl } from '../feedback'

/** "عن التطبيق والمطوّر". */
export default function About() {
  const dev = CONFIG.developer
  type Social = { href: string; icon: 'whatsapp' | 'facebook' | 'youtube' | 'github'; label: string }
  const links: Social[] = []
  if (hasDirectChat())
    links.push({ href: feedbackUrl(t('wa.chatMsg', { name: dev.name })), icon: 'whatsapp', label: t('dev.whatsapp') })
  const urls: Array<[string, Social['icon'], string]> = [
    [dev.facebook, 'facebook', t('dev.facebook')],
    [dev.youtube, 'youtube', t('dev.youtube')],
    [dev.github, 'github', t('dev.github')],
  ]
  for (const [href, icon, label] of urls) if (href) links.push({ href, icon, label })

  return (
    <Page>
      <PageHeader title={t('dev.title')} back />

      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
        <div className="bg-gradient-to-bl from-primary to-[#7a3518] p-5 text-primary-ink">
          <div className="flex items-center gap-3">
            <img src="icons/icon-96.png" alt="" width={56} height={56} className="rounded-2xl shadow" />
            <div>
              <h2 className="text-2xl font-extrabold">{t('app.name')}</h2>
              <p className="text-sm opacity-90">{t('settings.version', { v: APP_VERSION })}</p>
            </div>
          </div>
          <p className="mt-3 leading-relaxed opacity-95">{t('about.body')}</p>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold text-muted">{t('dev.by')}</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-soft text-2xl font-extrabold text-primary">
              {dev.name.slice(0, 1)}
            </span>
            <div>
              <h3 className="text-xl font-extrabold">{dev.name}</h3>
              <p className="text-sm text-muted" dir="ltr">
                {dev.nameEn}
              </p>
            </div>
          </div>
          <p className="mt-3 leading-relaxed">{t('dev.bio')}</p>
          <h3 className="mt-4 font-extrabold">{t('dev.mission')}</h3>
          <p className="mt-1 leading-relaxed">{t('dev.missionBody')}</p>
          {links.length > 0 && (
            <>
              <h3 className="mt-4 font-extrabold">{t('dev.contact')}</h3>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {links.map((l) => (
                  <SocialLink key={l.icon} {...l} />
                ))}
              </div>
            </>
          )}
          <p className="mt-4 flex items-center justify-center gap-1 text-sm text-muted">
            <Icon name="heart" size={16} className="text-danger" /> {t('dev.made')}
          </p>
        </div>
      </section>

      <ContactBanner className="mt-4" />
      <ShareAppCard className="mt-4" />
      <ApkCard className="mt-4" />

      <Card className="mt-4">
        <BetaStrip />
        <p className="mt-3 leading-relaxed">{t('disclaimer.body')}</p>
        <p className="mt-3 text-sm">{t('about.weather')}</p>
        <Attribution />
        <Link to="/library/sources" className="mt-3 block font-bold text-primary">
          {t('library.sources')}
        </Link>
      </Card>
    </Page>
  )
}
