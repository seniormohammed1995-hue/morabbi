import { Link, useNavigate } from 'react-router-dom'
import { useFlocks } from '../db/hooks'
import { createDemoFlock } from '../db/repo'
import { getSpecies } from '../data'
import { ageOn, todayISO } from '../calc/dates'
import { t, lt } from '../i18n'
import { num } from '../i18n/format'
import { Icon } from '../ui/Icon'
import { Badge, Button, EmptyState, Page, PageHeader, SectionTitle } from '../ui/kit'
import type { Flock } from '../db'
import { useUi } from '../store/ui'

export default function FlocksScreen() {
  const flocks = useFlocks()
  const nav = useNavigate()
  const select = useUi((s) => s.selectFlock)
  const active = flocks?.filter((f) => f.status === 'active') ?? []
  const closed = flocks?.filter((f) => f.status === 'closed') ?? []
  const hasDemo = flocks?.some((f) => f.isDemo) ?? false

  return (
    <Page>
      <PageHeader
        title={t('flocks.title')}
        action={
          <Button icon="plus" onClick={() => nav('/flocks/new')} className="min-h-10 px-3 text-sm">
            {t('flocks.new')}
          </Button>
        }
      />
      {flocks && flocks.length === 0 && (
        <EmptyState title={t('flocks.empty')}>
          <Button icon="plus" full onClick={() => nav('/flocks/new')}>
            {t('flocks.new')}
          </Button>
        </EmptyState>
      )}
      {active.length > 0 && <SectionTitle>{t('flocks.active')}</SectionTitle>}
      <div className="space-y-2">
        {active.map((f) => (
          <FlockRow key={f.id} f={f} />
        ))}
      </div>
      {closed.length > 0 && <SectionTitle>{t('flocks.closed')}</SectionTitle>}
      <div className="space-y-2">
        {closed.map((f) => (
          <FlockRow key={f.id} f={f} />
        ))}
      </div>
      {flocks && !hasDemo && (
        <Button
          variant="ghost"
          full
          className="mt-6"
          onClick={async () => {
            const id = await createDemoFlock()
            select(id)
            nav(`/flocks/${id}`)
          }}
        >
          {t('flocks.demoCreate')}
        </Button>
      )}
    </Page>
  )
}

function FlockRow({ f }: { f: Flock }) {
  const sp = getSpecies(f.speciesId)
  const age = ageOn(f.placementDate, todayISO())
  return (
    <Link to={`/flocks/${f.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm active:bg-surface-2">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-primary">
        <Icon name="flock" size={26} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-bold">{f.name}</span>
          {f.isDemo && <Badge tone="primary">{t('common.demo')}</Badge>}
        </span>
        <span className="block text-sm text-muted">
          {sp ? lt(sp.data.name) : f.speciesId} · {num(f.initialCount)} {t('common.birds')} ·{' '}
          {age < 0 ? t('home.beforeArrival', { n: num(-age) }) : t('common.ageDays', { n: num(age) })}
        </span>
      </span>
      <Icon name="chevron" className="text-muted" />
    </Link>
  )
}
