import { describe, expect, it } from 'vitest'
import { amazon, AMAZON_TAG, MARKET_CATEGORIES, PRODUCTS, type MarketProduct } from '../data/affiliateProducts'
import { marketOpen, marketSections, orderText, visibleProducts } from './market'

const base: MarketProduct = {
  id: 'x',
  category: 'heat',
  name: { ar: 'فقاسة' },
  benefit: { ar: '…' },
  url: '',
  whatsapp: false,
  price: '',
  popular: false,
  art: 'incubator',
  tags: [],
  pick: false,
}

describe('market', () => {
  it('hides products with nothing to press', () => {
    const list = [base, { ...base, id: 'a', url: 'https://amzn.eg/x' }, { ...base, id: 'w', whatsapp: true }]
    expect(visibleProducts(list).map((p) => p.id)).toEqual(['a', 'w'])
  })
  it('groups by category in order and drops empty categories', () => {
    const list = [
      { ...base, id: 'v', category: 'supplements' as const, url: 'u' },
      { ...base, id: 'h', category: 'heat' as const, url: 'u' },
    ]
    expect(marketSections(MARKET_CATEGORIES, list).map((s) => s.category.id)).toEqual(['heat', 'supplements'])
  })
  it('stays closed until there is a product or a VIP card that can be ordered', () => {
    expect(marketOpen([base], false, true)).toBe(false)
    expect(marketOpen([base], true, true)).toBe(true)
    expect(marketOpen([base], true, false)).toBe(false)
    expect(marketOpen([{ ...base, whatsapp: true }], false, false)).toBe(false)
    expect(marketOpen([{ ...base, url: 'u' }], false, false)).toBe(true)
  })
  it('adds the discount code line only when there is a code', () => {
    expect(orderText('عايز فقاسة', 'كود الخصم: BEITY', 'BEITY')).toBe('عايز فقاسة\nكود الخصم: BEITY')
    expect(orderText('عايز فقاسة', 'كود الخصم: ', '')).toBe('عايز فقاسة')
  })
  it('builds Amazon search links that carry the affiliate tag', () => {
    const u = new URL(amazon('فقاسة بيض'))
    expect(u.hostname).toBe('www.amazon.eg')
    expect(u.searchParams.get('k')).toBe('فقاسة بيض')
    expect(u.searchParams.get('tag')).toBe(AMAZON_TAG)
    for (const p of PRODUCTS.filter((x) => x.url.includes('amazon.')))
      expect(new URL(p.url).searchParams.get('tag')).toBe(AMAZON_TAG)
  })
  it('has unique ids and known categories in the products file', () => {
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length)
    for (const p of PRODUCTS) expect(MARKET_CATEGORIES.some((c) => c.id === p.category)).toBe(true)
  })
})
