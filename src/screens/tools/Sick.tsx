import { useState } from 'react'
import { SICK } from '../../data/sick'
import { t, lt } from '../../i18n'
import { num } from '../../i18n/format'
import { Icon } from '../../ui/Icon'
import { Card, cx, Page, PageHeader, SectionTitle, SourceNote } from '../../ui/kit'
import { FeedbackCard } from '../Feedback'

/** First aid for a sick bird: numbered steps, what to watch, when to call a vet now. No diagnosis, no drugs. */
export default function Sick() {
  const [seen, setSeen] = useState<Set<number>>(new Set())
  return (
    <Page>
      <PageHeader title={t('sick.title')} back />
      <div
        role="note"
        className="sticky top-16 z-10 -mx-4 mb-3 flex items-start gap-2 border-y border-warn/30 bg-warn-soft px-4 py-2 text-sm font-bold text-warn"
      >
        <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
        {t('sick.vetNote')}
      </div>

      <ol className="space-y-2">
        {SICK.steps.map((s, i) => (
          <li key={s.text.ar} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
            <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-lg font-extrabold text-primary-ink">
              {num(i + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-relaxed">{lt(s.text)}</p>
              <SourceNote item={{ ...s, confidence: 'high' }} />
            </div>
          </li>
        ))}
      </ol>

      <SectionTitle icon="search">{t('sick.watch')}</SectionTitle>
      <p className="mb-2 text-sm text-muted">{t('sick.watchHint')}</p>
      <ul className="space-y-1">
        {SICK.watch.map((w, i) => (
          <li key={w.ar}>
            <button
              type="button"
              role="checkbox"
              aria-checked={seen.has(i)}
              onClick={() =>
                setSeen(
                  (cur) => new Set(cur.has(i) ? [...cur].filter((x) => x !== i) : [...cur, i]),
                )
              }
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-start"
            >
              <span
                className={cx(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2',
                  seen.has(i) ? 'border-leaf bg-leaf text-white' : 'border-line',
                )}
              >
                {seen.has(i) && <Icon name="check" size={16} />}
              </span>
              {lt(w)}
            </button>
          </li>
        ))}
      </ul>

      <Card tone="danger" className="mt-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-danger">
          <Icon name="alert" /> {t('sick.vetNow')}
        </h2>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          {SICK.vetNow.map((s) => (
            <li key={s.text.ar}>{lt(s.text)}</li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-surface/70 p-2 font-bold">{lt(SICK.report.text)}</p>
        <SourceNote item={{ ...SICK.report, confidence: 'high' }} />
      </Card>

      <FeedbackCard from={t('sick.title')} />
    </Page>
  )
}
