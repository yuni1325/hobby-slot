import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { percent, signedYen, tone, yen } from '../lib/format'
import { typeOf } from '../lib/machineSearch'
import { profitOf, type PlayRecord } from '../lib/records'
import { useRecords } from '../lib/recordsContext'
import { byMachine, inMonth, inYear, pad2, totals, type MachineTotals } from '../lib/stats'

type Period = 'month' | 'year' | 'all'
type TypeFilter = 'all' | 'S' | 'P'
type SortKey = 'profit' | 'loss' | 'count' | 'invest'

const SORT_LABEL: Record<SortKey, string> = {
  profit: '勝ち順',
  loss: '負け順',
  count: '回数順',
  invest: '投資順',
}

function sortRows(rows: MachineTotals[], key: SortKey): MachineTotals[] {
  const list = [...rows]
  if (key === 'profit') list.sort((a, b) => b.profit - a.profit)
  if (key === 'loss') list.sort((a, b) => a.profit - b.profit)
  if (key === 'count') list.sort((a, b) => b.count - a.count || b.profit - a.profit)
  if (key === 'invest') list.sort((a, b) => b.invest - a.invest)
  return list
}

function n(v: number): string {
  return v.toLocaleString('ja-JP')
}

export default function MachinesPage() {
  const [sp, setSp] = useSearchParams()
  const now = new Date()
  const period = (['month', 'year', 'all'].includes(sp.get('p') ?? '') ? sp.get('p') : 'year') as Period
  const year = Number(sp.get('y')) || now.getFullYear()
  const month = Math.min(12, Math.max(1, Number(sp.get('m')) || now.getMonth() + 1))
  const typeFilter = (['S', 'P'].includes(sp.get('t') ?? '') ? sp.get('t') : 'all') as TypeFilter
  const sortKey = (Object.keys(SORT_LABEL).includes(sp.get('s') ?? '') ? sp.get('s') : 'profit') as SortKey
  const { records } = useRecords()

  const set = (patch: Record<string, string | number>) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) next.set(k, String(v))
    setSp(next, { replace: true })
  }

  const periodRecords = useMemo(() => {
    if (period === 'month') return inMonth(records, year, month)
    if (period === 'year') return inYear(records, year)
    return records
  }, [records, period, year, month])

  const filtered = useMemo(
    () =>
      typeFilter === 'all'
        ? periodRecords
        : periodRecords.filter((r) => typeOf(r.machine) === typeFilter),
    [periodRecords, typeFilter],
  )

  const rows = useMemo(() => sortRows(byMachine(filtered), sortKey), [filtered, sortKey])
  const byName = useMemo(() => {
    const map = new Map<string, PlayRecord[]>()
    for (const r of filtered) {
      const list = map.get(r.machine) ?? []
      list.push(r)
      map.set(r.machine, list)
    }
    for (const list of map.values()) list.sort((a, b) => b.date.localeCompare(a.date))
    return map
  }, [filtered])

  const typeTotals = useMemo(() => {
    const s = totals(periodRecords.filter((r) => typeOf(r.machine) === 'S'))
    const p = totals(periodRecords.filter((r) => typeOf(r.machine) === 'P'))
    const other = totals(periodRecords.filter((r) => typeOf(r.machine) == null))
    return { s, p, other }
  }, [periodRecords])

  const shiftPeriod = (delta: number) => {
    if (period === 'month') {
      const d = new Date(year, month - 1 + delta, 1)
      set({ y: d.getFullYear(), m: d.getMonth() + 1 })
    } else if (period === 'year') {
      set({ y: year + delta })
    }
  }

  const periodLabel =
    period === 'month' ? `${year}年${month}月` : period === 'year' ? `${year}年` : '全期間'

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <header className="hero">
        <p className="back-wrap">
          <Link to={`/month/${year}-${pad2(month)}`} className="back-btn">
            ← カレンダー
          </Link>
        </p>
        <h1 className="page-title">機種別収支</h1>
      </header>

      <main className="panel">
        <div className="filter-tabs is-wide" role="group" aria-label="期間">
          {(['month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`tab ${period === p ? 'is-on' : ''}`}
              onClick={() => set({ p })}
            >
              {p === 'month' ? '月' : p === 'year' ? '年' : '全期間'}
            </button>
          ))}
        </div>

        <div className="cal-nav">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => shiftPeriod(-1)}
            disabled={period === 'all'}
            aria-label="前へ"
          >
            ←
          </button>
          <strong className="cal-month-label">{periodLabel}</strong>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => shiftPeriod(1)}
            disabled={period === 'all'}
            aria-label="次へ"
          >
            →
          </button>
        </div>

        <dl className="type-split">
          <div>
            <dt>
              <span className="type-dot is-s" aria-hidden />
              スロット
            </dt>
            <dd className={tone(typeTotals.s.count ? typeTotals.s.profit : null)}>
              {typeTotals.s.count ? signedYen(typeTotals.s.profit) : '—'}
            </dd>
          </div>
          <div>
            <dt>
              <span className="type-dot is-p" aria-hidden />
              パチンコ
            </dt>
            <dd className={tone(typeTotals.p.count ? typeTotals.p.profit : null)}>
              {typeTotals.p.count ? signedYen(typeTotals.p.profit) : '—'}
            </dd>
          </div>
          {typeTotals.other.count > 0 && (
            <div>
              <dt>その他（自由入力）</dt>
              <dd className={tone(typeTotals.other.profit)}>{signedYen(typeTotals.other.profit)}</dd>
            </div>
          )}
        </dl>

        <div className="toolbar">
          <div className="filter-tabs" role="group" aria-label="種別">
            {(['all', 'S', 'P'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`tab ${typeFilter === t ? 'is-on' : ''}`}
                onClick={() => set({ t })}
              >
                {t === 'all' ? 'すべて' : t === 'S' ? 'スロット' : 'パチンコ'}
              </button>
            ))}
          </div>
          <label className="sort-select">
            <span className="sr-only">並び順</span>
            <select value={sortKey} onChange={(e) => set({ s: e.target.value })}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="hint">この期間の記録はありません。</p>
        ) : (
          <ol className="machine-cards">
            {rows.map((m, i) => (
              <li key={m.machine}>
                <details className="machine-card">
                  <summary>
                    <span className="machine-rank">{i + 1}</span>
                    <span className="machine-card-main">
                      <span className="machine-card-name">
                        {m.type && <span className={`type-dot is-${m.type.toLowerCase()}`} aria-hidden />}
                        {m.label}
                      </span>
                      <span className="machine-card-meta">
                        {m.count}回・{m.days}日 ／ 投資 {n(m.invest)} ／ 回収率 {percent(m.recoverRate)}
                      </span>
                    </span>
                    <strong className={`machine-card-profit ${tone(m.profit)}`}>{signedYen(m.profit)}</strong>
                  </summary>
                  <ul className="machine-history">
                    {(byName.get(m.machine) ?? []).map((r) => {
                      const p = profitOf(r)
                      return (
                        <li key={r.id}>
                          <Link to={`/day/${r.date}/${r.id}`}>
                            <span className="date">{r.date.slice(5).replace('-', '/')}</span>
                            <span className="amounts">
                              {yen(r.invest)} → {yen(r.recover)}
                            </span>
                            <span className={`p ${tone(p)}`}>
                              {p > 0 ? '+' : ''}
                              {n(p)}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  {m.label !== m.machine && <p className="machine-official">{m.machine}</p>}
                </details>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
