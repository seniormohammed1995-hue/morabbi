import { Link } from 'react-router-dom'
import { PRODUCTS } from '../../data/affiliateProducts'
import { visibleProducts } from '../../calc/market'
import { t, lt } from '../../i18n'
import { Icon } from '../../ui/Icon'
import { ProductArt } from '../../ui/ProductArt'
import { openProduct } from './marketActions'

/**
 * A quiet "يساعدك هنا" strip for one market product, placed where the app's own advice needs that
 * tool (the scale next to doses in grams, the incubator in the hatching tool, the thermometer in
 * reminders). Hidden when the product has no link.
 */
export function ProductNudge({ id, className }: { id: string; className?: string }) {
  const p = visibleProducts(PRODUCTS).find((x) => x.id === id && x.url.trim())
  if (!p) return null
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-3 ${className ?? ''}`}>
      <ProductArt art={p.art} size={52} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-muted">{t('mk.nudge')}</p>
        <p className="truncate font-bold">{lt(p.name)}</p>
        <div className="mt-1 flex gap-3 text-sm font-bold">
          <button type="button" onClick={() => openProduct(p)} className="text-primary">
            {t('mk.see')}
          </button>
          <Link to="/market" className="text-muted">
            {t('mk.title')}
          </Link>
        </div>
      </div>
      <Icon name="star" size={18} className="shrink-0 text-accent" />
    </div>
  )
}
