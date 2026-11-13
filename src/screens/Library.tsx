import { useMemo, useState } from 'react'
import { CATALOGUE, getSpecies } from '../data'
import { GLOSSARY } from '../data/glossary'
import { t, lt } from '../i18n'
import { Icon } from '../ui/Icon'
import { Badge, Card, Page, PageHeader, SectionTitle } from '../ui/kit'
import { LinkCard } from './parts'

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ً-ْ]/g, '')

export default function Library() {
  const [q, setQ] = useState('')
  const nq = norm(q.trim())
  const species = CATALOGUE.filter((c) => getSpecies(c.id))
  const upcoming = CATALOGUE.filter((c) => !getSpecies(c.id))
  const terms = useMemo(
    () => (nq ? GLOSSARY.filter((g) => norm(lt(g.term)).includes(nq) || norm(lt(g.meaning)).includes(nq)) : GLOSSARY),
    [nq],
  )
  const spMatch = nq ? species.filter((s) => norm(lt(s.name)).includes(nq) || norm(lt(getSpecies(s.id)!.data.description)).includes(nq)) : species

  return (
    <Page>
      <PageHeader title={t('library.title')} />
      <label className="relative mb-4 block">
        <span className="sr-only">{t('library.search')}</span>
        <Icon name="search" className="absolute start-3 top-3.5 text-muted" />
        <input
          type="search"
          className="min-h-12 w-full rounded-xl border border-line bg-surface ps-11 pe-3 text-lg"
          placeholder={t('library.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {spMatch.length > 0 && <SectionTitle icon="flock">{t('library.species')}</SectionTitle>}
      <div className="grid gap-2">
        {spMatch.map((s) => (
          <LinkCard key={s.id} to={`/library/species/${s.id}`} icon="flock" title={lt(s.name)} sub={lt(getSpecies(s.id)!.data.description)} />
        ))}
      </div>
      {!nq && upcoming.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {upcoming.map((u) => (
            <Badge key={u.id}>
              {lt(u.name)} — {t('wizard.comingSoon')}
            </Badge>
          ))}
        </div>
      )}

      {terms.length > 0 && <SectionTitle icon="list">{t('library.glossary')}</SectionTitle>}
      <Card>
        <dl>
          {terms.map((g) => (
            <div key={g.id} className="border-b border-line/60 py-2 last:border-0">
              <dt className="font-bold text-primary">{lt(g.term)}</dt>
              <dd className="text-sm">{lt(g.meaning)}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {nq && terms.length === 0 && spMatch.length === 0 && <p className="py-6 text-center text-muted">{t('library.noResults')}</p>}

      <div className="mt-5 grid gap-2">
        <LinkCard to="/feeds" icon="feed" title={t('nav.feeds')} />
        <LinkCard to="/library/sources" icon="info" title={t('library.sources')} />
      </div>
    </Page>
  )
}
