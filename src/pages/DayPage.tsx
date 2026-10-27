import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SummaryCard } from '../components/Summary'
import { dateLabel, signedYen, tone, yen } from '../lib/format'
import { profitOf } from '../lib/records'
import { useRecords } from '../lib/recordsContext'
import { dateKey, isDateKey, onDate, totals } from '../lib/stats'

function shiftDate(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(y, m - 1, d + delta)
  return dateKey(t.getFullYear(), t.getMonth() + 1, t.getDate())
}

export default function DayPage() {
  const { date } = useParams()
  const { records, remove } = useRecords()
  const valid = isDateKey(date)
  const dayRecords = useMemo(() => (valid ? onDate(records, date) : []), [records, date, valid])
  const t = useMemo(() => totals(dayRecords), [dayRecords])

  if (!valid) {
    return (
      <div className="app">
        <p>日付が正しくありません。</p>
        <Link to="/">カレンダーへ</Link>
      </div>
    )
  }

  const ym = date.slice(0, 7)

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <header className="hero">
        <p className="back-wrap">
          <Link to={`/month/${ym}`} className="back-btn">
            ← カレンダー
          </Link>
        </p>
        <div className="cal-nav">
          <Link className="btn-secondary" to={`/day/${shiftDate(date, -1)}`} replace aria-label="前の日">
            ←
          </Link>
          <h1 className="page-title">{dateLabel(date)}</h1>
          <Link className="btn-secondary" to={`/day/${shiftDate(date, 1)}`} replace aria-label="次の日">
            →
          </Link>
        </div>
      </header>

      <main className="panel">
        <div className="quick-add">
          <Link className="btn-primary" to={`/day/${date}/new`}>
            ＋ 台を追加
          </Link>
        </div>

        {dayRecords.length === 0 ? (
          <p className="hint">この日の記録はまだありません。</p>
        ) : (
          <>
            <ul className="record-list">
              {dayRecords.map((r) => {
                const p = profitOf(r)
                return (
                  <li key={r.id} className="record-card">
                    <Link to={`/day/${date}/${r.id}`} className="record-main">
                      <span className="record-top">
                        <span className="record-name">{r.machine || '（台名なし）'}</span>
                        <strong className={`record-profit ${tone(p)}`}>{signedYen(p)}</strong>
                      </span>
                      <span className="record-row">
                        投資 {yen(r.invest)} ／ 回収 {yen(r.recover)}
                        {r.shop ? ` ／ ${r.shop}` : ''}
                      </span>
                      {r.note && <span className="record-note">{r.note}</span>}
                    </Link>
                    <button
                      type="button"
                      className="btn-danger-text"
                      onClick={() => {
                        if (window.confirm(`「${r.machine || '台名なし'}」の記録を削除しますか？`)) remove(r.id)
                      }}
                    >
                      削除
                    </button>
                  </li>
                )
              })}
            </ul>
            <SummaryCard title="この日の収支" t={t} />
          </>
        )}
      </main>
    </div>
  )
}
