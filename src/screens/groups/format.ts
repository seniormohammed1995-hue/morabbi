import { t } from '../../i18n'
import { num } from '../../i18n/format'

/** Friendly age: days for the first 2 weeks, then weeks, then months, then years. */
export function ageText(days: number): string {
  if (days <= 0) return t('age.dayOne')
  if (days < 14) return t('age.days', { n: num(days) })
  if (days < 70) return t('age.weeks', { n: num(Math.round(days / 7)) })
  if (days < 730) return t('age.months', { n: num(Math.round(days / 30.4)) })
  return t('age.years', { n: num(Math.round((days / 365) * 10) / 10, 1) })
}
