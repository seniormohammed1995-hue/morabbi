import { useState } from 'react'
import { RULES } from '../../data/rules'
import {
  nextReminder,
  parseTime,
  reminderSlots,
  type ReminderSettings,
} from '../../calc/reminders'
import { reminderText, saveReminderSettings, useReminderSettings } from '../../reminders'
import { device, notifications, type PermissionState } from '../../platform'
import { t } from '../../i18n'
import { clock, num } from '../../i18n/format'
import { Icon, type IconName } from '../../ui/Icon'
import { Button, Card, Choice, cx, Page, PageHeader, toast } from '../../ui/kit'
import { ApkCard } from './parts'

const timeCls =
  'num min-h-12 rounded-xl border border-line bg-surface px-3 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

/** Water / feed / flock-news reminder settings. */
export default function Reminders() {
  const saved = useReminderSettings()
  return saved ? <RemindersForm initial={saved} /> : null
}

function RemindersForm({ initial }: { initial: ReminderSettings }) {
  const [s, setS] = useState<ReminderSettings>(initial)
  const [perm, setPerm] = useState<PermissionState>(notifications.state())
  const [now] = useState(() => new Date())

  const update = (next: ReminderSettings) => {
    setS(next)
    const from = parseTime(next.water.from)
    const to = parseTime(next.water.to)
    if (from === null || to === null || to < from) return
    void saveReminderSettings(next)
  }
  const badWindow = (() => {
    const from = parseTime(s.water.from)
    const to = parseTime(s.water.to)
    return from === null || to === null || to < from
  })()
  const slots = reminderSlots(s)
  const next = nextReminder(slots, now)

  return (
    <Page>
      <PageHeader title={t('rem.title')} subtitle={t('rem.sub')} back />

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

      <p className="mt-3 text-center font-semibold" role="status">
        {next
          ? t('rem.next', {
              what: reminderText(next.slot.type).title,
              time: clock(next.at),
            })
          : t('rem.none')}
        {slots.length > 0 && (
          <span className="block text-sm text-muted">{t('rem.count', { n: num(slots.length) })}</span>
        )}
      </p>

      <Section
        icon="drop"
        title={t('rem.water')}
        on={s.water.on}
        onToggle={(on) => update({ ...s, water: { ...s.water, on } })}
      >
        <p className="mb-2 font-semibold">{t('rem.water.every')}</p>
        <Choice
          value={String(s.water.everyHours)}
          onChange={(v) => update({ ...s, water: { ...s.water, everyHours: Number(v) } })}
          options={RULES.reminders.waterEveryOptions.map((h) => ({
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
        {badWindow && (
          <p role="alert" className="mt-2 font-semibold text-danger">
            {t('rem.window.bad')}
          </p>
        )}
      </Section>

      <Section
        icon="feed"
        title={t('rem.feed')}
        on={s.feed.on}
        onToggle={(on) => update({ ...s, feed: { ...s.feed, on } })}
      >
        <ul className="grid gap-2">
          {s.feed.times.map((time, i) => (
            <li key={i} className="flex items-center gap-2">
              <label className="flex flex-1 items-center gap-2 font-semibold">
                <span className="w-20 shrink-0">{t('rem.feed.time', { n: num(i + 1) })}</span>
                <input
                  type="time"
                  className={cx(timeCls, 'flex-1')}
                  value={time}
                  onChange={(e) => {
                    const times = [...s.feed.times]
                    times[i] = e.target.value
                    update({ ...s, feed: { ...s.feed, times } })
                  }}
                />
              </label>
              {s.feed.times.length > 1 && (
                <button
                  type="button"
                  aria-label={t('rem.feed.remove')}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2"
                  onClick={() =>
                    update({ ...s, feed: { ...s.feed, times: s.feed.times.filter((_, j) => j !== i) } })
                  }
                >
                  <Icon name="trash" size={20} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {s.feed.times.length < RULES.reminders.maxFeedTimes && (
          <Button
            variant="ghost"
            icon="plus"
            className="mt-1"
            onClick={() => update({ ...s, feed: { ...s.feed, times: [...s.feed.times, '12:00'] } })}
          >
            {t('rem.feed.add')}
          </Button>
        )}
      </Section>

      <Section
        icon="note"
        title={t('rem.news')}
        on={s.news.on}
        onToggle={(on) => update({ ...s, news: { ...s.news, on } })}
      >
        <label className="flex items-center gap-2 font-semibold">
          <span className="w-20 shrink-0">{t('rem.news.time')}</span>
          <input
            type="time"
            className={cx(timeCls, 'flex-1')}
            value={s.news.time}
            onChange={(e) => update({ ...s, news: { ...s.news, time: e.target.value } })}
          />
        </label>
      </Section>

      <Button
        variant="secondary"
        icon="bell"
        full
        className="mt-5"
        onClick={async () => {
          const { title, body } = reminderText('water')
          const shown = await notifications.show(title, body, 'rem-test')
          device.chime('alert')
          if (!shown) toast(`${title} — ${body}`)
        }}
      >
        {t('rem.test')}
      </Button>

      {!notifications.canScheduleClosed() && <ApkCard className="mt-5" />}
    </Page>
  )
}

function Section({
  icon,
  title,
  on,
  onToggle,
  children,
}: {
  icon: IconName
  title: string
  on: boolean
  onToggle: (on: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Card className="mt-4">
      <label className="flex min-h-12 items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name={icon} className="text-primary" /> {title}
        </span>
        <input
          type="checkbox"
          role="switch"
          className="h-7 w-7 accent-[var(--c-primary)]"
          checked={on}
          onChange={(e) => onToggle(e.target.checked)}
        />
      </label>
      {on && <div className="mt-3">{children}</div>}
    </Card>
  )
}
