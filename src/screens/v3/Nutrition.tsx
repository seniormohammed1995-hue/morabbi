import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProfile, KINDS, profilesOf } from '../../data/birds'
import { ECONOMY } from '../../data/nutrition'
import { RULES } from '../../data/rules'
import { SCRAP_ITEMS } from '../../data/scraps'
import { WEATHER } from '../../data/weather'
import type { BirdKind, BirdProfile } from '../../data/schema'
import { dailyNeeds, scrapsSplit } from '../../calc/nutrition'
import { scrapVerdicts } from '../../calc/birds'
import { ageOn, todayISO } from '../../calc/dates'
import { useGroups, useKinds } from '../../db/birds'
import { t, lt } from '../../i18n'
import { num } from '../../i18n/format'
import { BirdArt } from '../../ui/BirdArt'
import { Icon } from '../../ui/Icon'
import {
  Badge,
  Card,
  cx,
  Field,
  NumberInput,
  Page,
  PageHeader,
  SectionTitle,
  SourceNote,
  Stat,
  Tabs,
} from '../../ui/kit'

type Tab = 'calc' | 'feeds' | 'economy'

/** Feeding guide: daily calculator, feed types by age, and the household-scraps guide. */
export default function Nutrition() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab | null) ?? 'calc'
  const kinds = useKinds()
  const myKinds = kinds && kinds.length ? kinds : KINDS
  return (
    <Page>
      <PageHeader title={t('nu.title')} subtitle={t('nu.sub')} back />
      <Tabs<Tab>
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        tabs={[
          { value: 'calc', label: t('nu.tab.calc') },
          { value: 'feeds', label: t('nu.tab.feeds') },
          { value: 'economy', label: t('nu.tab.economy') },
        ]}
      />
      {tab === 'calc' && <Calculator />}
      {tab === 'feeds' && <FeedTypes kinds={myKinds} />}
      {tab === 'economy' && <Economy kinds={myKinds} onCalc={() => setParams({ tab: 'calc' })} />}
    </Page>
  )
}

// ---------- calculator ----------

