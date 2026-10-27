import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MonthBars from '../components/MonthBars'
import { MachineTable, SummaryCard } from '../components/Summary'
import { percent, tone } from '../lib/format'
import { useRecords } from '../lib/recordsContext'
import { byMachine, byMonth, inYear, pad2, totals } from '../lib/stats'

function n(v: number): string {
  return v.toLocaleString('ja-JP')
}

export default function YearPage() {
  const params = useParams()
  const navigate = useNavigate()
  const year = /^\d{4}$/.test(params.year ?? '') ? Number(params.year) : new Date().getFullYear()
  const { records } = useRecords()

  const yearRecords = useMemo(() => inYear(records, year), [records, year])
  const t = useMemo(() => totals(yearRecords), [yearRecords])
  const months = useMemo(() => byMonth(records, year), [records, year])
  const machines = useMemo(() => byMachine(yearRecords), [yearRecords])

  const now = new Date()
  const current = now.getFullYear() === year ? now.getMonth() + 1 : undefined

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <header className="hero">
        <p className="back-wrap">
          <Link to={`/month/${year}-${pad2(current ?? 12)}`} className="back-btn">
            ← カレンダー
          </Link>
        </p>
        <div className="cal-nav">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/year/${year - 1}`, { replace: true })} aria-label="前の年">
            ←
          </button>
          <h1 className="page-title">{year}年の収支</h1>
          <button type="button" className="btn-secondary" onClick={() => navigate(`/year/${year + 1}`, { replace: true })} aria-label="次の年">
            →
          </button>
        </div>
      </header>

      <main className="panel">
        <SummaryCard title="年間合計" t={t}>
          <MonthBars year={year} months={months} current={current} />
        </SummaryCard>

        <section className="summary" aria-label="月別">
          <h2 className="section-title">月別</h2>
          <div className="machine-table-wrap">
            <table className="machine-table">
              <thead>
                <tr>
                  <th className="left">月</th>
                  <th>日数</th>
                  <th>投資</th>
                  <th>回収</th>
                  <th>収支</th>
                  <th>累計</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.month} className={m.count ? '' : 'is-empty'}>
                    <td className="left">
                      <Link to={`/month/${year}-${pad2(m.month)}`} className="text-link">
                        {m.month}月
                      </Link>
                    </td>
                    <td>{m.days || '—'}</td>
                    <td>{m.count ? n(m.invest) : '—'}</td>
                    <td>{m.count ? n(m.recover) : '—'}</td>
                    <td className={m.count ? tone(m.profit) : ''}>
                      {m.count ? `${m.profit > 0 ? '+' : ''}${n(m.profit)}` : '—'}
                    </td>
                    <td className={tone(m.cumulative)}>
                      {m.cumulative > 0 ? '+' : ''}
                      {n(m.cumulative)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="left">計</td>
                  <td>{t.days}</td>
                  <td>{n(t.invest)}</td>
                  <td>{n(t.recover)}</td>
                  <td className={tone(t.profit)}>
                    {t.profit > 0 ? '+' : ''}
                    {n(t.profit)}
                  </td>
                  <td>{percent(t.recoverRate)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="hint">最終列の「計」は年間回収率。</p>
        </section>

        <section className="summary" aria-label="機種別">
          {machines.length ? (
            <>
            <MachineTable rows={machines} title="機種別（収支の良い順）" />
              <p className="year-link-wrap">
                <Link to={`/machines?p=year&y=${year}`} className="text-link">
                  機種別収支をくわしく見る →
                </Link>
              </p>
            </>
          ) : (
            <p className="hint">この年の記録はまだありません。</p>
          )}
        </section>
      </main>
    </div>
  )
}
