import { logClick } from '../../cloud/client'
import type { MarketProduct } from '../../data/affiliateProducts'
import { share } from '../../platform'
import { lt } from '../../i18n'

/** Opens a market product's online link and logs the tap (Affiliate_Clicks). */
export function openProduct(p: MarketProduct): void {
  share.openExternal(p.url.trim())
  void logClick({ productId: p.id, product: lt(p.name), category: p.category, channel: 'online' })
}
