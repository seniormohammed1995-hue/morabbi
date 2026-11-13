import { useState } from 'react'
import { geocoder, geolocation, network, type Place } from '../../platform/weather'
import { GOVERNORATES } from '../../data/rules'
import { setLocation, useLocation } from '../../store/weather'
import { t } from '../../i18n'
import { Button, Field, Select, TextInput } from '../../ui/kit'

/** GPS (optional) or governorate + optional centre search. Saves the location and refreshes weather. */
export function LocationPicker({ onDone }: { onDone?: () => void }) {
  const loc = useLocation()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [gov, setGov] = useState(loc?.governorate ?? 'cairo')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[] | null>(null)

  const locateMe = async () => {
    setBusy(true)
    setMsg(t('loc.gps.wait'))
    const p = await geolocation.current()
    setBusy(false)
    if (!p) {
      setMsg(t('loc.gps.fail'))
      return
    }
    setMsg(null)
    await setLocation({ lat: p.lat, lon: p.lon, label: t('loc.myLocation'), mode: 'gps' })
    onDone?.()
  }

  const pickGov = async (id: string) => {
    setGov(id)
    const g = GOVERNORATES.find((x) => x.id === id)!
    await setLocation({
      lat: g.lat,
      lon: g.lon,
      label: g.name,
      mode: 'governorate',
      governorate: g.id,
    })
  }

  const search = async () => {
    if (!network.online()) {
      setMsg(t('loc.center.offline'))
      return
    }
    setBusy(true)
    try {
      const g = GOVERNORATES.find((x) => x.id === gov)
      const r = await geocoder.search(q.trim())
      // Prefer places in the chosen governorate, then the rest of Egypt.
      setResults(
        [...r].sort(
          (a, b) =>
            Number(b.admin1?.includes(g?.name ?? '') ?? 0) -
            Number(a.admin1?.includes(g?.name ?? '') ?? 0),
        ),
      )
      setMsg(r.length ? null : t('loc.center.none'))
    } catch {
      setMsg(t('loc.center.offline'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {loc && (
        <p className="rounded-xl bg-leaf-soft p-3 font-semibold text-leaf">
          ✓ {t('loc.current', { name: loc.label })}
        </p>
      )}
      {geolocation.supported() && (
        <Button full icon="pin" variant="secondary" disabled={busy} onClick={() => void locateMe()}>
          {t('loc.gps')}
        </Button>
      )}
      <Field label={t('loc.gov')} htmlFor="loc-gov">
        <Select
          id="loc-gov"
          value={gov}
          onChange={(v) => void pickGov(v)}
          options={GOVERNORATES.map((g) => ({ value: g.id, label: g.name }))}
        />
      </Field>
      <Field label={t('loc.center')} htmlFor="loc-q">
        <div className="flex gap-2">
          <TextInput id="loc-q" value={q} onChange={setQ} />
          <Button
            variant="secondary"
            icon="search"
            disabled={busy || q.trim().length < 2}
            onClick={() => void search()}
          >
            {t('loc.center.search')}
          </Button>
        </div>
      </Field>
      {msg && (
        <p role="status" className="text-sm font-semibold text-muted">
          {msg}
        </p>
      )}
      {results && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                type="button"
                className="w-full rounded-xl border border-line bg-surface p-3 text-start"
                onClick={async () => {
                  await setLocation({
                    lat: r.lat,
                    lon: r.lon,
                    label: r.name,
                    mode: 'search',
                    governorate: gov,
                  })
                  setResults(null)
                  setQ('')
                  onDone?.()
                }}
              >
                <span className="font-bold">{r.name}</span>
                {r.admin1 && <span className="text-sm text-muted"> — {r.admin1}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
