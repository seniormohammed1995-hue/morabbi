import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { t, lt } from '../i18n'
import { num, parseNum } from '../i18n/format'
import type { Confidence, LocalizedText } from '../data/schema'
import { share } from '../platform'

export function cx(...c: Array<string | false | null | undefined>): string {
  return c.filter(Boolean).join(' ')
}

// ---------- Layout ----------

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx('mx-auto w-full max-w-xl px-4 pb-28 pt-2', className)}>{children}</main>
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string
  subtitle?: ReactNode
  back?: boolean
  action?: ReactNode
}) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-3 flex items-center gap-2 bg-bg/95 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
      {back && (
        <button
          type="button"
          onClick={() => nav(-1)}
          className="-ms-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2"
          aria-label={t('nav.back')}
        >
          <Icon name="back" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold leading-tight">{title}</h1>
        {subtitle && <div className="truncate text-sm text-muted">{subtitle}</div>}
      </div>
      {action}
    </header>
  )
}

export function Card({
  children,
  className,
  tone = 'plain',
}: {
  children: ReactNode
  className?: string
  tone?: 'plain' | 'primary' | 'accent' | 'leaf' | 'warn' | 'danger'
}) {
  const tones = {
    plain: 'bg-surface border-line',
    primary: 'bg-primary-soft border-primary/30',
    accent: 'bg-accent-soft border-accent/40',
    leaf: 'bg-leaf-soft border-leaf/30',
    warn: 'bg-warn-soft border-warn/30',
    danger: 'bg-danger-soft border-danger/30',
  }
  return <section className={cx('rounded-2xl border p-4 shadow-sm', tones[tone], className)}>{children}</section>
}

export function SectionTitle({ children, icon }: { children: ReactNode; icon?: IconName }) {
  return (
    <h2 className="mb-2 mt-5 flex items-center gap-2 text-lg font-bold">
      {icon && <Icon name={icon} className="text-primary" />}
      {children}
    </h2>
  )
}

/** One-line explanation of why a number is what it is. */
export function Why({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex gap-1.5 text-sm leading-relaxed text-muted">
      <Icon name="info" size={16} className="mt-1 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

// ---------- Buttons ----------

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  children,
  onClick,
  variant = 'primary',
  icon,
  type = 'button',
  disabled,
  className,
  full,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  icon?: IconName
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  full?: boolean
}) {
  const v = {
    primary: 'bg-primary text-primary-ink shadow-sm active:brightness-95',
    secondary: 'bg-surface border border-line text-ink active:bg-surface-2',
    ghost: 'text-primary active:bg-primary-soft',
    danger: 'bg-danger-soft text-danger border border-danger/30',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold transition disabled:opacity-50',
        v[variant],
        full && 'w-full',
        className,
      )}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

// ---------- Data display ----------

export function Stat({
  label,
  value,
  unit,
  icon,
  hint,
  tone,
  badge,
}: {
  label: string
  value: ReactNode
  unit?: string
  icon?: IconName
  hint?: ReactNode
  tone?: 'ok' | 'warn' | 'bad'
  badge?: ReactNode
}) {
  const toneCls = tone === 'bad' ? 'text-danger' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-leaf' : ''
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <div className="flex items-center gap-1.5 text-sm text-muted">
        {icon && <Icon name={icon} size={18} />}
        <span>{label}</span>
      </div>
      <div className={cx('num mt-0.5 text-2xl font-extrabold leading-tight', toneCls)}>
        {value}
        {unit && <span className="ms-1 text-sm font-semibold text-muted">{unit}</span>}
      </div>
      {badge}
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'warn' | 'leaf' | 'primary' | 'danger' }) {
  const tones = {
    muted: 'bg-surface-2 text-muted',
    warn: 'bg-warn-soft text-warn',
    leaf: 'bg-leaf-soft text-leaf',
    primary: 'bg-primary-soft text-primary',
    danger: 'bg-danger-soft text-danger',
  }
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold', tones[tone])}>{children}</span>
}

/** Shows "قيمة استرشادية" badge for low-confidence values. */
export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  if (confidence !== 'low') return null
  return <Badge tone="warn">{t('common.indicative')}</Badge>
}

/** Tap-to-reveal source for a sourced value or table. */
export function SourceNote({
  item,
}: {
  item: { source: string; sourceUrl: string; confidence: Confidence; note?: LocalizedText }
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 text-xs text-muted">
      <button type="button" className="inline-flex items-center gap-1 underline-offset-2 hover:underline" onClick={() => setOpen((o) => !o)}>
        <Icon name="book" size={14} />
        {t('common.source')}
        {item.confidence === 'low' && <span className="ms-1"><ConfidenceBadge confidence="low" /></span>}
      </button>
      {open && (
        <div className="mt-1 rounded-lg bg-surface-2 p-2 leading-relaxed">
          <button type="button" className="text-start text-primary underline" onClick={() => share.openExternal(item.sourceUrl)}>
            {item.source}
          </button>
          {item.note && <div className="mt-1">{lt(item.note)}</div>}
        </div>
      )}
    </div>
  )
}

