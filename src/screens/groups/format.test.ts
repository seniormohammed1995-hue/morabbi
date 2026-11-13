import { describe, expect, it } from 'vitest'
import { ageText } from './format'

describe('ageText', () => {
  it('switches units with age', () => {
    expect(ageText(0)).toBe('عمر يوم')
    expect(ageText(5)).toContain('٥')
    expect(ageText(21)).toContain('أسابيع')
    expect(ageText(180)).toContain('شهور')
    expect(ageText(800)).toContain('سنة')
  })
})
