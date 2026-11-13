import { useEffect, useMemo, useState } from 'react'
import type { Flock } from '../../db'
import { db } from '../../db'
import { getKinds, useGroups } from '../../db/birds'
import { getProfile } from '../../data/birds'
import type { BirdProfile } from '../../data/schema'
import { RULES } from '../../data/rules'
import { WEATHER, ALERT_ADVICE } from '../../data/weather'
import { ageOn, todayISO } from '../../calc/dates'
import {
  buildAlerts,
  capAlerts,
  comfortFor,
  currentReading,
  type GroupCtx,
  type Reading,
  type WeatherAlert,
} from '../../calc/weather'
import type { RoutineWeather } from '../../calc/routine'
import {
  getAlertPrefs,
  markShown,
  shownToday,
  useAlertPrefs,
  useForecast,
  useManualReading,
  type AlertPrefs,
} from '../../store/weather'
import type { Forecast } from '../../platform/weather'
import { notifications } from '../../platform'
import { lt } from '../../i18n'

export interface Group extends GroupCtx {
  flock: Flock
}

/** Local time as YYYY-MM-DDTHH:mm. */
export function localIso(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function toGroups(flocks: Flock[], today = todayISO()): Group[] {
  return flocks
    .map((f) => ({ f, p: getProfile(f.profileId) }))
    .filter((x): x is { f: Flock; p: BirdProfile } => !!x.p)
    .map(({ f, p }) => ({
      id: f.id,
      profile: p,
      age: Math.max(0, ageOn(f.placementDate, today)),
      place: f.place,
      flock: f,
    }))
}

/** Today's extremes from the hourly forecast (for the routine). */
export function todayExtremes(f: Forecast | null | undefined, today = todayISO()): RoutineWeather {
  const hrs = f?.hourly.filter((h) => h.time.startsWith(today)) ?? []
  if (!f || hrs.length === 0) return {}
  const hottest = hrs.reduce((a, b) => (b.tempC > a.tempC ? b : a))
  return {
    maxC: hottest.tempC,
    maxRad: hottest.radWm2,
    minC: Math.min(...hrs.map((h) => h.tempC)),
    rhNow: f.current.rh,
  }
}

export function alertsFor(
  f: Forecast | null | undefined,
  groups: GroupCtx[],
  now = new Date(),
): WeatherAlert[] {
  if (!f) return []
  return buildAlerts(f.hourly, groups, localIso(now), WEATHER, RULES.alertWindowHours, {
    gustKmh: RULES.windGustKmh,
    rainProbPct: RULES.rainProbabilityPct,
  })
}

export interface WeatherView {
  forecast: Forecast | null
  groups: Group[]
  /** Reading at each group's place (manual thermometer wins). */
  readings: Map<number, Reading>
  comfort: Map<number, ReturnType<typeof comfortFor>>
  alerts: WeatherAlert[]
  prefs: AlertPrefs
  manual: boolean
}

/** Everything the weather bar, home alerts and weather screen need. */
export function useWeatherView(): WeatherView | undefined {
  const forecast = useForecast()
  const manual = useManualReading()
  const flocks = useGroups()
  const prefs = useAlertPrefs()
  const today = todayISO()
  const [shown, setShown] = useState<string[] | null>(null)
  useEffect(() => {
    void shownToday(today).then(setShown)
  }, [today, forecast])

  return useMemo(() => {
    if (
      forecast === undefined ||
      manual === undefined ||
      flocks === undefined ||
      prefs === undefined ||
      shown === null
    )
      return undefined
    const groups = toGroups(flocks, today)
    const readings = new Map<number, Reading>()
    const comfort = new Map<number, ReturnType<typeof comfortFor>>()
    for (const g of groups) {
      const r = currentReading(forecast, manual, g.place, WEATHER)
      if (!r) continue
      readings.set(g.id, r)
      comfort.set(g.id, comfortFor(g.profile, g.age, r))
    }
    const alerts = capAlerts(alertsFor(forecast, groups), prefs, shown, RULES.maxAlertsPerDay)
    return { forecast, groups, readings, comfort, alerts, prefs, manual: !!manual }
  }, [forecast, manual, flocks, prefs, shown, today])
}

/**
 * Computes today's alerts, records them against the daily cap and shows a local
 * notification for each new one. Called on app open and after every weather refresh.
 */
export async function runWeatherAlerts(): Promise<void> {
  const f = (await db.kv.get('weather-last'))?.value as Forecast | undefined
  if (!f) return
  const kinds = await getKinds()
  const flocks = (await db.flocks.where('status').equals('active').toArray()).filter((x) =>
    kinds.includes(x.kind),
  )
  const today = todayISO()
  const prefs = await getAlertPrefs()
  const shown = await shownToday(today)
  const list = capAlerts(alertsFor(f, toGroups(flocks, today)), prefs, shown, RULES.maxAlertsPerDay)
  const fresh = list.filter((a) => !shown.includes(a.id))
  if (fresh.length === 0) return
  await markShown(
    today,
    fresh.map((a) => a.id),
  )
  for (const a of fresh) {
    const adv = ALERT_ADVICE[a.type]
    await notifications.show(
      lt(adv.title),
      adv.steps
        .slice(0, 2)
        .map((s, i) => `${i + 1}. ${lt(s)}`)
        .join('\n'),
      a.id,
    )
  }
}
