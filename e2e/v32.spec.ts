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

test('v3.2: kitchen mixes with sourced doses, the market, and no Gmail button without a client id', async ({
  page,
}) => {
  // Keep sheet traffic out of the test.
  await page.route('https://script.google.com/**', (r) => r.fulfill({ json: { ok: true } }))
  await mockWeather(page)
  await onboard(page)

  // Kitchen mixes: doses in grams, the vet warning, and the honest "what people say" list.
  await page.goto('/#/nutrition?tab=kitchen')
  await expect(page.getByRole('heading', { name: 'خميرة في العلف' })).toBeVisible()
  await expect(page.getByText('جم لكل كيلو علف').first()).toBeVisible()
  await expect(page.getByText(/كلّم البيطري فوراً/)).toBeVisible()
  await expect(page.getByRole('heading', { name: /الشيح المغلي/ })).toBeVisible()
  await expect(page.getByText(/محتاج دوا كوكسيديا من البيطري/)).toBeVisible()

  // Market: no product has a link yet, so only the VIP card shows — never an empty button.
  await page.goto('/#/market')
  await expect(page.getByRole('heading', { name: 'سوق طيور في بيتي' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'اطلب المتابعة الخاصة' })).toBeVisible()
  await expect(page.getByRole('button', { name: /اطلب أونلاين/ })).toHaveCount(0)

  // Gmail sign-in stays hidden until googleClientId is set.
  await page.goto('/#/join')
  await expect(page.getByRole('heading', { name: 'عرّفنا بيك' })).toBeVisible()
  await expect(page.getByText('ادخل بحساب Gmail بضغطة')).toHaveCount(0)
})
