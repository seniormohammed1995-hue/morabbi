import { SOURCES } from '../data/sources'
import { lowConfidenceValues, SPECIES } from '../data'
import { share } from '../platform'
import { getProfile } from '../data/birds'
import { num } from '../i18n/format'
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
      <div className="space-y-2">
        {[...new Set(low.map((l) => l.speciesId))].map((id) => {
          const rows = low.filter((l) => l.speciesId === id)
          const p = getProfile(id)
          const name = p ? `${t(`kind.${p.kind}`)} — ${lt(p.name)}` : SPECIES[id] ? lt(SPECIES[id]!.data.name) : t('feeds.ingredients')
          return (
            <details key={id} className="rounded-xl border border-line bg-surface">
              <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-3 font-bold">
                {name} <Badge tone="warn">{num(rows.length)}</Badge>
              </summary>
              <ul className="space-y-2 px-3 pb-3">
                {rows.map((l) => (
                  <li key={l.path} className="border-t border-line pt-2 text-sm">
                    <code className="block text-xs text-muted" dir="ltr">
                      {l.path}
                    </code>
                    {l.note && <p className="mt-1">{l.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )
        })}
      </div>
    </Page>
  )
}
