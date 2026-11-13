import { SOURCES } from '../data/sources'
import { lowConfidenceValues, SPECIES } from '../data'
import { share } from '../platform'
import { t, lt } from '../i18n'
import { Badge, Card, Page, PageHeader, SectionTitle } from '../ui/kit'

export default function Sources() {
  const low = lowConfidenceValues()
  return (
    <Page>
      <PageHeader title={t('library.sources')} back />
      <Card tone="warn">
        <h2 className="mb-1 font-bold">{t('disclaimer.title')} — {t('app.beta')}</h2>
        <p className="leading-relaxed">{t('disclaimer.body')}</p>
      </Card>

      <SectionTitle icon="book">{t('common.sources')}</SectionTitle>
      <ul className="space-y-2">
        {Object.values(SOURCES).map((s) => (
          <li key={s.id}>
            <button type="button" className="w-full rounded-xl border border-line bg-surface p-3 text-start" onClick={() => share.openExternal(s.url)}>
              <span className="block font-bold text-primary" dir="auto">
                {s.title}
              </span>
              <span className="text-sm text-muted">
                {s.publisher}
                {'year' in s && s.year ? ` · ${s.year}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <SectionTitle icon="alert">{t('library.lowValues')}</SectionTitle>
      <ul className="space-y-2">
        {low.map((l) => (
          <li key={`${l.speciesId}-${l.path}`} className="rounded-xl border border-line bg-surface p-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone="warn">{t('common.indicative')}</Badge>
              <span className="font-bold">{lt(SPECIES[l.speciesId]!.data.name)}</span>
            </div>
            <code className="mt-1 block text-xs text-muted" dir="ltr">
              {l.path}
            </code>
            {l.note && <p className="mt-1">{l.note}</p>}
          </li>
        ))}
      </ul>
    </Page>
  )
}
