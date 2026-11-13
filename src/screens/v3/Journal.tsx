import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type JournalEntry, type JournalTag } from '../../db'
import { useGroups } from '../../db/birds'
import { cloudEnabled, queueNews, setNewsSync, useNewsSync } from '../../cloud/client'
import { RULES } from '../../data/rules'
import { todayISO } from '../../calc/dates'
import { device } from '../../platform'
import { t } from '../../i18n'
import { clock, dateLong } from '../../i18n/format'
import { Icon, type IconName } from '../../ui/Icon'
import { Badge, Button, Card, ConfirmDialog, cx, EmptyState, Page, PageHeader, toast } from '../../ui/kit'

const TAGS: Array<{ id: JournalTag; icon: IconName }> = [
  { id: 'note', icon: 'note' },
  { id: 'eggs', icon: 'egg' },
  { id: 'health', icon: 'medkit' },
  { id: 'emergency', icon: 'alert' },
]
const TAG_TONE: Record<JournalTag, 'muted' | 'primary' | 'leaf' | 'danger'> = {
  note: 'muted',
  eggs: 'primary',
  health: 'leaf',
  emergency: 'danger',
}

/** "أخبار قطيعي": a daily notebook stored on the phone, optionally sent to the cloud. */
export default function Journal() {
  const groups = useGroups()
  const sync = useNewsSync()
  const entries = useLiveQuery(() => db.journal.orderBy('at').reverse().limit(200).toArray(), [])
  const [tag, setTag] = useState<JournalTag>('note')
  const [text, setText] = useState('')
  const [flockId, setFlockId] = useState<number | ''>('')
  const [toDelete, setToDelete] = useState<JournalEntry | null>(null)

  const groupName = (id?: number) => groups?.find((g) => g.id === id)?.name ?? ''

  const save = async () => {
    const body = text.trim()
    if (!body) return
    const entry = {
      date: todayISO(),
      at: Date.now(),
      tag,
      text: body,
      ...(flockId === '' ? {} : { flockId }),
    }
    const id = await db.journal.add(entry as JournalEntry)
    setText('')
    device.chime('ok')
    toast(t('jr.saved'))
    void queueNews({ id, date: entry.date, tag, text: body, group: groupName(entry.flockId) })
  }

  const byDay = new Map<string, JournalEntry[]>()
  for (const e of entries ?? []) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e])

  return (
    <Page>
      <PageHeader title={t('jr.title')} subtitle={t('jr.sub')} back />

      <Card>
        <label htmlFor="jr-text" className="mb-2 block text-lg font-extrabold">
          {t('jr.label')}
        </label>
        <div className="mb-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('contact.type')}>
          {TAGS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={tag === x.id}
              onClick={() => setTag(x.id)}
              className={cx(
                'inline-flex min-h-10 items-center gap-1 rounded-full border-2 px-3 text-sm font-bold',
                tag === x.id ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
              )}
            >
              <Icon name={x.icon} size={16} /> {t(`jr.tag.${x.id}`)}
            </button>
          ))}
        </div>
        {tag === 'emergency' && (
          <Link to="/sick" className="mb-2 flex items-center gap-2 rounded-xl bg-danger-soft p-2 text-sm font-bold text-danger">
            <Icon name="medkit" size={18} /> {t('jr.emergencyHint')}
          </Link>
        )}
        <textarea
          id="jr-text"
          rows={4}
          maxLength={RULES.maxNoteChars}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('jr.placeholder')}
          className="w-full rounded-xl border border-line bg-surface p-3 text-base leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-2 flex items-center gap-2">
          {groups && groups.length > 1 && (
            <select
              aria-label={t('jr.group')}
              value={flockId}
              onChange={(e) => setFlockId(e.target.value === '' ? '' : Number(e.target.value))}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-2"
            >
              <option value="">{t('jr.allGroups')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          <Button icon="check" className="flex-1" disabled={!text.trim()} onClick={() => void save()}>
            {t('jr.save')}
          </Button>
        </div>
      </Card>

      <Card className="mt-3">
        {cloudEnabled() ? (
          <>
            <label className="flex min-h-12 items-center justify-between gap-3 font-bold">
              {t('jr.sync')}
              <input
                type="checkbox"
                role="switch"
                className="h-7 w-7 accent-[var(--c-primary)]"
                checked={sync ?? false}
                onChange={(e) => void setNewsSync(e.target.checked)}
              />
            </label>
            <p className="text-sm text-muted">{t('jr.sync.hint')}</p>
          </>
        ) : (
          <p className="text-sm text-muted">{t('jr.sync.noCloud')}</p>
        )}
      </Card>

      {entries && entries.length === 0 && (
        <EmptyState icon="note" title={t('jr.empty')} />
      )}

      {[...byDay.entries()].map(([date, list]) => (
        <section key={date} className="mt-5">
          <h2 className="mb-2 font-extrabold text-muted">
            {date === todayISO() ? t('common.today') : dateLong(date)}
          </h2>
          <ul className="space-y-2">
            {list.map((e) => (
              <li key={e.id} className="rounded-2xl border border-line bg-surface p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={TAG_TONE[e.tag]}>{t(`jr.tag.${e.tag}`)}</Badge>
                  {e.flockId !== undefined && <span className="font-bold">{groupName(e.flockId)}</span>}
                  <span className="num text-muted">{clock(new Date(e.at))}</span>
                  {e.queuedAt && (
                    <span className="text-xs text-leaf">
                      <Icon name="check" size={12} /> {t('jr.synced')}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    onClick={() => setToDelete(e)}
                    className="ms-auto grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2"
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{e.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <ConfirmDialog
        open={toDelete !== null}
        danger
        title={t('common.delete')}
        body={t('jr.deleteConfirm')}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await db.journal.delete(toDelete.id)
          setToDelete(null)
        }}
      />
    </Page>
  )
}
