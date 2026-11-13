import { test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mockCloud, mockWeather } from '../e2e/fixtures'

const OUT = 'store/graphics'

/** A typical rooftop keeper: baladi chickens laying, a new batch of chicks, ducks and pigeons. */
async function seed(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    const { db } = await import('/src/db/index.ts')
    const { createGroup, setKinds, onboarding } = await import('/src/db/birds.ts')
    const { setLocation } = await import('/src/store/weather.ts')
    const { GOVERNORATES } = await import('/src/data/rules.ts')
    const { addTreatment } = await import('/src/db/treatments.ts')
    const { addDays, todayISO } = await import('/src/calc/dates.ts')
    const giza = GOVERNORATES.find((g) => g.id === 'giza')!
    await setKinds(['chicken', 'duck', 'pigeon'])
    await setLocation({
      lat: giza.lat,
      lon: giza.lon,
      label: giza.name,
      mode: 'governorate',
      governorate: 'giza',
    })
    const chicks = await createGroup({
      profileId: 'chicken-baladi',
      purpose: 'dual',
      count: 25,
      ageDays: 6,
      place: 'room',
      name: 'كتاكيت بلدي',
    })
    await createGroup({
      profileId: 'chicken-baladi',
      purpose: 'eggs',
      count: 12,
      ageDays: 240,
      place: 'roof-shaded',
      name: 'فراخ البيض',
    })
    await createGroup({
      profileId: 'duck-muscovy',
      purpose: 'meat',
      count: 8,
      ageDays: 20,
      place: 'roof-shaded',
      name: 'بط مسكوفي',
    })
    await createGroup({
      profileId: 'pigeon-baladi',
      purpose: 'breeding',
      count: 6,
      ageDays: 300,
      place: 'roof-open',
      name: 'غية الحمام',
    })
    await addTreatment({
      name: 'مضاد حيوي (حسب البيطري)',
      lastDose: addDays(todayISO(), -2),
      eggDays: 7,
      flockId: chicks,
    })
    await db.kv.put({
      key: 'profile',
      value: {
        clientId: 'shots',
        name: 'أم محمد',
        phone: '',
        governorate: 'giza',
        kinds: ['chicken', 'duck', 'pigeon'],
        createdAt: 1,
      },
    })
    onboarding.finish()
    localStorage.setItem('morabbi-seen-release', '3.2')
  })
}

async function shot(page: Page, route: string, name: string, scrollTo?: string) {
  await page.goto(route)
  await page.waitForTimeout(900)
  if (scrollTo) {
    await page
      .getByText(scrollTo)
      .first()
      .evaluate((e) => e.scrollIntoView({ block: 'start' }))
    await page.evaluate(() => window.scrollBy(0, -40))
    await page.waitForTimeout(300)
  }
  // Floating buttons cover content in a still image.
  await page.addStyleTag({ content: '.no-print.fixed.rounded-full { display: none !important; }' })
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

test.describe('phone screenshots', () => {
  test.use({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })

  test('screens', async ({ page }) => {
    await mockWeather(page, { tempC: 34, rh: 55 })
    await mockCloud(page)
    await seed(page)
    await shot(page, '/', '1-home')
    await shot(page, '/', '2-next', 'التذكير الجاي')
    await shot(page, '/#/reminders', '3-reminders')
    await shot(page, '/#/schedule', '4-schedule')
    await shot(page, '/#/weather', '5-weather')
    await shot(page, '/#/treatments', '6-treatments')
    await shot(page, '/#/nutrition?tab=economy', '7-nutrition')
    await shot(page, '/#/sick', '8-sick')
  })
})

test.describe('feature graphic', () => {
  test.use({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 })

  test('1024x500', async ({ page }) => {
    const icon = readFileSync('public/icons/maskable-512.png').toString('base64')
    await page.goto('/')
    await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @import url('/node_modules/@fontsource/cairo/arabic-800.css');
  @import url('/node_modules/@fontsource/cairo/arabic-600.css');
  html,body{margin:0;width:1024px;height:500px;overflow:hidden}
  body{font-family:Cairo,sans-serif;background:linear-gradient(135deg,#B4532A 0%,#D9733F 60%,#E9A15B 100%);color:#fff;display:flex;align-items:center;gap:48px;padding:0 72px;box-sizing:border-box}
  img{width:220px;height:220px;border-radius:48px;box-shadow:0 18px 40px rgba(0,0,0,.25)}
  h1{font-size:76px;font-weight:800;margin:0;line-height:1.15}
  p{font-size:31px;font-weight:600;margin:14px 0 0;line-height:1.5;opacity:.95}
</style></head><body>
<img src="data:image/png;base64,${icon}" alt="">
<div><h1>طيور في بيتي</h1><p>تذكير المية والأكل، تنبيه الحر والبرد،<br>وجدول رعاية لطيورك حسب عمرها</p></div>
</body></html>`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${OUT}/feature-graphic.png` })
  })
})
