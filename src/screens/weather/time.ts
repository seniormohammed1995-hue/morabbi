import { t } from '../../i18n'
import { num } from '../../i18n/format'
import { addDays, todayISO } from '../../calc/dates'

/** "النهارده ٢ الضهر" style label for a local ISO hour. */
export function hourLabel(iso: string, today = todayISO()): string {
  const date = iso.slice(0, 10)
  const h = Number(iso.slice(11, 13))
  const day =
    date === today
      ? t('common.today')
      : date === addDays(today, 1)
        ? t('common.tomorrow')
        : t('wx.afterTomorrow')
  return `${day} ${clock(h)}`
}

/** 12-hour clock with an Egyptian part-of-day word. */
export function clock(h: number): string {
  const n = h % 12 === 0 ? 12 : h % 12
  const part =
    h < 5
      ? t('wx.part.night')
      : h < 12
        ? t('wx.part.morning')
        : h < 15
          ? t('wx.part.noon')
          : h < 18
            ? t('wx.part.afternoon')
            : t('wx.part.evening')
  return `${num(n)} ${part}`
}
