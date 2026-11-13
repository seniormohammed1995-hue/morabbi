import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { getProfile } from '../../data/birds'
import { SCRAP_ITEMS } from '../../data/scraps'
import type { SourcedValue } from '../../data/schema'
import { t, lt } from '../../i18n'
import { num, range } from '../../i18n/format'
import { BirdArt } from '../../ui/BirdArt'
import {
  Badge,
  Card,
  ConfidenceBadge,
  EmptyState,
  Page,
  PageHeader,
  SourceNote,
} from '../../ui/kit'
import { ageText } from './format'

function Val({
  label,
  v,
  digits = 0,
}: {
  label: string
  v: SourcedValue | undefined
  digits?: number
}) {
  if (!v) return null
  return (
    <div className="border-b border-line py-2 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted">{label}</span>
        <span className="num text-end font-bold">
          {range(v, digits)} <span className="text-sm font-semibold text-muted">{v.unit}</span>{' '}
          <ConfidenceBadge confidence={v.confidence} />
        </span>
      </div>
      <SourceNote item={v} />
    </div>
  )
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <details className="group mt-3 rounded-2xl border border-line bg-surface" open={n === 1}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-bold">
        <span className="num grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-sm text-primary">
          {num(n)}
        </span>
        {title}
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  )
}

const Bullets = ({ items }: { items: Array<{ ar: string }> }) => (
  <ul className="list-disc space-y-1 ps-5 leading-relaxed">
    {items.map((x) => (
      <li key={x.ar}>{lt(x)}</li>
    ))}
  </ul>
)

