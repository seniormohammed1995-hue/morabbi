import { useMemo, useState } from 'react'
import { SCRAP_ITEMS } from '../../data/scraps'
import { profilesOf, KINDS } from '../../data/birds'
import type { BirdProfile, ScrapVerdict } from '../../data/schema'
import { useGroups, useKinds } from '../../db/birds'
import { getProfile } from '../../data/birds'
import { searchScraps, scrapVerdicts } from '../../calc/birds'
import { t, lt } from '../../i18n'
import { BirdArt } from '../../ui/BirdArt'
import { Icon } from '../../ui/Icon'
import { Badge, cx, Page, PageHeader, SourceNote } from '../../ui/kit'
import { FeedbackCard } from '../Feedback'

const TONE: Record<
  ScrapVerdict,
  { badge: 'leaf' | 'warn' | 'danger'; icon: 'check' | 'alert' | 'close' }
> = {
  ok: { badge: 'leaf', icon: 'check' },
  limit: { badge: 'warn', icon: 'alert' },
  no: { badge: 'danger', icon: 'close' },
}

/** "ينفع أأكّلهم ده؟" — quick search over household scraps, one verdict per kind the user keeps. */
export default function Scraps() {
  const kinds = useKinds()
  const groups = useGroups()
  const [q, setQ] = useState('')
  // One profile per kind: the breed the user keeps, else the first breed of that kind.
  const profiles = useMemo<BirdProfile[]>(() => {
    const ks = kinds && kinds.length ? kinds : KINDS
    return ks
      .map(
        (k) => getProfile(groups?.find((g) => g.kind === k)?.profileId ?? '') ?? profilesOf(k)[0],
      )
      .filter((p): p is BirdProfile => !!p)
  }, [kinds, groups])
  const results = q.trim() ? searchScraps(SCRAP_ITEMS, q) : []

  return (
    <Page>
      <PageHeader title={t('scraps.title')} back />
      <label htmlFor="scrap-q" className="sr-only">
        {t('scraps.title')}
      </label>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute start-3 top-3.5 text-muted" />
        <input
          id="scrap-q"
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('scraps.placeholder')}
          className="min-h-12 w-full rounded-xl border border-line bg-surface pe-3 ps-11 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {!q.trim() && (
        <>
          <p className="mt-4 text-muted">{t('scraps.hint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCRAP_ITEMS.slice(0, 12).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setQ(s.aliases[0] ?? s.name.ar)}
                className="min-h-10 rounded-full bg-surface-2 px-3 text-sm font-semibold"
              >
                {s.aliases[0] ?? lt(s.name)}
              </button>
            ))}
          </div>
        </>
      )}

      {q.trim() && results.length === 0 && (
        <p className="mt-6 text-center text-muted">{t('scraps.none')}</p>
      )}

      <ul className="mt-4 space-y-3">
        {results.slice(0, 5).map((item) => (
          <li key={item.id} className="rounded-2xl border border-line bg-surface p-3">
            <h2 className="mb-2 text-lg font-extrabold">{lt(item.name)}</h2>
            <ul className="space-y-2">
              {scrapVerdicts(item.id, profiles).map(({ profile, rule }) => (
                <li key={profile.id} className="flex gap-2">
                  <BirdArt kind={profile.kind} size={32} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{t(`kind.${profile.kind}`)}</span>
                      {rule ? (
                        <Badge tone={TONE[rule.verdict].badge}>
                          <Icon name={TONE[rule.verdict].icon} size={14} className="me-1" />
                          {t(`scraps.${rule.verdict}`)}
                        </Badge>
                      ) : (
                        <Badge>{t('scraps.unknown')}</Badge>
                      )}
                    </div>
                    {rule && (
                      <p className={cx('text-sm', rule.verdict === 'no' && 'font-semibold')}>
                        {lt(rule.reason)}
                      </p>
                    )}
                    {rule && <SourceNote item={rule} />}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">{t('scraps.footer')}</p>
      <FeedbackCard from={t('scraps.title')} />
    </Page>
  )
}
