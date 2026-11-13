import { useParams } from 'react-router-dom'
import { getSpecies } from '../data'
import { marketAgeDays, marketWeightKg } from '../calc/planner'
import { t, lt } from '../i18n'
import { num, range } from '../i18n/format'
import { Badge, Card, Page, PageHeader, SectionTitle, SourceNote } from '../ui/kit'
import { KeyValue } from './parts'

export default function SpeciesCard() {
  const { id } = useParams()
  const entry = getSpecies(id ?? '')
  if (!entry)
    return (
      <Page>
        <PageHeader title={t('err.notFound')} back />
      </Page>
    )
  const sp = entry.data
  return (
    <Page>
      <PageHeader title={lt(sp.name)} back />
      {sp.dataStatus === 'limited' && <Badge tone="warn">{t('common.limitedData')}</Badge>}
      <p className="mb-3">{lt(sp.description)}</p>
      <Card>
        <KeyValue k={t('library.marketAge')} v={`${range(sp.marketAge)} ${sp.marketAge.unit}`} />
        <KeyValue k={t('library.marketWeight')} v={`${num(marketWeightKg(sp), 2)} ${t('common.kg')} (${t('common.ageDays', { n: num(marketAgeDays(sp)) })})`} />
        <SourceNote item={sp.marketAge} />
      </Card>

      <SectionTitle icon="feed">{t('library.feedPhases')}</SectionTitle>
      <Card>
        <table className="num w-full text-center text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-1 text-start">{t('target.feed')}</th>
              <th>{t('common.age')}</th>
              <th>{t('library.protein')}</th>
              <th>{t('library.energy')}</th>
            </tr>
          </thead>
          <tbody>
            {sp.feed.phases.map((p) => (
              <tr key={p.id}>
                <td className="py-1 text-start font-bold">
                  {lt(p.name)} <span className="font-normal text-muted">({lt(p.form)})</span>
                </td>
                <td>
                  {num(p.fromDay)}–{num(Math.min(p.toDay, marketAgeDays(sp)))}
                </td>
                <td>{num(p.crudeProtein.value, 1)}٪</td>
                <td>{num(p.energy.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <SourceNote item={sp.feed.phases[0]!.crudeProtein} />
      </Card>

      <SectionTitle icon="syringe">{t('library.vaccines')}</SectionTitle>
      <Card tone="warn" className="mb-2 text-sm font-semibold">
        {t('vet.warning')}
      </Card>
      <Card>
        {sp.health.vaccinations.map((v) => (
          <div key={v.id} className="border-b border-line/60 py-2 last:border-0">
            <div className="flex justify-between gap-2 font-bold">
              <span>{lt(v.disease)}</span>
              <span className="num">{t('common.ageDays', { n: num(v.day) })}</span>
            </div>
            <div className="text-sm">
              {lt(v.vaccine)} — {t(`library.route.${v.route}`)}
            </div>
            {v.note && <div className="text-sm text-muted">{lt(v.note)}</div>}
            <SourceNote item={v} />
          </div>
        ))}
        <p className="mt-3 text-sm">{lt(sp.health.withdrawalNote)}</p>
      </Card>
    </Page>
  )
}
