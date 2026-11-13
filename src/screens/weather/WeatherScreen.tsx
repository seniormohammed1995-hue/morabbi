import { useEffect, useState } from 'react'
import { WEATHER } from '../../data/weather'
import { climateAt } from '../../calc/birds'
import { comfort, feltTemp, type Comfort } from '../../calc/weather'
import { todayISO } from '../../calc/dates'
import {
  clearManualReading,
  refreshWeather,
  setManualReading,
  useLocation,
} from '../../store/weather'
import { network } from '../../platform/weather'
import { t } from '../../i18n'
import { dateLong, num } from '../../i18n/format'
import { BirdArt } from '../../ui/BirdArt'
import { Icon } from '../../ui/Icon'
import {
  Button,
  Card,
  cx,
  Field,
  NumberInput,
  Page,
  PageHeader,
  SectionTitle,
  SourceNote,
} from '../../ui/kit'
import { AlertCard } from './AlertCard'
import { LocationPicker } from './LocationPicker'
import { Attribution, COMFORT_CLS, since } from './WeatherBar'
import { useWeatherView, runWeatherAlerts } from './useWeather'
import { clock } from './time'

const ORDER: Comfort[] = ['green', 'yellow', 'red']

export default function WeatherScreen() {
  const view = useWeatherView()
  const loc = useLocation()
  const [editLoc, setEditLoc] = useState(false)
  const [busy, setBusy] = useState(false)
  const [manualT, setManualT] = useState<number | undefined>(undefined)
  const [manualRh, setManualRh] = useState<number | undefined>(undefined)

  useEffect(() => {
    void refreshWeather().then(() => runWeatherAlerts())
  }, [])

  const f = view?.forecast
  const groups = view?.groups ?? []
  const days = f ? [...new Set(f.hourly.map((h) => h.time.slice(0, 10)))].slice(0, 3) : []

  return (
    <Page>
      <PageHeader title={t('wx.title')} back />

      {loc === null || editLoc ? (
        <Card>
          <h2 className="mb-3 font-bold">{t('ob.location.title')}</h2>
          <LocationPicker onDone={() => setEditLoc(false)} />
          {loc && (
            <Button variant="ghost" className="mt-2" onClick={() => setEditLoc(false)}>
              {t('common.close')}
            </Button>
          )}
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <Icon name="pin" size={18} className="text-primary" />
          <span className="flex-1 font-semibold">{loc?.label}</span>
          <Button variant="ghost" className="min-h-10 px-2" onClick={() => setEditLoc(true)}>
            {t('loc.change')}
          </Button>
        </div>
      )}

      {f && (
        <Card className="mt-3">
          <div className="flex items-center gap-4">
            <div className="num text-5xl font-extrabold">{num(f.current.tempC)}°</div>
            <div className="text-sm">
              <div className="flex items-center gap-1">
                <Icon name="humidity" size={16} /> {t('wx.rh', { n: num(f.current.rh) })}
              </div>
              <div className="flex items-center gap-1">
                <Icon name="wind" size={16} /> {t('wx.wind', { n: num(f.current.windKmh) })}
              </div>
              <div
                className={cx(
                  Date.now() - f.fetchedAt > 3 * 3_600_000 && 'font-semibold text-warn',
                )}
              >
                {t('wx.updated', { when: since(f.fetchedAt) })}
              </div>
            </div>
          </div>
          {!network.online() && (
            <p className="mt-2 text-sm font-semibold text-warn">{t('wx.offline')}</p>
          )}
          <Button
            variant="secondary"
            icon="refresh"
            className="mt-3"
            disabled={busy || !network.online()}
            onClick={async () => {
              setBusy(true)
              await refreshWeather(true)
              await runWeatherAlerts()
              setBusy(false)
            }}
          >
            {t('wx.refresh')}
          </Button>
          <div>
            <Attribution />
          </div>
        </Card>
      )}
      {loc && !f && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">{t('wx.noData')}</p>}

      {groups.length > 0 && view && view.readings.size > 0 && (
        <>
          <SectionTitle icon="thermo">{t('wx.atBirds')}</SectionTitle>
          <ul className="space-y-2">
            {groups.map((g) => {
              const r = view.readings.get(g.id)
              const c = view.comfort.get(g.id)
              if (!r || !c) return null
              const band = climateAt(g.profile, g.age)
              return (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                >
                  <BirdArt kind={g.profile.kind} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{g.flock.name}</div>
                    <div className="text-xs text-muted">
                      {t(`place.${g.place}`)} ·{' '}
                      {t('wx.needs', {
                        lo: num(band.comfortMin.value),
                        hi: num(band.comfortMax.value),
                      })}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="num text-xl font-extrabold">{num(r.tempC)}°</div>
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        COMFORT_CLS[c.level],
                      )}
                    >
                      {t(`wx.comfort.${c.level}`)}
                      {c.why !== 'ok' ? ` · ${t(`wx.why.${c.why}`)}` : ''}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          {!view.manual && (
            <p className="mt-2 text-xs text-muted">
              {t('wx.estimateNote')}
              <SourceNote item={WEATHER.sunLoadPerWm2} />
            </p>
          )}
        </>
      )}

      <SectionTitle icon="thermo">{t('wx.manualTitle')}</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-muted">{t('wx.manualHint')}</p>
        {view?.manual ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-leaf">✓ {t('wx.manualOn')}</span>
            <Button variant="secondary" onClick={() => void clearManualReading()}>
              {t('wx.manualClear')}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('wx.manualTemp')} htmlFor="m-t">
                <NumberInput id="m-t" decimal value={manualT} onChange={setManualT} />
              </Field>
              <Field label={t('wx.manualRh')} htmlFor="m-rh">
                <NumberInput id="m-rh" value={manualRh} onChange={setManualRh} />
              </Field>
            </div>
            <Button
              full
              disabled={
                manualT === undefined ||
                manualT < -10 ||
                manualT > 55 ||
                (manualRh !== undefined && (manualRh < 1 || manualRh > 100))
              }
              onClick={async () => {
                await setManualReading(manualT!, manualRh)
                setManualT(undefined)
                setManualRh(undefined)
              }}
            >
              {t('common.save')}
            </Button>
          </>
        )}
      </Card>

      {view?.alerts.length ? (
        <>
          <SectionTitle icon="alert">{t('wx.alerts')}</SectionTitle>
          <div className="space-y-3">
            {view.alerts.map((a) => (
              <AlertCard key={a.id} alert={a} groups={groups} />
            ))}
          </div>
        </>
      ) : null}

      {f && groups.length > 0 && (
        <>
          <SectionTitle icon="calendar">{t('wx.forecast3')}</SectionTitle>
          <div className="mb-2 flex flex-wrap gap-3 text-xs">
            {ORDER.map((c) => (
              <span key={c} className="flex items-center gap-1">
                <span
                  className={cx('inline-block h-3 w-3 rounded-sm', COMFORT_CLS[c].split(' ')[0])}
                />{' '}
                {t(`wx.comfort.${c}`)}
              </span>
            ))}
          </div>
          <div className="space-y-4">
            {days.map((d) => {
              const hrs = f.hourly.filter((h) => h.time.startsWith(d))
              const temps = hrs.map((h) => h.tempC)
              return (
                <Card key={d}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="font-bold">
                      {d === todayISO() ? t('common.today') : dateLong(d)}
                    </h3>
                    <span className="num text-sm text-muted">
                      {t('wx.range', { lo: num(Math.min(...temps)), hi: num(Math.max(...temps)) })}
                    </span>
                  </div>
                  <div
                    className="flex gap-px overflow-hidden rounded-lg"
                    role="img"
                    aria-label={t('wx.timelineLabel')}
                  >
                    {hrs.map((h) => {
                      const worst = groups.reduce<Comfort>((acc, g) => {
                        const c = comfort(
                          climateAt(g.profile, g.age),
                          feltTemp(h.tempC, g.place, h.radWm2, WEATHER),
                          h.rh,
                        ).level
                        return ORDER.indexOf(c) > ORDER.indexOf(acc) ? c : acc
                      }, 'green')
                      return (
                        <div
                          key={h.time}
                          title={`${clock(Number(h.time.slice(11, 13)))} ${num(h.tempC)}°`}
                          className={cx('h-8 flex-1', COMFORT_CLS[worst].split(' ')[0])}
                        />
                      )
                    })}
                  </div>
                  <div className="mt-1 flex text-[10px] text-muted">
                    {hrs
                      .filter((_, i) => i % 6 === 0)
                      .map((h) => (
                        <div key={h.time} className="flex-1 text-start">
                          <div>{clock(Number(h.time.slice(11, 13)))}</div>
                          <div className="num font-bold text-ink">{num(h.tempC)}°</div>
                        </div>
                      ))}
                  </div>
                  {hrs.some((h) => (h.precipProb ?? 0) >= 50) && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold">
                      <Icon name="rain" size={14} />{' '}
                      {t('wx.rainChance', {
                        n: num(Math.max(...hrs.map((h) => h.precipProb ?? 0))),
                      })}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}
    </Page>
  )
}
