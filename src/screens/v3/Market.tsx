import { CONFIG } from '../../config'
import { logClick, useProfile } from '../../cloud/client'
import { MARKET_CATEGORIES, PRODUCTS, type MarketProduct } from '../../data/affiliateProducts'
import { GOVERNORATES } from '../../data/rules'
import { marketSections, orderText } from '../../calc/market'
import { useKinds } from '../../db/birds'
import { feedbackUrl } from '../../feedback'
import { share } from '../../platform'
import { t, lt } from '../../i18n'
import { Icon } from '../../ui/Icon'
import { Badge, Button, Card, Page, PageHeader, SectionTitle } from '../../ui/kit'
import { marketWhatsapp } from './parts'

/** "سوق طيور في بيتي": products from src/data/affiliateProducts.ts, grouped by category. */
export default function Market() {
  const sections = marketSections(MARKET_CATEGORIES, PRODUCTS)
  const wa = marketWhatsapp()
  return (
    <Page>
      <PageHeader title={t('mk.title')} subtitle={t('mk.sub')} back />
      {sections.length > 0 && (
        <Card tone="plain" className="mb-4 flex gap-2 text-sm text-muted">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />
          <span>{t('mk.note')}</span>
        </Card>
      )}

      {sections.map(({ category, products }) => (
        <section key={category.id} aria-labelledby={`mk-${category.id}`} className="mb-5">
          <SectionTitle icon={category.icon}>
            <span id={`mk-${category.id}`}>{lt(category.name)}</span>
          </SectionTitle>
          {category.id === 'supplements' && <p className="mb-2 text-sm text-muted">{t('mk.vitNote')}</p>}
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} whatsapp={wa} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {CONFIG.market.vip && wa && <VipCard whatsapp={wa} />}
    </Page>
  )
}

function ProductCard({ product: p, whatsapp }: { product: MarketProduct; whatsapp: string }) {
  const code = CONFIG.market.discountCode.trim()
  const click = (channel: 'online' | 'whatsapp') =>
    void logClick({ productId: p.id, product: lt(p.name), category: p.category, channel })
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-extrabold">{lt(p.name)}</h3>
        {p.popular && <Badge tone="warn">{t('mk.popular')}</Badge>}
      </div>
      <p className="mt-1 leading-relaxed">{lt(p.benefit)}</p>
      {p.price.trim() && (
        <p className="mt-1 text-sm font-bold text-leaf">{t('mk.price', { p: p.price.trim() })}</p>
      )}
      <div className="mt-3 grid gap-2">
        {p.url.trim() && (
          <Button
            icon="send"
            full
            onClick={() => {
              // Open first (popup blockers allow only direct taps), then log.
              share.openExternal(p.url.trim())
              click('online')
            }}
          >
            {t('mk.online')}
          </Button>
        )}
        {p.whatsapp && whatsapp && (
          <Button
            variant="secondary"
            icon="whatsapp"
            full
            onClick={() => {
              const text = orderText(
                t('mk.waMsg', { product: lt(p.name) }),
                t('mk.waCode', { code }),
                code,
              )
              share.openExternal(feedbackUrl(text, whatsapp))
              click('whatsapp')
            }}
          >
            {code ? t('mk.whatsappCode', { code }) : t('mk.whatsapp')}
          </Button>
        )}
      </div>
    </Card>
  )
}

function VipCard({ whatsapp }: { whatsapp: string }) {
  const profile = useProfile()
  const kinds = useKinds()
  return (
    <section className="rounded-2xl border-2 border-accent bg-gradient-to-bl from-accent-soft via-surface to-primary-soft p-4 shadow-md">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-ink shadow">
          <Icon name="star" size={26} />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">{t('mk.vip.title')}</h2>
          <p className="mt-1 leading-relaxed">{t('mk.vip.body')}</p>
        </div>
      </div>
      <Button
        icon="whatsapp"
        full
        className="mt-3"
        onClick={() => {
          const gov = GOVERNORATES.find((g) => g.id === profile?.governorate)?.name ?? '—'
          const birds = (kinds ?? []).map((k) => t(`kind.${k}`)).join('، ') || '—'
          share.openExternal(feedbackUrl(t('mk.vip.msg', { birds, gov }), whatsapp))
          void logClick({ productId: 'vip', product: t('mk.vip.title'), category: 'vip', channel: 'whatsapp' })
        }}
      >
        {t('mk.vip.cta')}
      </Button>
    </section>
  )
}
