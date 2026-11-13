import { Link } from 'react-router-dom'
import { APP_VERSION } from '../config'
import { t } from '../i18n'
import { Card, Page, PageHeader } from '../ui/kit'
import { BetaStrip } from './Onboarding'
import { FeedbackCard } from './Feedback'
import { Attribution } from './weather/WeatherBar'

export default function About() {
  return (
    <Page>
      <PageHeader title={t('about.title')} back />
      <BetaStrip />
      <Card className="mt-4">
        <h2 className="text-xl font-extrabold">{t('app.name')}</h2>
        <p className="text-sm text-muted">{t('settings.version', { v: APP_VERSION })}</p>
        <p className="mt-3 leading-relaxed">{t('about.body')}</p>
        <p className="mt-3 leading-relaxed">{t('disclaimer.body')}</p>
        <p className="mt-3 text-sm">{t('about.weather')}</p>
        <Attribution />
        <Link to="/library/sources" className="mt-3 block font-bold text-primary">
          {t('library.sources')}
        </Link>
      </Card>
      <FeedbackCard from={t('about.title')} />
    </Page>
  )
}
