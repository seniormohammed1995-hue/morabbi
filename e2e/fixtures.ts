import type { Page } from '@playwright/test'

/** A 3-day hourly forecast shaped like Open-Meteo's response, starting at local midnight today. */
export function fakeForecast(opts: { tempC?: number; rh?: number } = {}) {
  const t0 = new Date()
  t0.setHours(0, 0, 0, 0)
  const p = (x: number) => String(x).padStart(2, '0')
  const iso = (d: Date) =>
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`
  const hours = Array.from({ length: 72 }, (_, i) => new Date(t0.getTime() + i * 3_600_000))
  const temp = opts.tempC ?? 24
  const day = (d: Date) => d.getHours() >= 6 && d.getHours() < 18
  return {
    current: {
      time: iso(new Date()),
      temperature_2m: temp,
      relative_humidity_2m: opts.rh ?? 50,
      wind_speed_10m: 8,
      wind_gusts_10m: 15,
      precipitation: 0,
      weather_code: 1,
      is_day: 1,
      shortwave_radiation: 300,
    },
    hourly: {
      time: hours.map(iso),
      temperature_2m: hours.map((d) => temp + (d.getHours() >= 11 && d.getHours() <= 16 ? 3 : -2)),
      relative_humidity_2m: hours.map(() => opts.rh ?? 50),
      wind_speed_10m: hours.map(() => 8),
      wind_gusts_10m: hours.map(() => 15),
      precipitation: hours.map(() => 0),
      precipitation_probability: hours.map(() => 0),
      weather_code: hours.map(() => 1),
      is_day: hours.map((d) => (day(d) ? 1 : 0)),
      shortwave_radiation: hours.map((d) => (day(d) ? 400 : 0)),
    },
  }
}

/** Serves a fixed forecast instead of calling Open-Meteo. */
export async function mockWeather(page: Page, opts?: { tempC?: number; rh?: number }) {
  await page.route('https://api.open-meteo.com/**', (r) => r.fulfill({ json: fakeForecast(opts) }))
  await page.route('https://geocoding-api.open-meteo.com/**', (r) =>
    r.fulfill({ json: { results: [] } }),
  )
  await mockCloud(page)
}

/**
 * Answers the Google Sheets web app locally so tests never write to the real sheet.
 * Returns the JSON bodies the app posted, in order.
 */
export async function mockCloud(page: Page) {
  const posts: { sheet: string; row: Record<string, unknown> }[] = []
  await page.route('https://script.google.com/**', async (r) => {
    const body = r.request().postData()
    if (body) posts.push(JSON.parse(body))
    await r.fulfill({ json: { ok: true } })
  })
  return posts
}
