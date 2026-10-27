import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import BackupActions from '../components/BackupActions'
import MonthBars from '../components/MonthBars'
import { MachineTable, SummaryCard } from '../components/Summary'
import { compactSigned, signedYen, tone } from '../lib/format'
import { useRecords } from '../lib/recordsContext'
import {
  byMachine,
  byMonth,
  dateKey,
  inMonth,
  inYear,
  pad2,
  profitByDate,
  todayKey,
  totals,
} from '../lib/stats'

function parseYm(ym: string | undefined): { year: number; month: number } {
  const m = ym?.match(/^(\d{4})-(\d{2})$/)
  if (m) {
    const month = Number(m[2])
    if (month >= 1 && month <= 12) return { year: Number(m[1]), month }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export default function CalendarPage() {
  const { ym } = useParams()
  const navigate = useNavigate()
  const { year, month } = parseYm(ym)
  const { records } = useRecords()
  const today = todayKey()

  const monthRecords = useMemo(() => inMonth(records, year, month), [records, year, month])
  const monthTotals = useMemo(() => totals(monthRecords), [monthRecords])
  const monthMachines = useMemo(() => byMachine(monthRecords), [monthRecords])
  const daily = useMemo(() => profitByDate(monthRecords), [monthRecords])
  const yearRecords = useMemo(() => inYear(records, year), [records, year])
  const yearTotals = useMemo(() => totals(yearRecords), [yearRecords])
  const months = useMemo(() => byMonth(records, year), [records, year])

  const cells = useMemo(() => {
    const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7 // 月曜始まり
    const days = new Date(year, month, 0).getDate()
    const list: Array<{ key: string; day?: number; date?: string; dow?: number }> = []
    for (let i = 0; i < firstDow; i++) list.push({ key: `e${i}` })
    for (let d = 1; d <= days; d++) {
      const date = dateKey(year, month, d)
      list.push({ key: date, day: d, date, dow: (firstDow + d - 1) % 7 })
    }
    return list
  }, [year, month])

  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    navigate(`/month/${d.getFullYear()}-${pad2(d.getMonth() + 1)}`, { replace: true })
  }

  const isThisMonth = today.startsWith(`${year}-${pad2(month)}-`)

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <header className="hero">
        <p className="brand">
          <Link to="/" className="brand-link">
            HOBBY SLOT
          </Link>
        </p>
        <p className="tagline">趣味打ちの収支カレンダー — 日付をタップして記録</p>
      </header>

      <main className="panel">
        <div className="cal-nav">
          <button type="button" className="btn-secondary" onClick={() => shift(-1)} aria-label="前の月">
            ←
          </button>
          <div className="cal-nav-center">
            <strong className="cal-month-label">
              {year}年{month}月
            </strong>
            {!isThisMonth && (
              <Link to="/" className="cal-today-link" replace>
                今月へ
              </Link>
            )}
          </div>
          <button type="button" className="btn-secondary" onClick={() => shift(1)} aria-label="次の月">
            →
          </button>
        </div>

        <div className="cal-weekdays" aria-hidden>
          {['月', '火', '水', '木', '金', '土', '日'].map((w, i) => (
            <span key={w} className={i === 5 ? 'sat' : i === 6 ? 'sun' : ''}>
              {w}
            </span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((c) => {
            if (!c.date) return <div key={c.key} className="cal-cell is-empty" />
            const d = daily.get(c.date)
            const t = d ? tone(d.profit) : ''
            return (
              <Link
                key={c.key}
                to={`/day/${c.date}`}
                className={`cal-cell ${d ? `has-data is-${t}` : ''} ${c.date === today ? 'is-today' : ''}`}
              >
                <span className={`cal-day ${c.dow === 5 ? 'sat' : c.dow === 6 ? 'sun' : ''}`}>{c.day}</span>
                {d && (
                  <>
                    <span className={`cal-delta ${t}`}>{compactSigned(d.profit)}</span>
                    <span className="cal-meta">{d.count}台</span>
                  </>
                )}
              </Link>
            )
          })}
        </div>

        <div className="quick-add">
          <Link className="btn-primary" to={`/day/${isThisMonth ? today : dateKey(year, month, 1)}/new`}>
            ＋ {isThisMonth ? '今日の' : `${month}月の`}記録を追加
          </Link>
        </div>

        <SummaryCard title={`${month}月の収支`} t={monthTotals}>
          <MachineTable rows={monthMachines} title={`${month}月の台別`} />
        </SummaryCard>

        <section className="summary year-summary" aria-label={`${year}年の収支`}>
          <div className="summary-head">
            <h2>{year}年の収支</h2>
            <strong className={`summary-profit ${tone(yearTotals.count ? yearTotals.profit : null)}`}>
              {yearTotals.count ? signedYen(yearTotals.profit) : '—'}
            </strong>
          </div>
          <MonthBars year={year} months={months} current={month} />
          <p className="year-link-wrap">
            <Link to={`/year/${year}`} className="text-link">
              {year}年の詳細（月別・台別）→
            </Link>
          </p>
        </section>

        <BackupActions />
      </main>
    </div>
  )
}