/** Every section of a bird profile with its sources. */
export default function ProfileCard() {
  const p = getProfile(useParams().id ?? '')
  if (!p)
    return (
      <Page>
        <PageHeader title={t('library.title')} back />
        <EmptyState title={t('err.notFound')} />
      </Page>
    )
  const verdictTone = { ok: 'leaf', limit: 'warn', no: 'danger' } as const
  return (
    <Page>
      <PageHeader title={lt(p.name)} subtitle={t(`kind.${p.kind}`)} back />
      <Card>
        <div className="flex items-center gap-3">
          <BirdArt kind={p.kind} size={56} />
          <p className="flex-1 leading-relaxed">{lt(p.description)}</p>
        </div>
        {p.dataStatus === 'limited' && (
          <p className="mt-2">
            <Badge tone="warn">{t('common.limitedData')}</Badge>{' '}
            <span className="text-sm text-muted">{t('profile.limited')}</span>
          </p>
        )}
      </Card>

      <Section n={1} title={t('profile.housing')}>
        <p className="mb-2">{lt(p.housing.type)}</p>
        {p.housing.space.map((s) => (
          <Val
            key={s.fromDay}
            label={t('profile.spaceAt', { from: ageText(s.fromDay) })}
            v={s.perM2}
            digits={1}
          />
        ))}
        <Val label={t('profile.perch')} v={p.housing.perchCm} />
        <Val label={t('profile.nest')} v={p.housing.birdsPerNest} />
        <p className="mt-2 font-semibold">{t('profile.water')}</p>
        <p className="mb-2">{lt(p.housing.water)}</p>
        <Bullets items={p.housing.notes} />
      </Section>

      <Section n={2} title={t('profile.feeding')}>
        {p.feeding.phases.map((ph) => (
          <div key={ph.id} className="border-b border-line py-2 last:border-0">
            <div className="font-bold">
              {lt(ph.name)}{' '}
              <span className="text-sm font-normal text-muted">
                ({ageText(ph.fromDay)} → {ageText(ph.toDay)})
              </span>
            </div>
            {ph.crudeProtein && <Val label={t('profile.protein')} v={ph.crudeProtein} digits={1} />}
            {ph.note && <p className="text-sm text-muted">{lt(ph.note)}</p>}
          </div>
        ))}
        <Bullets items={p.feeding.notes} />
        <p className="mt-3 text-sm">
          {t('profile.scrapsCount', {
            ok: num(p.feeding.scraps.filter((s) => s.verdict === 'ok').length),
            no: num(p.feeding.scraps.filter((s) => s.verdict === 'no').length),
          })}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {p.feeding.scraps
            .filter((s) => s.verdict === 'no')
            .map((s) => (
              <Badge key={s.item} tone={verdictTone[s.verdict]}>
                {t('profile.no')}: {lt(SCRAP_ITEMS.find((x) => x.id === s.item)?.name)}
              </Badge>
            ))}
        </div>
      </Section>

      <Section n={3} title={t('profile.cycle')}>
        <Val label={t(`profile.endpoint.${p.cycle.endpoint}`)} v={p.cycle.endpointAge} />
        {p.cycle.template.stages.map((s) => (
          <div key={s.id} className="py-2">
            <div className="font-bold">{lt(s.name)}</div>
            <p className="text-sm text-muted">{lt(s.summary)}</p>
          </div>
        ))}
      </Section>

      <Section n={4} title={t('profile.breeding')}>
        <p className="mb-2">{t(`profile.broody.${p.breeding.broody}`)}</p>
        <Val label={t('profile.incubation')} v={p.breeding.incubationDays} />
        <Val label={t('profile.eggsPerSitting')} v={p.breeding.eggsPerSitting} />
        <Bullets items={p.breeding.care} />
      </Section>

      <Section n={5} title={t('profile.health')}>
        <p className="mb-2 rounded-xl bg-warn-soft p-2 text-sm font-semibold text-warn">
          {t('sick.vetNote')}
        </p>
        <ul className="space-y-2">
          {p.health.problems.map((x) => (
            <li key={x.text.ar}>
              {lt(x.text)}
              <SourceNote item={x} />
            </li>
          ))}
        </ul>
        <p className="mb-1 mt-3 font-bold text-danger">{t('profile.dangerSigns')}</p>
        <Bullets items={p.health.dangerSigns} />
        {p.health.vaccinations.length > 0 && (
          <>
            <p className="mb-1 mt-3 font-bold">{t('profile.vaccines')}</p>
            <ul className="space-y-1">
              {p.health.vaccinations.map((v) => (
                <li key={v.id}>
                  {t('profile.vacDay', { n: num(v.day) })}: {lt(v.disease)}{' '}
                  <ConfidenceBadge confidence={v.confidence} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section n={6} title={t('profile.climate')}>
        {p.climate.bands.map((b) => (
          <div key={b.fromDay} className="border-b border-line py-2 last:border-0">
            <div className="font-bold">{t('profile.from', { from: ageText(b.fromDay) })}</div>
            <div className="num text-sm">
              {t('profile.comfortRange', {
                lo: num(b.comfortMin.value),
                hi: num(b.comfortMax.value),
              })}{' '}
              ·{' '}
              {t('profile.dangerRange', {
                lo: num(b.dangerLow.value),
                hi: num(b.dangerHigh.value),
              })}{' '}
              · {t('profile.rhMax', { n: num(b.rhMax.value) })}
            </div>
            <SourceNote item={b.comfortMin} />
          </div>
        ))}
      </Section>

      <Section n={7} title={t('profile.mixing')}>
        {p.mixing.okWith.length > 0 && (
          <p className="mb-2">
            {t('profile.okWith', { kinds: p.mixing.okWith.map((k) => t(`kind.${k}`)).join('، ') })}
          </p>
        )}
        <ul className="space-y-2">
          {p.mixing.avoid.map((m) => (
            <li key={m.kind + m.reason.ar}>
              <span className="font-bold text-danger">
                {t('profile.avoid', { kind: t(`kind.${m.kind}`) })}
              </span>{' '}
              {lt(m.reason)}
              <SourceNote item={m} />
            </li>
          ))}
        </ul>
      </Section>

      <Section n={8} title={t('profile.expected')}>
        <Val label={t('profile.adultWeight')} v={p.expected.adultWeightKg} digits={1} />
        <Val label={t('profile.eggsYear')} v={p.expected.eggsPerYear} />
        <Val label={t('profile.eggWeight')} v={p.expected.eggWeightG} />
        <Val label={t('profile.feedToMarket')} v={p.expected.feedToMarketKg} digits={1} />
        <Val label={t('profile.squabs')} v={p.expected.squabsPerPairYear} />
        {p.expected.bodyWeight && (
          <p className="mt-2 text-sm">
            {t('profile.weightAt', {
              age: ageText(p.expected.bodyWeight.points.at(-1)!.day),
              g: num(p.expected.bodyWeight.points.at(-1)!.value),
            })}
          </p>
        )}
      </Section>
    </Page>
  )
}