// ---------- Forms ----------

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1 block font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <div className="mt-1 text-sm text-muted">{hint}</div>}
      {error && (
        <div role="alert" className="mt-1 text-sm font-semibold text-danger">
          {error}
        </div>
      )}
    </div>
  )
}

const inputCls =
  'w-full min-h-12 rounded-xl border border-line bg-surface px-3 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

/** Numeric input accepting Arabic or Latin digits. Keeps the raw text while typing. */
export function NumberInput({
  value,
  onChange,
  id,
  placeholder,
  decimal = false,
  ariaLabel,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  id?: string
  placeholder?: string
  decimal?: boolean
  ariaLabel?: string
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value))
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current) {
      setText(value === undefined ? '' : String(value))
      last.current = value
    }
  }, [value])
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      inputMode={decimal ? 'decimal' : 'numeric'}
      className={cx(inputCls, 'num text-center')}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const n = parseNum(e.target.value)
        last.current = n
        onChange(n)
      }}
    />
  )
}

/** Big +/- stepper for quick counts (e.g. deaths). */
export function Stepper({ value, onChange, label, min = 0 }: { value: number; onChange: (v: number) => void; label: string; min?: number }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`${label} +`} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-2xl font-bold text-primary" onClick={() => onChange(value + 1)}>
        +
      </button>
      <NumberInput id={id} ariaLabel={label} value={value} onChange={(v) => onChange(Math.max(min, Math.round(v ?? 0)))} />
      <button type="button" aria-label={`${label} −`} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl font-bold" onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
    </div>
  )
}

export function TextInput({ value, onChange, id, placeholder }: { value: string; onChange: (v: string) => void; id?: string; placeholder?: string }) {
  return <input id={id} className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

export function Select<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; id?: string }) {
  return (
    <select id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Large tappable choice tiles. */
export function Choice<T extends string>({
  value,
  onChange,
  options,
  cols = 2,
}: {
  value: T | undefined
  onChange: (v: T) => void
  options: Array<{ value: T; label: string; sub?: string; disabled?: boolean; badge?: ReactNode }>
  cols?: 2 | 3
}) {
  return (
    <div className={cx('grid gap-2', cols === 3 ? 'grid-cols-3' : 'grid-cols-2')} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-label={o.sub ? `${o.label} — ${o.sub}` : o.label}
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-14 rounded-xl border-2 px-3 py-2 text-start transition disabled:opacity-45',
            value === o.value ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
          )}
        >
          <div className="font-bold">{o.label}</div>
          {o.sub && <div className="text-xs text-muted">{o.sub}</div>}
          {o.badge}
        </button>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: Array<{ value: T; label: string }> }) {
  return (
    <div className="no-print -mx-4 mb-3 overflow-x-auto px-4" role="tablist">
      <div className="flex w-max gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.value}
            role="tab"
            aria-selected={value === tb.value}
            type="button"
            onClick={() => onChange(tb.value)}
            className={cx(
              'min-h-10 whitespace-nowrap rounded-full px-4 text-sm font-bold',
              value === tb.value ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-ink',
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function EmptyState({ title, body, children, icon = 'flock' }: { title: string; body?: string; children?: ReactNode; icon?: IconName }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="mb-3 grid h-20 w-20 place-items-center rounded-full bg-accent-soft text-primary">
        <Icon name={icon} size={40} />
      </div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {body && <p className="mt-2 max-w-sm text-muted">{body}</p>}
      <div className="mt-5 flex w-full max-w-xs flex-col gap-2">{children}</div>
    </div>
  )
}

// ---------- Dialog ----------

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-surface p-5 text-ink backdrop:bg-black/40"
    >
      <h2 className="text-lg font-extrabold">{title}</h2>
      {body && <p className="mt-2 text-muted">{body}</p>}
      <div className="mt-5 flex gap-2">
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} full>
          {confirmLabel ?? t('common.confirm')}
        </Button>
        <Button variant="secondary" onClick={onCancel} full>
          {t('common.cancel')}
        </Button>
      </div>
    </dialog>
  )
}

// ---------- Toast ----------

let toastListener: ((msg: string) => void) | null = null
export function toast(msg: string): void {
  toastListener?.(msg)
}
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    toastListener = (m) => {
      setMsg(m)
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(null), 2600)
    }
    return () => {
      toastListener = null
      clearTimeout(timer)
    }
  }, [])
  if (!msg) return null
  return (
    <div role="status" className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="rounded-xl bg-ink px-4 py-3 font-semibold text-bg shadow-lg">{msg}</div>
    </div>
  )
}

export function Num({ v, d = 0 }: { v: number | undefined; d?: number }) {
  return <span className="num">{num(v, d)}</span>
}
