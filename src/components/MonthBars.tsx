import { Link } from 'react-router-dom'
import { compactSigned, tone } from '../lib/format'
import { pad2, type MonthTotals } from '../lib/stats'

/** 1〜12月の収支を上下に伸びる棒で表示 */
export default function MonthBars({
  year,
  months,
  current,
}: {
  year: number
  months: MonthTotals[]
  current?: number
}) {
  const max = Math.max(1, ...months.map((m) => Math.abs(m.profit)))
  return (
    <div className="month-bars" role="list" aria-label={`${year}年の月別収支`}>
      {months.map((m) => {
        const h = (Math.abs(m.profit) / max) * 100
        const has = m.count > 0
        return (
          <Link
            role="listitem"
            key={m.month}
            to={`/month/${year}-${pad2(m.month)}`}
            className={`month-bar ${m.month === current ? 'is-current' : ''}`}
            aria-label={`${m.month}月 ${has ? compactSigned(m.profit) + '円' : '記録なし'}`}
          >
            <span className="month-bar-track">
              <span className="month-bar-half up">
                {m.profit > 0 && <span className="fill pos" style={{ height: `${h}%` }} />}
              </span>
              <span className="month-bar-half down">
                {m.profit < 0 && <span className="fill neg" style={{ height: `${h}%` }} />}
              </span>
            </span>
            <span className={`month-bar-val ${has ? tone(m.profit) : 'muted'}`}>
              {has ? compactSigned(m.profit, true) : '·'}
            </span>
            <span className="month-bar-label">{m.month}</span>
          </Link>
        )
      })}
    </div>
  )
}
