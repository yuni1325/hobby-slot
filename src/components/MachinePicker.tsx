import { useMemo, useState } from 'react'
import type { MachineType } from '../data/machines'
import { findByName, searchMachines } from '../lib/machineSearch'

type Filter = 'all' | MachineType

function TypeBadge({ type }: { type: MachineType | null }) {
  if (!type) return <span className="type-badge is-free">自由</span>
  return (
    <span className={`type-badge is-${type.toLowerCase()}`}>{type === 'S' ? 'スロ' : 'パチ'}</span>
  )
}

/**
 * 機種名の選択。DB候補から選ぶと正式名称で保存される。
 * 候補にないときは入力した文字をそのまま使える。
 */
export default function MachinePicker({
  value,
  onChange,
  recent,
  autoFocus,
}: {
  value: string
  onChange: (name: string) => void
  /** 最近使った機種（正式名称または自由入力名） */
  recent: string[]
  autoFocus?: boolean
}) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(value === '')
  const [filter, setFilter] = useState<Filter>('all')

  const selected = value ? findByName(value) : undefined
  const candidates = useMemo(() => {
    const list = searchMachines(query, 30)
    return (filter === 'all' ? list : list.filter((m) => m.type === filter)).slice(0, 8)
  }, [query, filter])

  const pick = (name: string) => {
    onChange(name)
    setQuery('')
    setEditing(false)
  }

  if (!editing && value) {
    return (
      <div className="field">
        <span className="field-label">機種</span>
        <div className="picked">
          <TypeBadge type={selected?.type ?? null} />
          <span className="picked-text">
            <strong>{selected?.short ?? value}</strong>
            {selected && selected.short !== selected.name && <small>{selected.name}</small>}
            {!selected && <small>データベースにない名前（このまま集計）</small>}
          </span>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setQuery(selected ? '' : value)
              setEditing(true)
            }}
          >
            変更
          </button>
        </div>
      </div>
    )
  }

  const trimmed = query.trim()

  return (
    <div className="field">
      <label className="field-label" htmlFor="machine-search">
        機種
      </label>
      <input
        id="machine-search"
        type="search"
        placeholder="例: リゼロ / グール / かばねり / じゃぐ"
        value={query}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (candidates[0]) pick(candidates[0].name)
            else if (trimmed) pick(trimmed)
          }
        }}
      />

      {trimmed === '' ? (
        recent.length > 0 && (
          <div className="steps">
            {recent.slice(0, 8).map((name) => (
              <button key={name} type="button" className="chip" onClick={() => pick(name)}>
                {findByName(name)?.short ?? name}
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="filter-tabs" role="group" aria-label="種別で絞り込み">
            {(['all', 'S', 'P'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`tab ${filter === f ? 'is-on' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'すべて' : f === 'S' ? 'スロット' : 'パチンコ'}
              </button>
            ))}
          </div>
          <ul className="candidates" role="listbox" aria-label="機種の候補">
            {candidates.map((m) => (
              <li key={m.name}>
                <button type="button" role="option" aria-selected={false} onClick={() => pick(m.name)}>
                  <TypeBadge type={m.type} />
                  <span className="cand-text">
                    <strong>{m.short}</strong>
                    {m.short !== m.name && <small>{m.name}</small>}
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="cand-free" onClick={() => pick(trimmed)}>
                <TypeBadge type={null} />
                <span className="cand-text">
                  <strong>「{trimmed}」で登録</strong>
                  <small>候補にない機種はこちら</small>
                </span>
              </button>
            </li>
          </ul>
        </>
      )}

      {value && (
        <button type="button" className="text-link-btn" onClick={() => setEditing(false)}>
          変更をやめる
        </button>
      )}
    </div>
  )
}
