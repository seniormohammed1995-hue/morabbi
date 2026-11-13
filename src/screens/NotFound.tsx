import { Link } from 'react-router-dom'
import { Page, EmptyState } from '../ui/kit'
import { t } from '../i18n'

export default function NotFound() {
  return (
    <Page>
      <EmptyState title={t('err.notFound')} icon="alert">
        <Link to="/" className="rounded-xl bg-primary px-5 py-3 text-center font-bold text-primary-ink">
          {t('nav.home')}
        </Link>
      </EmptyState>
    </Page>
  )
}
