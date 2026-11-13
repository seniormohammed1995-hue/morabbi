import { useState } from 'react'
import { WITHDRAWAL_RULE } from '../../data/care'
import { withdrawalStatus, type WithdrawalSide } from '../../calc/care'
import { todayISO } from '../../calc/dates'
import type { Treatment } from '../../db'
import { useGroups } from '../../db/birds'
import { addTreatment, deleteTreatment, useTreatments } from '../../db/treatments'
import { lt, t } from '../../i18n'
import { dateLong, num } from '../../i18n/format'
import { Icon } from '../../ui/Icon'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  cx,
  Field,
  NumberInput,
  Page,
  PageHeader,
  Select,
  SourceNote,
  TextInput,
  toast,
} from '../../ui/kit'

const ALL = 'all'

/** Medicine courses with a countdown to the day eggs and meat are safe to eat again. */
export default function Treatments() {
  const today = todayISO()
  const groups = useGroups()
  const list = useTreatments()
  const [name, setName] = useState('')
  const [group, setGroup] = useState<string>(ALL)
  const [lastDose, setLastDose] = useState(today)
  const [eggDays, setEggDays] = useState<number | undefined>()
  const [meatDays, setMeatDays] = useState<number | undefined>()
  const [err, setErr] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Treatment | null>(null)

  const save = async () => {
    const days = (n: number | undefined) => (n !== undefined && n > 0 ? Math.round(n) : undefined)
    const eggs = days(eggDays)
    const meat = days(meatDays)
    if (name.trim().length < 2) return setErr(t('tr.err.name'))
    if (!lastDose || lastDose > today) return setErr(t('tr.err.date'))
    if (eggs === undefined && meat === undefined) return setErr(t('tr.err.days'))
    setErr(null)
    await addTreatment({
      name: name.trim(),
      lastDose,
      ...(group === ALL ? {} : { flockId: Number(group) }),
      ...(eggs === undefined ? {} : { eggDays: eggs }),
      ...(meat === undefined ? {} : { meatDays: meat }),
    })
    setName('')
    setEggDays(undefined)
    setMeatDays(undefined)
    toast(t('tr.saved'))
  }

  const nameOf = (id: number | undefined) =>
    id === undefined
      ? t('tr.group.all')
      : (groups?.find((g) => g.id === id)?.name ?? t('tr.group.all'))

  return (
    <Page>
      <PageHeader title={t('tr.title')} subtitle={t('tr.sub')} back />

      <Card tone="accent">
        <p className="text-sm leading-relaxed">{lt(WITHDRAWAL_RULE.text)}</p>
        <SourceNote item={WITHDRAWAL_RULE} />
      </Card>

      <ul className="mt-4 space-y-3" aria-label={t('tr.title')}>
        {list?.map((tr) => {
          const s = withdrawalStatus(tr, today)
          return (
            <li key={tr.id}>
              <Card tone={s.active ? 'danger' : 'leaf'}>
                <div className="flex items-start gap-3">
                  <span
                    className={cx(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-full text-white',
                      s.active ? 'bg-danger' : 'bg-leaf',
                    )}
                  >
                    <Icon name={s.active ? 'medkit' : 'check'} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold">{tr.name}</h2>
                      <Badge tone={s.active ? 'danger' : 'leaf'}>
                        {s.active ? t('tr.active') : t('tr.past')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted">
                      {nameOf(tr.flockId)} · {t('tr.lastDoseOn', { date: dateLong(tr.lastDose) })}
                    </p>
                    <Side side={s.eggs} wait="tr.eggs.wait" ok="tr.eggs.ok" />
                    <Side side={s.meat} wait="tr.meat.wait" ok="tr.meat.ok" />
                  </div>
                  <button
                    type="button"
                    aria-label={`${t('tr.delete')} ${tr.name}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface"
                    onClick={() => setToDelete(tr)}
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
      {list?.length === 0 && <p className="mt-4 text-muted">{t('tr.empty')}</p>}

      <Card className="mt-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <Icon name="plus" className="text-primary" /> {t('tr.add')}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <Field label={t('tr.name')} htmlFor="tr-name">
            <TextInput id="tr-name" value={name} onChange={setName} placeholder={t('tr.namePh')} />
          </Field>
          <Field label={t('tr.group')} htmlFor="tr-group">
            <Select
              id="tr-group"
              value={group}
              onChange={setGroup}
              options={[
                { value: ALL, label: t('tr.group.all') },
                ...(groups ?? []).map((g) => ({ value: String(g.id), label: g.name })),
              ]}
            />
          </Field>
          <Field label={t('tr.lastDose')} htmlFor="tr-date">
            <input
              id="tr-date"
              type="date"
              max={today}
              value={lastDose}
              onChange={(e) => setLastDose(e.target.value)}
              className="num min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('tr.eggDays')} htmlFor="tr-eggs">
              <NumberInput id="tr-eggs" value={eggDays} onChange={setEggDays} />
            </Field>
            <Field label={t('tr.meatDays')} htmlFor="tr-meat">
              <NumberInput id="tr-meat" value={meatDays} onChange={setMeatDays} />
            </Field>
          </div>
          <p className="-mt-2 mb-4 text-sm text-muted">{t('tr.daysHint')}</p>
          {err && (
            <p role="alert" className="mb-3 font-bold text-danger">
              {err}
            </p>
          )}
          <Button type="submit" icon="check" full>
            {t('tr.save')}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title={t('tr.delete.title')}
        body={t('tr.delete.body')}
        confirmLabel={t('tr.delete')}
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) void deleteTreatment(toDelete.id)
          setToDelete(null)
        }}
      />
    </Page>
  )
}

function Side({
  side,
  wait,
  ok,
}: {
  side: WithdrawalSide | undefined
  wait: 'tr.eggs.wait' | 'tr.meat.wait'
  ok: 'tr.eggs.ok' | 'tr.meat.ok'
}) {
  if (!side) return null
  const date = dateLong(side.safeFrom)
  return side.daysLeft > 0 ? (
    <p className="mt-1 font-bold text-danger">{t(wait, { n: num(side.daysLeft), date })}</p>
  ) : (
    <p className="mt-1 font-semibold text-leaf">{t(ok, { date })}</p>
  )
}
