import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RULES } from '../../data/rules'
import { CARE_TIPS, type CareReminder } from '../../data/care'
import {
  nextReminder,
  parseTime,
  reminderSlots,
  type ReminderSettings,
  type TimedType,
} from '../../calc/reminders'
import {
  applicable,
  reminderText,
  saveReminderSettings,
  useCareContext,
  useReminderSettings,
  type CareContext,
} from '../../reminders'
import { device, notifications, type PermissionState } from '../../platform'
import { lt, t, type MsgKey } from '../../i18n'
import { clock, num } from '../../i18n/format'
import { Icon, type IconName } from '../../ui/Icon'
import {
  Button,
  Card,
  Choice,
  cx,
  Page,
  PageHeader,
  SectionTitle,
  SourceNote,
  toast,
} from '../../ui/kit'
import { ApkCard } from './parts'
import { ProductNudge } from './ProductNudge'

const R = RULES.reminders
const timeCls =
  'num min-h-12 rounded-xl border border-line bg-surface px-3 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

const TIMED: Array<{ type: TimedType; icon: IconName; label: MsgKey }> = [
  { type: 'temp', icon: 'thermo', label: 'rem.temp' },
  { type: 'activity', icon: 'search', label: 'rem.activity' },
  { type: 'feed', icon: 'feed', label: 'rem.feed' },
  { type: 'eggs', icon: 'egg', label: 'rem.eggs' },
  { type: 'litter', icon: 'refresh', label: 'rem.litter' },
]

/** Every repeating reminder and smart alert, each with its own switch and times. */
export default function Reminders() {
  const saved = useReminderSettings()
  const ctx = useCareContext()
  return saved && ctx ? <RemindersForm initial={saved} ctx={ctx} /> : null
}

function RemindersForm({ initial, ctx }: { initial: ReminderSettings; ctx: CareContext }) {
  const [s, setS] = useState<ReminderSettings>(initial)
  const [perm, setPerm] = useState<PermissionState>(notifications.state())
  const [now] = useState(() => new Date())

  const windowOk = (x: ReminderSettings) => {
    const from = parseTime(x.water.from)
    const to = parseTime(x.water.to)
    return from !== null && to !== null && to >= from
  }
  const update = (next: ReminderSettings) => {
    setS(next)
    if (windowOk(next)) void saveReminderSettings(next)
  }
  const slots = reminderSlots(s, applicable(ctx))
  const next = nextReminder(slots, now)
  const noLayers = ctx.groups.length > 0 && !ctx.hasLaying

  return (
    <Page>
      <PageHeader title={t('rem.title')} subtitle={t('rem.sub')} back />
      <ProductNudge id="thermo-hygro" className="mb-3" />

      <Card tone={perm === 'granted' ? 'leaf' : 'warn'}>
        {perm === 'granted' ? (
          <p className="flex items-center gap-2 font-bold text-leaf">
            <Icon name="check" /> {t('rem.perm.on')}
          </p>
        ) : perm === 'denied' ? (
          <p className="font-semibold text-warn">{t('rem.perm.denied')}</p>
        ) : perm === 'unsupported' ? (
          <p className="text-muted">{t('rem.perm.unsupported')}</p>
        ) : (
          <>
            <p className="mb-3">{t('rem.perm.body')}</p>
            <Button
              icon="bell"
              full
              onClick={async () => {
                const p = await notifications.request()
                setPerm(p)
                if (p === 'granted') await saveReminderSettings(s)
              }}
            >
              {t('rem.perm.enable')}
            </Button>
          </>
        )}
        <p className="mt-2 text-sm text-muted">
          {notifications.canScheduleClosed() ? t('rem.native.note') : t('rem.web.note')}
        </p>
      </Card>

      <div
        role="status"
        className="mt-3 flex items-center gap-3 rounded-2xl bg-primary-soft p-3 text-primary"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface">
          <Icon name="bell" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold">
            {next
              ? t('rem.next', {
                  what: reminderText(next.slot.type).title,
                  time: clock(next.at),
                })
              : t('rem.none')}
          </div>
          {slots.length > 0 && (
            <div className="text-sm">{t('rem.count', { n: num(slots.length) })}</div>
          )}
        </div>
      </div>
      {slots.length > R.busyPerDay && (
        <p className="mt-2 text-sm font-semibold text-warn">
          {t('rem.busy', { n: num(slots.length) })}
        </p>
      )}

      <div className="mt-5">
        <SectionTitle icon="bell">{t('rem.daily')}</SectionTitle>
      </div>

      <Section
        icon="drop"
        title={t('rem.water')}
        on={s.water.on}
        onToggle={(on) => update({ ...s, water: { ...s.water, on } })}
        tip="water"
        ctx={ctx}
      >
        <p className="mb-2 font-semibold">{t('rem.water.every')}</p>
        <Choice
          value={String(s.water.everyHours)}
          onChange={(v) => update({ ...s, water: { ...s.water, everyHours: Number(v) } })}
          options={R.waterEveryOptions.map((h) => ({
            value: String(h),
            label: t('rem.water.hours', { n: num(h) }),
          }))}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="grid gap-1 font-semibold">
            {t('rem.water.from')}
            <input
              type="time"
              className={timeCls}
              value={s.water.from}
              onChange={(e) => update({ ...s, water: { ...s.water, from: e.target.value } })}
            />
          </label>
          <label className="grid gap-1 font-semibold">
            {t('rem.water.to')}
            <input
              type="time"
              className={timeCls}
              value={s.water.to}
              onChange={(e) => update({ ...s, water: { ...s.water, to: e.target.value } })}
            />
          </label>
        </div>
        {!windowOk(s) && (
          <p role="alert" className="mt-2 font-semibold text-danger">
            {t('rem.window.bad')}
          </p>
        )}
      </Section>

      {TIMED.map(({ type, icon, label }) => (
        <Section
          key={type}
          icon={icon}
          title={t(label)}
          on={s[type].on}
          onToggle={(on) => update({ ...s, [type]: { ...s[type], on } })}
          tip={type}
          ctx={ctx}
        >
          {type === 'eggs' && noLayers && (
            <p className="mb-3 rounded-xl bg-surface-2 p-2 text-sm text-muted">
              {t('rem.eggs.none')}
            </p>
          )}
          <Times
            name={t(label)}
            times={s[type].times}
            onChange={(times) => update({ ...s, [type]: { ...s[type], times } })}
          />
        </Section>
      ))}

      <Section
        icon="note"
        title={t('rem.news')}
        on={s.news.on}
        onToggle={(on) => update({ ...s, news: { ...s.news, on } })}
      >
        <TimeRow
          label={t('rem.news.time')}
          value={s.news.time}
          onChange={(time) => update({ ...s, news: { ...s.news, time } })}
        />
      </Section>

      <div className="mt-6">
        <SectionTitle icon="star">{t('rem.smart')}</SectionTitle>
      </div>

      <Section
        icon="calendar"
        title={t('rem.digest')}
        on={s.digest.on}
        onToggle={(on) => update({ ...s, digest: { ...s.digest, on } })}
        note={t('rem.digest.body')}
      >
        <TimeRow
          label={t('rem.news.time')}
          value={s.digest.time}
          onChange={(time) => update({ ...s, digest: { ...s.digest, time } })}
        />
        <MoreLink to="/schedule" label={t('rem.digest.link')} />
      </Section>

      <Section
        icon="sun"
        title={t('rem.weather')}
        on={s.weather.on}
        onToggle={(on) => update({ ...s, weather: { on } })}
        note={t('rem.weather.body')}
      >
        <MoreLink to="/weather" label={t('rem.weather.link')} />
      </Section>

      {notifications.canScheduleClosed() && (
        <Card tone="accent" className="mt-4">
          <p className="flex items-center gap-2 font-extrabold">
            <Icon name="info" /> {t('rem.battery.title')}
          </p>
          <p className="mt-1 text-sm">{t('rem.battery.body')}</p>
        </Card>
      )}

      <Button
        variant="secondary"
        icon="bell"
        full
        className="mt-5"
        onClick={async () => {
          const { title, body } = reminderText('water', ctx)
          const shown = await notifications.show(title, body, 'rem-test')
          device.chime('alert')
          if (!shown) toast(`${title} — ${body.split('\n')[0]}`)
        }}
      >
        {t('rem.test')}
      </Button>

      {!notifications.canScheduleClosed() && <ApkCard className="mt-5" />}
    </Page>
  )
}

function MoreLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mt-3 inline-flex items-center gap-1 font-bold text-primary">
      {label} <Icon name="chevron" size={16} />
    </Link>
  )
}

function TimeRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-2 font-semibold">
      <span className="w-20 shrink-0">{label}</span>
      <input
        type="time"
        className={cx(timeCls, 'flex-1')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/** A list of clock times (1 to RULES.reminders.maxTimes). */
function Times({
  name,
  times,
  onChange,
}: {
  name: string
  times: string[]
  onChange: (t: string[]) => void
}) {
  return (
    <>
      <ul className="grid gap-2">
        {times.map((time, i) => (
          <li key={i} className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 font-semibold">
              <span className="w-20 shrink-0">{t('rem.time', { n: num(i + 1) })}</span>
              <input
                type="time"
                aria-label={`${name} — ${t('rem.time', { n: num(i + 1) })}`}
                className={cx(timeCls, 'flex-1')}
                value={time}
                onChange={(e) => onChange(times.map((x, j) => (j === i ? e.target.value : x)))}
              />
            </label>
            {times.length > 1 && (
              <button
                type="button"
                aria-label={t('rem.time.remove')}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2"
                onClick={() => onChange(times.filter((_, j) => j !== i))}
              >
                <Icon name="trash" size={20} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {times.length < R.maxTimes && (
        <Button
          variant="ghost"
          icon="plus"
          className="mt-1"
          onClick={() => onChange([...times, '12:00'])}
        >
          {t('rem.time.add')}
        </Button>
      )}
    </>
  )
}

function Section({
  icon,
  title,
  on,
  onToggle,
  tip,
  ctx,
  note,
  children,
}: {
  icon: IconName
  title: string
  on: boolean
  onToggle: (on: boolean) => void
  /** Reminder type whose sourced tip is shown under the title. */
  tip?: CareReminder
  ctx?: CareContext
  note?: string
  children: React.ReactNode
}) {
  const sourced =
    tip && ((ctx?.hasYoung ? CARE_TIPS[tip].young : undefined) ?? CARE_TIPS[tip].general)
  return (
    <Card className="mt-3">
      <label className="flex min-h-12 items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Icon name={icon} />
          </span>
          {title}
        </span>
        <input
          type="checkbox"
          role="switch"
          className="h-7 w-7 accent-[var(--c-primary)]"
          checked={on}
          onChange={(e) => onToggle(e.target.checked)}
        />
      </label>
      {on && (
        <div className="mt-3">
          {note && <p className="mb-3 text-sm text-muted">{note}</p>}
          {children}
          {sourced && (
            <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
              <span className="font-bold">{t('rem.tip')}</span> {lt(sourced.text)}
              <SourceNote item={sourced} />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
