import { expect, test, type Page } from '@playwright/test'
import { mockWeather } from './fixtures'

/** Records window.open calls instead of opening WhatsApp. */
async function captureOpen(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __opened: string[] }
    w.__opened = []
    window.open = (url?: string | URL) => {
      w.__opened.push(String(url))
      return null
    }
  })
}
const opened = (page: Page) =>
  page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)

async function onboard(page: Page, name: string) {
  await page.goto('/')
  await page.getByLabel('اسمك إيه؟ (اختياري)').fill(name)
  await page.getByLabel('رقم موبايلك (اختياري)').fill('٠١٠١٢٣٤٥٦٧٨')
  await page.getByRole('button', { name: 'يلا نبدأ' }).click()
  await page.getByRole('button', { name: 'فراخ', exact: true }).click()
  await page.getByRole('button', { name: 'التالي' }).click()
  const placeHeading = page.getByRole('heading', { name: 'الطيور قاعدة فين؟' })
  for (let i = 0; i < 6 && !(await placeHeading.isVisible()); i++) {
    await page.getByRole('button', { name: 'مش عارف' }).click()
  }
  await page.getByRole('button', { name: 'التالي' }).click()
  await page.locator('#loc-gov').selectOption('giza')
  await page.getByRole('button', { name: 'خلصنا، وريني النهارده' }).click()
  await expect(page.getByRole('heading', { name: 'النهارده عند طيورك' })).toBeVisible()
}

test('v3: sign-up, contact box, journal, reminders and the scraps guide', async ({ page }) => {
  await mockWeather(page, { tempC: 26, rh: 50 })
  await captureOpen(page)

  // A bad phone is caught on the welcome screen.
  await page.goto('/')
  await page.getByLabel('رقم موبايلك (اختياري)').fill('123')
  await page.getByRole('button', { name: 'يلا نبدأ' }).click()
  await expect(page.getByRole('alert')).toContainText('الرقم مش مظبوط')

  await onboard(page, 'أم أحمد')

  // Signed up during onboarding: no "sign up" card; the contact banner is on home.
  await expect(page.getByText('عرّفنا بيك في ثواني')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'صوتك يهمنا' })).toBeVisible()

  // Settings shows the saved profile with the governorate from the location step.
  await page.goto('/#/settings')
  await expect(page.getByText('أهلاً يا أم أحمد')).toBeVisible()
  await expect(page.getByText('الجيزة').first()).toBeVisible()

  // Contact box: with no sheet configured the message goes through WhatsApp.
  await page.goto('/#/contact')
  await page.getByRole('radio', { name: 'اقتراح تطوير' }).click()
  await expect(page.getByLabel('رقمك علشان نرد عليك (اختياري)')).toHaveValue('01012345678')
  await page.getByRole('button', { name: 'ابعت على واتساب' }).click()
  await expect(page.getByRole('alert')).toContainText('اكتب رسالتك')
  await page.getByLabel('رسالتك').fill('عايز حاسبة للأرانب كمان')
  await page.getByRole('button', { name: 'ابعت على واتساب' }).click()
  await expect(page.getByText('شكراً ليك!')).toBeVisible()
  const urls = await opened(page)
  expect(urls).toHaveLength(1)
  const text = decodeURIComponent(urls[0]!.split('text=')[1]!)
  expect(text).toContain('اقتراح تطوير')
  expect(text).toContain('عايز حاسبة للأرانب كمان')
  expect(text).toContain('أم أحمد')

  // Journal: an entry survives a reload.
  await page.goto('/#/journal')
  await page.getByRole('radio', { name: 'بيض' }).click()
  await page.getByLabel('اكتب أخبار النهارده').fill('جمعت ١٢ بيضة')
  await page.getByRole('button', { name: 'سجّل' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'جمعت ١٢ بيضة' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('جمعت ١٢ بيضة')).toBeVisible()

  // Reminders: switching one off is saved.
  await page.goto('/#/reminders')
  await expect(page.getByText(/تذكير في اليوم/)).toBeVisible()
  const news = page.getByRole('switch', { name: /تذكير أخبار القطيع/ })
  await expect(news).toBeChecked()
  await news.uncheck()
  await page.reload()
  await expect(page.getByRole('switch', { name: /تذكير أخبار القطيع/ })).not.toBeChecked()

  // Nutrition: the household-scraps guide with its indicative share and sourced rule.
  await page.goto('/#/nutrition?tab=economy')
  await expect(page.getByRole('heading', { name: 'التغذية الاقتصادية وبواقي أكل البيت' })).toBeVisible()
  await expect(page.getByText('رز مطبوخ')).toBeVisible()
  await expect(page.getByText(/٢٥ لـ ٣٠٪/)).toBeVisible()
  await expect(page.getByText(/20 دقيقة/).first()).toBeVisible()

  // Floating WhatsApp button opens the contact menu.
  await page.goto('/')
  await page.getByRole('button', { name: 'تواصل مع المطوّر' }).click()
  await expect(page.getByRole('dialog', { name: 'تواصل مع المطوّر' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ابعت رأيك في تعليق سريع على واتساب' })).toBeVisible()
})

test('v3: skipping the name shows the sign-up card, and the about page names the developer', async ({
  page,
}) => {
  await mockWeather(page)
  await onboard(page, '')
  await expect(page.getByText('عرّفنا بيك في ثواني')).toBeVisible()
  await page.getByRole('button', { name: 'سجّل' }).click()
  await page.getByRole('button', { name: 'حفظ' }).click()
  await expect(page.getByText('اكتب اسمك (حرفين على الأقل)')).toBeVisible()

  await page.goto('/#/about')
  await expect(page.getByRole('heading', { name: 'محمد علي' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'جيت هاب' })).toHaveAttribute(
    'href',
    'https://github.com/seniormohammed1995-hue',
  )
  await expect(page.getByRole('heading', { name: 'حمّل نسخة الأندرويد (APK) مجاناً' })).toBeVisible()
})
