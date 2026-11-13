import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFlockView } from '../db/hooks'
import { deleteFlock, deleteLog, logsToCsv, updateFlock } from '../db/repo'
import { files } from '../platform'
import { useUi } from '../store/ui'
import { t, lt } from '../i18n'
import { dateShort, num, pct } from '../i18n/format'
import { LineChart } from '../ui/LineChart'
import { Icon } from '../ui/Icon'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Page, PageHeader, Stat, Tabs, Why, toast } from '../ui/kit'
import { AlertList, KeyValue, LinkCard } from './parts'
import { GOVERNORATES, RULES } from '../data/rules'
import type { DailyLog } from '../db'

type Tab = 'overview' | 'logs'

export default function FlockDetail() {
  const { id } = useParams()
  const flockId = Number(id)
  const view = useFlockView(flockId)
  const nav = useNavigate()
  const select = useUi((s) => s.selectFlock)
  const [tab, setTab] = useState<Tab>('overview')
  const [confirm, setConfirm] = useState<null | 'delete' | 'close' | { log: DailyLog }>(null)

  if (view === undefined) return null
  if (view === null)
    return (
      <Page>
        <PageHeader title={t('err.flockNotFound')} back />
      </Page>
    )

  const { flock, species, metrics, age, logs } = view
  const sp = species.data
  const weightPts = metrics.series.filter((s) => s.weightG !== undefined)
  const maxDay = Math.max(age, ...metrics.series.map((s) => s.day), 7)
  const stdWeight = sp.growth.bodyWeight.points.filter((p) => p.day <= maxDay).map((p) => ({ x: p.day, y: p.value }))
  const feedPts = metrics.series.filter((s) => s.feedG !== undefined)
  const gov = GOVERNORATES.find((g) => g.id === flock.governorate)?.name ?? flock.governorate

  return (
    <Page>
      <PageHeader
        title={flock.name}
        subtitle={`${lt(sp.name)} · ${age < 0 ? t('home.beforeArrival', { n: num(-age) }) : t('common.ageDays', { n: num(age) })}`}
        back
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: t('flock.overview') },
          { value: 'logs', label: `${t('flock.logs')} (${num(logs.length)})` },
        ]}
      />

      {tab === 'overview' && (
        <div className="space-y-4">
          <AlertList alerts={metrics.alerts} />
          <div className="grid grid-cols-2 gap-2">
            <Stat icon="flock" label={t('flock.alive')} value={num(metrics.alive)} hint={`${t('common.of')} ${num(flock.initialCount)}`} />
            <Stat
              icon="alert"
              label={t('flock.mortalityPct')}
              value={pct(metrics.mortalityPct)}
              hint={`${num(metrics.deaths)} ${t('log.deaths')}`}
            />
            <Stat
              icon="scale"
              label={t('flock.avgWeight')}
              value={metrics.avgWeightG !== undefined ? num(metrics.avgWeightG) : '—'}
              unit={metrics.avgWeightG !== undefined ? t('common.g') : undefined}
              hint={metrics.weightAge !== undefined ? t('common.ageDays', { n: num(metrics.weightAge) }) : undefined}
              tone={
                metrics.weightDeviationPct === undefined ? undefined : Math.abs(metrics.weightDeviationPct) > RULES.deviation.weightPct ? 'warn' : 'ok'
              }
            />
            <Stat icon="chart" label={t('flock.fcr')} value={metrics.fcr !== undefined ? num(metrics.fcr, 2) : '—'} />
            <Stat icon="feed" label={t('flock.feedTotal')} value={num(metrics.feedTotalKg)} unit={t('common.kg')} />
            <Stat icon="feed" label={t('flock.feedPerBird')} value={num(metrics.feedPerBirdKg, 2)} unit={t('common.kg')} />
          </div>
          <Why>{t('flock.fcr.why')}</Why>
          {metrics.avgWeightG === undefined && <p className="text-sm text-muted">{t('flock.noWeight')}</p>}

          {(weightPts.length > 0 || age > 0) && (
            <Card>
              <h3 className="mb-2 font-bold">{t('flock.chartWeight')}</h3>
              <LineChart
                ariaLabel={t('flock.chartWeight')}
                yUnit={t('common.g')}
                xLabel={t('common.age')}
                series={[
                  { label: t('common.standard'), points: stdWeight, color: 'var(--c-muted)', dashed: true },
                  {
                    label: t('common.actual'),
                    points: weightPts.map((s) => ({ x: s.day, y: s.weightG! })),
                    color: 'var(--c-primary)',
                    dots: true,
                  },
                ]}
              />
            </Card>
          )}
          {feedPts.length > 1 && (
            <Card>
              <h3 className="mb-2 font-bold">{t('flock.chartFeed')}</h3>
              <LineChart
                ariaLabel={t('flock.chartFeed')}
                yUnit={t('common.g')}
                xLabel={t('common.age')}
                series={[
                  { label: t('common.standard'), points: feedPts.map((s) => ({ x: s.day, y: s.stdFeedG })), color: 'var(--c-muted)', dashed: true },
                  { label: t('common.actual'), points: feedPts.map((s) => ({ x: s.day, y: s.feedG! })), color: 'var(--c-leaf)' },
                ]}
              />
            </Card>
          )}

          <div className="grid gap-2">
            <LinkCard to={`/flocks/${flockId}/cycle`} icon="calendar" title={t('home.viewCycle')} />
            <LinkCard to={`/planner?flock=${flockId}`} icon="layout" title={t('flock.planner')} />
            <LinkCard to={`/feeds?flock=${flockId}`} icon="feed" title={t('nav.feeds')} />
            <LinkCard to={`/health?flock=${flockId}`} icon="syringe" title={t('health.title')} />
          </div>

          <Card>
            <h3 className="mb-1 font-bold">{t('flock.house')}</h3>
            <KeyValue k={t('wizard.place')} v={t(`wizard.house.${flock.houseType}`)} />
            <KeyValue k={t('wizard.dims')} v={`${num(flock.length, 1)} × ${num(flock.width, 1)} × ${num(flock.height, 1)}`} />
            <KeyValue k={t('wizard.governorate')} v={gov} />
            <KeyValue k={t('wizard.startDate')} v={dateShort(flock.placementDate)} />
          </Card>

          <div className="grid gap-2">
            <Button variant="secondary" icon="download" onClick={() => files.save(logsToCsv(flock, logs), `tuyuri-${flock.id}-logs.csv`)}>
              {t('flock.exportLogs')}
            </Button>
            {flock.status === 'active' ? (
              <Button variant="secondary" onClick={() => setConfirm('close')}>
                {t('flocks.close')}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => void updateFlock(flockId, { status: 'active' })}>
                {t('flocks.reopen')}
              </Button>
            )}
            <Button variant="danger" icon="trash" onClick={() => setConfirm('delete')}>
              {t('flocks.delete')}
            </Button>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-2">
          {age >= 0 && (
            <Button full icon="plus" onClick={() => nav(`/flocks/${flockId}/log?date=${view.today}`)}>
              {t('flock.addLog')}
            </Button>
          )}
          {logs.length === 0 && <EmptyState title={t('flock.noLogs')} icon="list" />}
          {[...logs].reverse().map((l) => (
            <div key={l.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3">
              <button type="button" className="min-w-0 flex-1 text-start" onClick={() => nav(`/flocks/${flockId}/log?date=${l.date}`)}>
                <div className="flex items-center gap-2 font-bold">
                  {dateShort(l.date)}
                  <Badge>{t('common.ageDays', { n: num(l.age) })}</Badge>
                  {l.photo && <Icon name="camera" size={16} className="text-muted" />}
                </div>
                <div className="num text-sm text-muted">
                  {t('log.deaths')}: {num(l.deaths)} · {t('target.feed')}: {num(l.feedKg, 1)} {t('common.kg')}
                  {l.sampleWeightG ? ` · ${t('target.weight')}: ${num(l.sampleWeightG)} ${t('common.g')}` : ''}
                </div>
                {l.notes && <div className="truncate text-sm">{l.notes}</div>}
              </button>
              <button
                type="button"
                aria-label={t('common.delete')}
                className="grid h-11 w-11 place-items-center rounded-full text-danger hover:bg-danger-soft"
                onClick={() => setConfirm({ log: l })}
              >
                <Icon name="trash" size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        danger={confirm !== 'close'}
        title={
          confirm === 'delete'
            ? t('flocks.delete')
            : confirm === 'close'
              ? t('flocks.close')
              : confirm
                ? t('log.deleteConfirm', { date: dateShort(confirm.log.date) })
                : ''
        }
        body={confirm === 'delete' ? t('flocks.deleteConfirm', { name: flock.name }) : confirm === 'close' ? t('flocks.closeConfirm') : undefined}
        confirmLabel={confirm === 'close' ? t('flocks.close') : t('common.delete')}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm === 'delete') {
            await deleteFlock(flockId)
            select(null)
            nav('/flocks', { replace: true })
          } else if (confirm === 'close') {
            await updateFlock(flockId, { status: 'closed', closedAt: Date.now() })
          } else if (confirm) {
            await deleteLog(confirm.log.id)
            toast(t('common.done'))
          }
          setConfirm(null)
        }}
      />
    </Page>
  )
}
