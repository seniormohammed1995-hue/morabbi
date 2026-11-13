import { expect, test } from '@playwright/test'
import { mockWeather } from './fixtures'

test('new user picks chickens and pigeons, then sees the routine and the weather bar', async ({
  page,
}) => {
  await mockWeather(page, { tempC: 24, rh: 50 })
  await page.goto('/')

  await page.getByRole('button', { name: 'يلا نبدأ' }).click()
  await expect(page.getByRole('heading', { name: 'عندك طيور إيه؟' })).toBeVisible()
  await page.getByRole('button', { name: 'فراخ', exact: true }).click()
  await page.getByRole('button', { name: 'حمام', exact: true }).click()
  // Chickens and pigeons should not share a space: warned, not blocked.
  await expect(page.getByText('خلي بالك: فراخ وحمام مع بعض')).toBeVisible()
  await page.getByRole('button', { name: 'التالي' }).click()

  // Answer "مش عارف" on every per-kind step.
  await expect(page.getByRole('heading', { name: 'نوع الفراخ إيه؟' })).toBeVisible()
  const placeHeading = page.getByRole('heading', { name: 'الطيور قاعدة فين؟' })
  for (let i = 0; i < 6 && !(await placeHeading.isVisible()); i++) {
    await page.getByRole('button', { name: 'مش عارف' }).click()
  }
  await expect(placeHeading).toBeVisible()
  await page.getByRole('radio', { name: /سطح مظلّل/ }).click()
  await page.getByRole('button', { name: 'التالي' }).click()

  await expect(page.getByRole('heading', { name: 'إنت فين؟' })).toBeVisible()
  await page.locator('#loc-gov').selectOption('dakahlia')
  await expect(page.getByText('الموقع: الدقهلية')).toBeVisible()
  await page.getByRole('button', { name: 'خلصنا، وريني النهارده' }).click()

  // Home: routine, and a weather bar with one comfort light per kind.
  await expect(page.getByRole('heading', { name: 'النهارده عند طيورك' })).toBeVisible()
  await expect(page.getByText('روتين النهارده')).toBeVisible()
  const water = page.getByRole('checkbox', { name: 'غيّر المية بمية نضيفة' })
  await expect(water).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'اديهم الأكل' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'تفاصيل الجو' })).toContainText('٢٤°')
  await expect(page.getByRole('img', { name: /^فراخ: / })).toBeVisible()
  await expect(page.getByRole('img', { name: /^حمام: / })).toBeVisible()
  await expect(page.getByRole('button', { name: /Open-Meteo/ })).toBeVisible()

  // Ticking a task survives a reload.
  await water.click()
  await expect(water).toHaveAttribute('aria-checked', 'true')
  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'غيّر المية بمية نضيفة' })).toHaveAttribute(
    'aria-checked',
    'true',
  )

  // The sick-bird button is always there; brand-new users don't get "what's new".
  await expect(page.getByRole('link', { name: 'طائر عيان دلوقتي' }).last()).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
