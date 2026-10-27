import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { dateLabel, parseYen, signedYen, tone } from '../lib/format'
import { newId, type PlayRecord } from '../lib/records'
import { useRecords } from '../lib/recordsContext'
import MachinePicker from '../components/MachinePicker'
import { canonicalMachine } from '../lib/machineSearch'
import { isDateKey, machineHistory, shopHistory } from '../lib/stats'

const STEPS = [1000, 5000, 10000]

function YenField({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}) {
  const parsed = parseYen(value)
  const add = (n: number) => onChange(String((parsed ?? 0) + n))
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        <span className="yen-input">
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              if (parsed != null && value !== '') onChange(String(parsed))
            }}
            aria-invalid={parsed == null}
          />
          <span className="unit">円</span>
        </span>
      </label>
      <span className="steps">
        {STEPS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => add(s)}>
            +{s >= 10000 ? `${s / 10000}万` : `${s / 1000}千`}
          </button>
        ))}
        <button type="button" className="chip chip-clear" onClick={() => onChange('')}>
          クリア
        </button>
      </span>
      {parsed == null && <span className="field-error">数字で入力してください（例: 15000 / 1.5万）</span>}
    </div>
  )
}

export default function RecordFormPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { records, upsert, remove } = useRecords()
  const existing = useMemo(
    () => (params.id ? records.find((r) => r.id === params.id) : undefined),
    [records, params.id],
  )
  const machines = useMemo(() => machineHistory(records), [records])
  const shops = useMemo(() => shopHistory(records), [records])

  const [date, setDate] = useState(existing?.date ?? (isDateKey(params.date) ? params.date : ''))
  const [machine, setMachine] = useState(existing?.machine ?? '')
  const [shop, setShop] = useState(existing?.shop ?? shops[0] ?? '')
  const [invest, setInvest] = useState(existing ? String(existing.invest) : '')
  const [recover, setRecover] = useState(existing ? String(existing.recover) : '')
  const [note, setNote] = useState(existing?.note ?? '')

  if (params.id && !existing) {
    return (
      <div className="app">
        <p>記録が見つかりません。</p>
        <Link to="/">カレンダーへ</Link>
      </div>
    )
  }

  const inv = parseYen(invest)
  const rec = parseYen(recover)
  const canSave = isDateKey(date) && machine.trim() !== '' && inv != null && rec != null
  const profit = inv != null && rec != null ? rec - inv : null
  const backTo = `/day/${isDateKey(params.date) ? params.date : date}`

  const save = () => {
    if (!canSave) return
    const now = new Date().toISOString()
    const r: PlayRecord = {
      id: existing?.id ?? newId(),
      date,
      machine: canonicalMachine(machine),
      invest: inv,
      recover: rec,
      shop: shop.trim() || undefined,
      note: note.trim() || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    upsert(r)
    navigate(`/day/${date}`, { replace: true })
  }

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <header className="hero">
        <p className="back-wrap">
          <Link to={backTo} className="back-btn">
            ← {isDateKey(params.date) ? dateLabel(params.date) : '戻る'}
          </Link>
        </p>
        <h1 className="page-title">{existing ? '記録を編集' : '記録を追加'}</h1>
      </header>

      <main className="panel">
        <form
          className="record-form"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <MachinePicker
            value={machine}
            onChange={setMachine}
            recent={machines}
            autoFocus={!existing}
          />

          <YenField label="投資金額" value={invest} onChange={setInvest} />
          <YenField label="回収金額" value={recover} onChange={setRecover} />

          <div className={`profit-preview ${tone(profit)}`}>
            <span>収支</span>
            <strong>{profit == null ? '—' : signedYen(profit)}</strong>
          </div>

          <details className="more" open={Boolean(existing?.shop || existing?.note)}>
            <summary>日付・店・メモ</summary>
            <label className="field">
              <span>日付</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span>店（任意）</span>
              <input
                type="text"
                list="shop-history"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
              />
              <datalist id="shop-history">
                {shops.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>メモ（任意）</span>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </details>

          <div className="actions">
            <button type="submit" className="btn-primary" disabled={!canSave}>
              保存
            </button>
            <Link to={backTo} className="btn-secondary">
              キャンセル
            </Link>
            {existing && (
              <button
                type="button"
                className="btn-danger-text push-right"
                onClick={() => {
                  if (window.confirm('この記録を削除しますか？')) {
                    remove(existing.id)
                    navigate(`/day/${existing.date}`, { replace: true })
                  }
                }}
              >
                削除
              </button>
            )}
          </div>
          {!canSave && machine.trim() === '' && <p className="hint">機種を選ぶと保存できます。</p>}
        </form>
      </main>
    </div>
  )
}
