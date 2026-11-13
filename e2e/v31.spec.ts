import { expect, test, type Page } from '@playwright/test'
import { mockWeather } from './fixtures'

async function onboard(page: Page) {
  await page.goto('/')
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

test('v3.1: more reminders, the care schedule and the medicine withdrawal countdown', async ({
  page,
}) => {
  await mockWeather(page)
  await onboard(page)

  // Home shows the next reminder.
  await expect(page.getByText('التذكير الجاي')).toBeVisible()

  // Reminders: the new check reminders are there with their sourced tips, and a switch is saved.
  await page.goto('/#/reminders')
  for (const name of ['بص على الحرارة', 'تابع نشاط الطيور', 'لمّ البيض', 'شيّك على الفرشة']) {
    await expect(page.getByRole('switch', { name })).toBeChecked()
  }
  await expect(page.getByText(/بصّة كل يوم: الحركة والأكل والشرب/)).toBeVisible()
  await expect(page.getByRole('switch', { name: /رسالة الصبح/ })).toBeChecked()
  await expect(page.getByRole('switch', { name: /تنبيه الحر والبرد/ })).toBeChecked()
  const before = await page.getByText(/تذكير في اليوم/).textContent()
  await page.getByRole('switch', { name: 'شيّك على الفرشة' }).uncheck()
  await expect(page.getByText(/تذكير في اليوم/)).not.toHaveText(before!)
  await page.reload()
  await expect(page.getByRole('switch', { name: 'شيّك على الفرشة' })).not.toBeChecked()
  await expect(page.getByRole('switch', { name: 'بص على الحرارة' })).toBeChecked()

  // Care schedule opens.
  await page.goto('/#/schedule')
  await expect(page.getByRole('heading', { name: 'جدول الرعاية' })).toBeVisible()

  // Medicines: validation, then a countdown that also shows on home.
  await page.goto('/#/treatments')
  await page.getByRole('button', { name: 'احفظ وابدأ العد' }).click()
  await expect(page.getByRole('alert')).toContainText('اكتب اسم الدوا')
  await page.getByLabel('اسم الدوا').fill('مضاد حيوي تجربة')
  await page.getByRole('button', { name: 'احفظ وابدأ العد' }).click()
  await expect(page.getByRole('alert')).toContainText('عدد أيام السحب')
  await page.getByLabel('أيام سحب البيض').fill('٧')
  await page.getByRole('button', { name: 'احفظ وابدأ العد' }).click()
  await expect(page.getByRole('heading', { name: 'مضاد حيوي تجربة' })).toBeVisible()
  await expect(page.getByText('لسه في فترة السحب')).toBeVisible()
  await expect(page.getByText(/ما تاكلش البيض ولا تبيعه — فاضل ٧ يوم/)).toBeVisible()

  await page.goto('/')
  await expect(page.getByText('فترة سحب دوا شغالة: مضاد حيوي تجربة')).toBeVisible()

  // The end of the withdrawal period is on the care schedule.
  await page.goto('/#/schedule')
  await expect(page.getByText('خلصت فترة السحب — البيض بقى ينفع يتاكل')).toBeVisible()

  // Deleting it clears the countdown.
  await page.goto('/#/treatments')
  await page.getByRole('button', { name: 'امسح مضاد حيوي تجربة' }).click()
  await page.getByRole('button', { name: 'امسح', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'مضاد حيوي تجربة' })).toHaveCount(0)
})
