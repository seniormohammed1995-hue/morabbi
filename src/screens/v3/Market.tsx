import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CONFIG } from '../../config'
import { logClick, useProfile } from '../../cloud/client'
import { MARKET_CATEGORIES, PRODUCTS, type MarketCategoryId, type MarketProduct } from '../../data/affiliateProducts'
import { GOVERNORATES } from '../../data/rules'
import { marketSections, orderText, visibleProducts } from '../../calc/market'
import { useKinds } from '../../db/birds'
import { feedbackUrl } from '../../feedback'
import { share } from '../../platform'
import { t, lt } from '../../i18n'
import { Icon } from '../../ui/Icon'
import { ProductArt } from '../../ui/ProductArt'
import { Badge, Button, cx, Page, PageHeader } from '../../ui/kit'
import { marketWhatsapp } from './parts'
import { openProduct } from './marketActions'

type Filter = MarketCategoryId | 'all'

/** "سوق طيور في بيتي": products from src/data/affiliateProducts.ts, grouped by category. */
export default function Market() {
  const [params, setParams] = useSearchParams()
  const sections = marketSections(MARKET_CATEGORIES, PRODUCTS)
  const filter = (params.get('c') as Filter | null) ?? 'all'
  const shown = filter === 'all' ? sections : sections.filter((s) => s.category.id === filter)
  const picks = visibleProducts(PRODUCTS).filter((p) => p.pick)
  const wa = marketWhatsapp()
  return (
    <Page>
      <PageHeader title={t('mk.title')} back />

      {sections.length > 0 && (
        <section className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-bl from-primary to-[#7E3517] p-5 text-white shadow-lg">
          <div className="relative z-10 me-20">
            <h2 className="text-2xl font-extrabold leading-tight">{t('mk.hero.title')}</h2>
            <p className="mt-2 leading-relaxed text-white/90">{t('mk.hero.body')}</p>
            <ul className="mt-3 space-y-1 text-sm font-semibold">
              {(['mk.hero.p1', 'mk.hero.p2', 'mk.hero.p3'] as const).map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <Icon name="check" size={16} className="text-accent" />
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
          <div className="pointer-events-none absolute end-3 top-4 rotate-[-8deg] opacity-95">
            <ProductArt art="incubator" size={72} />
          </div>
        </section>
      )}

      {sections.length > 1 && (
        <nav aria-label={t('mk.filter')} className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ id: 'all' as Filter, label: t('mk.all') }, ...sections.map((s) => ({ id: s.category.id as Filter, label: lt(s.category.name) }))].map(
            (c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filter === c.id}
                onClick={() => setParams(c.id === 'all' ? {} : { c: c.id }, { replace: true })}
                className={cx(
                  'min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold',
                  filter === c.id ? 'border-primary bg-primary text-primary-ink' : 'border-line bg-surface',
                )}
              >
                {c.label}
              </button>
            ),
          )}
        </nav>
      )}

      {filter === 'all' && picks.length > 0 && (
        <section aria-labelledby="mk-picks" className="mb-5">
          <h2 id="mk-picks" className="mb-1 flex items-center gap-2 text-lg font-extrabold">
            <Icon name="star" className="text-accent" /> {t('mk.picks')}
          </h2>
          <p className="mb-2 text-sm text-muted">{t('mk.picksSub')}</p>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {picks.map((p) => (
              <li key={p.id} className="w-44 shrink-0 snap-start">
                <MiniCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {shown.map(({ category, products }) => (
        <section key={category.id} aria-labelledby={`mk-${category.id}`} className="mb-6">
          <h2 id={`mk-${category.id}`} className="mb-2 flex items-center gap-2 text-lg font-extrabold">
            <Icon name={category.icon} className="text-primary" /> {lt(category.name)}
            <span className="text-sm font-semibold text-muted">({products.length})</span>
          </h2>
          {category.id === 'supplements' && (
            <p className="mb-2 rounded-xl bg-warn-soft p-2 text-sm text-warn">{t('mk.vitNote')}</p>
          )}
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

      {sections.length > 0 && <p className="mt-4 text-xs leading-relaxed text-muted">{t('mk.note')}</p>}
    </Page>
  )
}

function MiniCard({ product: p }: { product: MarketProduct }) {
  return (
    <button
      type="button"
      onClick={() => openProduct(p)}
      className="flex h-full w-full flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center shadow-sm active:bg-surface-2"
    >
      <ProductArt art={p.art} size={88} />
      <span className="line-clamp-2 text-sm font-bold leading-snug">{lt(p.name)}</span>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-primary">
        {t('mk.see')} <Icon name="back" size={12} className="rotate-180" />
      </span>
    </button>
  )
}

function ProductCard({ product: p, whatsapp }: { product: MarketProduct; whatsapp: string }) {
  const [open, setOpen] = useState(false)
  const code = CONFIG.market.discountCode.trim()
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex gap-3 p-3">
        <ProductArt art={p.art} size={84} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            {p.pick && <Badge tone="primary">{t('mk.pickBadge')}</Badge>}
            {p.popular && <Badge tone="warn">{t('mk.popular')}</Badge>}
          </div>
          <h3 className="mt-1 font-extrabold leading-snug">{lt(p.name)}</h3>
          <p className={cx('mt-1 text-sm leading-relaxed text-muted', !open && 'line-clamp-2')}>
            {lt(p.benefit)}
          </p>
          {!open && lt(p.benefit).length > 70 && (
            <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-primary">
              {t('mk.more')}
            </button>
          )}
          {p.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.tags.map((tag) => (
                <span key={lt(tag)} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                  {lt(tag)}
                </span>
              ))}
            </div>
          )}
          {p.price.trim() && (
            <p className="mt-2 text-sm font-extrabold text-leaf">{t('mk.price', { p: p.price.trim() })}</p>
          )}
        </div>
      </div>
      <div className="grid gap-2 border-t border-line bg-surface-2/50 p-3">
        {p.url.trim() && (
          <Button icon="send" full onClick={() => openProduct(p)}>
            {t('mk.online')}
          </Button>
        )}
        {p.whatsapp && whatsapp && (
          <Button
            variant="secondary"
            icon="whatsapp"
            full
            onClick={() => {
              const text = orderText(t('mk.waMsg', { product: lt(p.name) }), t('mk.waCode', { code }), code)
              share.openExternal(feedbackUrl(text, whatsapp))
              void logClick({ productId: p.id, product: lt(p.name), category: p.category, channel: 'whatsapp' })
            }}
          >
            {code ? t('mk.whatsappCode', { code }) : t('mk.whatsapp')}
          </Button>
        )}
        {p.url.includes('amazon.') && <p className="text-center text-xs text-muted">{t('mk.amazonHint')}</p>}
      </div>
    </article>
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