function Calculator() {
  const groups = useGroups()
  const [groupId, setGroupId] = useState<number | 'manual' | null>(null)
  const [kind, setKind] = useState<BirdKind>('chicken')
  const [profileId, setProfileId] = useState(profilesOf('chicken')[0]!.id)
  const [weeks, setWeeks] = useState<number | undefined>(4)
  const [count, setCount] = useState<number | undefined>(10)
  const [temp, setTemp] = useState<number | undefined>(undefined)

  const selected = groupId ?? (groups && groups.length ? groups[0]!.id : 'manual')
  const group = selected === 'manual' ? undefined : groups?.find((g) => g.id === selected)
  const profile = group ? getProfile(group.profileId) : getProfile(profileId)
  const age = group ? ageOn(group.placementDate, todayISO()) : Math.max(0, Math.round((weeks ?? 0) * 7))
  const n = group ? group.initialCount : Math.max(0, Math.round(count ?? 0))
  const needs = profile ? dailyNeeds(profile, age, n, temp, WEATHER) : undefined
  const split = needs?.feedKg !== undefined ? scrapsSplit(needs.feedKg, RULES.scrapsShareMaxPct.max) : undefined

  return (
    <>
      {groups && groups.length > 0 ? (
        <Field label={t('nu.group')} htmlFor="nu-group">
          <select
            id="nu-group"
            value={String(selected)}
            onChange={(e) => setGroupId(e.target.value === 'manual' ? 'manual' : Number(e.target.value))}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-lg"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
            <option value="manual">{t('nu.manual')}</option>
          </select>
        </Field>
      ) : (
        <p className="mb-3 text-sm text-muted">{t('nu.noGroups')}</p>
      )}

      {selected === 'manual' && (
        <Card className="mb-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('nu.kind')} htmlFor="nu-kind">
              <select
                id="nu-kind"
                value={kind}
                onChange={(e) => {
                  const k = e.target.value as BirdKind
                  setKind(k)
                  setProfileId(profilesOf(k)[0]!.id)
                }}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-2"
              >
                {KINDS.filter((k) => profilesOf(k).length).map((k) => (
                  <option key={k} value={k}>
                    {t(`kind.${k}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('nu.breed')} htmlFor="nu-breed">
              <select
                id="nu-breed"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-2"
              >
                {profilesOf(kind).map((p) => (
                  <option key={p.id} value={p.id}>
                    {lt(p.name)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('nu.ageWeeks')} htmlFor="nu-weeks">
              <NumberInput id="nu-weeks" value={weeks} onChange={setWeeks} decimal />
            </Field>
            <Field label={profile?.unit === 'pairs' ? t('nu.countPairs') : t('nu.count')} htmlFor="nu-count">
              <NumberInput id="nu-count" value={count} onChange={setCount} />
            </Field>
          </div>
        </Card>
      )}

      <Field label={t('nu.temp')} htmlFor="nu-temp" hint={t('nu.tempHint')}>
        <NumberInput id="nu-temp" value={temp} onChange={setTemp} decimal placeholder="°" />
      </Field>

      {profile && needs && (
        <Card tone="primary">
          <div className="flex items-center gap-3">
            <BirdArt kind={profile.kind} size={44} />
            <div className="min-w-0">
              <div className="text-sm text-muted">{t('nu.phase')}</div>
              <div className="text-lg font-extrabold">{lt(needs.phase.name)}</div>
              {needs.phase.crudeProtein && (
                <div className="text-sm">{t('nu.protein', { n: num(needs.phase.crudeProtein.value, 1) })}</div>
              )}
            </div>
          </div>
          {needs.phase.crudeProtein && <SourceNote item={needs.phase.crudeProtein} />}

          {needs.feedKg !== undefined ? (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat label={t('nu.perBird')} value={num(needs.feedG, 0)} unit={t('common.g')} />
                <Stat label={t('nu.feedTotal')} value={num(needs.feedKg, needs.feedKg < 10 ? 2 : 1)} unit={t('common.kg')} />
                <Stat
                  label={t('nu.waterTotal')}
                  value={needs.waterL === undefined ? '—' : num(needs.waterL, needs.waterL < 10 ? 1 : 0)}
                  unit={needs.waterL === undefined ? '' : t('common.l')}
                />
              </div>
              {profile.feeding.dailyFeed && <SourceNote item={profile.feeding.dailyFeed} />}
              {needs.waterL === undefined ? (
                <p className="mt-2 text-sm text-muted">{t('nu.noWater')}</p>
              ) : (
                <p className="mt-2 text-sm text-muted">{t('nu.waterAlways')}</p>
              )}
              {split && (
                <div className="mt-3 rounded-xl bg-surface p-3">
                  <div className="font-bold">{t('nu.scraps')}</div>
                  <p className="text-sm">
                    {t('nu.scrapsSplit', {
                      scraps: num(split.scrapsKg, split.scrapsKg < 1 ? 2 : 1),
                      feed: num(split.feedKg, split.feedKg < 1 ? 2 : 1),
                    })}
                  </p>
                  <Badge tone="warn">{t('common.indicative')}</Badge>
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 leading-relaxed">{t('nu.noTable')}</p>
          )}
        </Card>
      )}
    </>
  )
}

// ---------- feed types ----------

function FeedTypes({ kinds }: { kinds: BirdKind[] }) {
  const profiles = kinds.flatMap((k) => profilesOf(k))
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t('nu.forKinds')}</p>
      {profiles.map((p) => (
        <ProfileFeeds key={p.id} p={p} />
      ))}
    </div>
  )
}

function ProfileFeeds({ p }: { p: BirdProfile }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-start"
      >
        <BirdArt kind={p.kind} size={40} />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold">{lt(p.name)}</div>
          <div className="text-sm text-muted">
            {t(`kind.${p.kind}`)} · {p.feeding.phases.map((ph) => lt(ph.name)).join(' ← ')}
          </div>
        </div>
        <Icon name="chevron" size={18} className={cx('text-muted transition', open && '-rotate-90')} />
      </button>
      {open && (
        <div className="mt-3">
          <ol className="space-y-2">
            {p.feeding.phases.map((ph) => (
              <li key={ph.id} className="rounded-xl bg-surface-2 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{lt(ph.name)}</span>
                  <span className="text-sm text-muted">
                    {ph.toDay >= 3000
                      ? t('nu.agesFrom', { from: num(ph.fromDay) })
                      : t('nu.ages', { from: num(ph.fromDay), to: num(ph.toDay) })}
                  </span>
                  {ph.crudeProtein && (
                    <Badge tone="primary">{t('nu.protein', { n: num(ph.crudeProtein.value, 1) })}</Badge>
                  )}
                </div>
                {ph.note && <p className="mt-1 text-sm">{lt(ph.note)}</p>}
                {ph.crudeProtein && <SourceNote item={ph.crudeProtein} />}
              </li>
            ))}
          </ol>
          <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-relaxed">
            {p.feeding.notes.map((x, i) => (
              <li key={i}>{lt(x)}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

// ---------- economy (household scraps) ----------

function Economy({ kinds, onCalc }: { kinds: BirdKind[]; onCalc: () => void }) {
  const groups = useGroups()
  const profiles = useMemo(
    () =>
      kinds
        .map((k) => getProfile(groups?.find((g) => g.kind === k)?.profileId ?? '') ?? profilesOf(k)[0])
        .filter((p): p is BirdProfile => !!p),
    [kinds, groups],
  )
  const name = (id: string) => lt(SCRAP_ITEMS.find((s) => s.id === id)?.name)

  return (
    <div>
      <Card tone="leaf">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="heart" className="text-leaf" /> {t('eco.title')}
        </h2>
        {ECONOMY.intro.map((x, i) => (
          <p key={i} className="mt-2 leading-relaxed">
            {lt(x)}
          </p>
        ))}
      </Card>

      <Card tone="accent" className="mt-3">
        <h3 className="font-extrabold">{t('eco.share.title')}</h3>
        <p className="mt-1 text-lg font-bold leading-relaxed">
          {t('eco.share.body', {
            min: num(RULES.scrapsShareMaxPct.min),
            max: num(RULES.scrapsShareMaxPct.max),
          })}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="warn">{t('common.indicative')}</Badge> {t('eco.share.estimate')}
        </p>
        <p className="mt-3 rounded-xl bg-surface p-3 leading-relaxed">{lt(ECONOMY.twentyMinutes.text)}</p>
        <SourceNote item={ECONOMY.twentyMinutes} />
        <button type="button" onClick={onCalc} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary">
          {t('eco.calcHint')} <Icon name="chevron" size={14} />
        </button>
      </Card>

      <SectionTitle icon="check">{t('eco.useful')}</SectionTitle>
      <ul className="space-y-2">
        {ECONOMY.useful.map((u) => (
          <li key={u.item} className="rounded-2xl border border-leaf/30 bg-surface p-3">
            <div className="font-extrabold">{name(u.item)}</div>
            <p className="text-sm">{lt(u.prep)}</p>
            <Verdicts item={u.item} profiles={profiles} />
          </li>
        ))}
      </ul>

      <SectionTitle icon="close">{t('eco.avoid')}</SectionTitle>
      <ul className="space-y-2">
        {ECONOMY.avoid.map((id) => {
          const rule = scrapVerdicts(id, profiles).find((v) => v.rule)?.rule
          return (
            <li key={id} className="rounded-2xl border border-danger/30 bg-danger-soft p-3">
              <div className="font-extrabold text-danger">{name(id)}</div>
              {rule && <p className="text-sm">{lt(rule.reason)}</p>}
              {rule && <SourceNote item={rule} />}
            </li>
          )
        })}
      </ul>

      <SectionTitle icon="info">{t('eco.tips')}</SectionTitle>
      <ul className="list-disc space-y-1 ps-5 leading-relaxed">
        {ECONOMY.tips.map((x, i) => (
          <li key={i}>{lt(x)}</li>
        ))}
      </ul>
      <Link to="/scraps" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface font-bold text-primary">
        <Icon name="search" /> {t('eco.search')}
      </Link>
    </div>
  )
}

const VERDICT_TONE = { ok: 'leaf', limit: 'warn', no: 'danger' } as const

function Verdicts({ item, profiles }: { item: string; profiles: BirdProfile[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {scrapVerdicts(item, profiles).map(({ profile, rule }) => (
        <span key={profile.id} className="inline-flex items-center gap-1">
          <BirdArt kind={profile.kind} size={20} />
          {rule ? (
            <Badge tone={VERDICT_TONE[rule.verdict]}>
              {t(`kind.${profile.kind}`)}: {t(`scraps.${rule.verdict}`)}
            </Badge>
          ) : (
            <Badge>{t(`kind.${profile.kind}`)}: {t('scraps.unknown')}</Badge>
          )}
        </span>
      ))}
    </div>
  )
}
