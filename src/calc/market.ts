import type { MarketCategory, MarketProduct } from '../data/affiliateProducts'

/** Products that have something to press: an affiliate link or WhatsApp ordering. */
export function visibleProducts(products: readonly MarketProduct[]): MarketProduct[] {
  return products.filter((p) => p.url.trim().length > 0 || p.whatsapp)
}

/** Categories in their set order, each with its visible products; empty ones dropped. */
export function marketSections(
  categories: readonly MarketCategory[],
  products: readonly MarketProduct[],
): Array<{ category: MarketCategory; products: MarketProduct[] }> {
  const shown = visibleProducts(products)
  return categories
    .map((category) => ({ category, products: shown.filter((p) => p.category === category.id) }))
    .filter((s) => s.products.length > 0)
}

/** The market entry points show only when there is a product or the VIP card to offer. */
export function marketOpen(products: readonly MarketProduct[], vip: boolean, canWhatsapp: boolean): boolean {
  const usable = visibleProducts(products).filter((p) => p.url.trim() || canWhatsapp)
  return usable.length > 0 || (vip && canWhatsapp)
}

/** WhatsApp order text: greeting + product, then the discount-code line when there is a code. */
export function orderText(body: string, codeLine: string, code: string): string {
  return code.trim() ? `${body}\n${codeLine}` : body
}
