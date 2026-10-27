import type { ReactNode } from 'react'
import { percent, signedYen, tone, yen } from '../lib/format'
import type { MachineTotals, Totals } from '../lib/stats'

export function SummaryCard({
  title,
  t,
  children,
}: {
  title: string
  t: Totals
  children?: ReactNode
}) {
  return (
    <section className="summary" aria-label={title}>
      <div className="summary-head">
        <h2>{title}</h2>
        <strong className={`summary-profit ${tone(t.count ? t.profit : null)}`}>
          {t.count ? signedYen(t.profit) : '—'}
        </strong>
      </div>
      <dl className="summary-grid">
        <div>
          <dt>投資</dt>
          <dd>{yen(t.invest)}</dd>
        </div>
        <div>
          <dt>回収</dt>
          <dd>{yen(t.recover)}</dd>
        </div>
        <div>
          <dt>回収率</dt>
          <dd className={tone(t.recoverRate == null ? null : t.recoverRate - 100)}>
            {percent(t.recoverRate)}
          </dd>
        </div>
        <div>
          <dt>勝ち日 / 稼働日</dt>
          <dd>
            {t.winDays} / {t.days}日
            <span className="sub">（{t.count}台）</span>
          </dd>
        </div>
      </dl>
      {children}
    </section>
  )
}

export function MachineTable({ rows, title = '台別' }: { rows: MachineTotals[]; title?: string }) {
  if (rows.length === 0) return null
  return (
    <div className="machine-table-wrap">
      <h3>{title}</h3>
      <table className="machine-table">
        <thead>
          <tr>
            <th className="left">台</th>
            <th>回数</th>
            <th>投資</th>
            <th>回収</th>
            <th>収支</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.machine}>
              <td className="left">{m.machine}</td>
              <td>{m.count}</td>
              <td>{m.invest.toLocaleString('ja-JP')}</td>
              <td>{m.recover.toLocaleString('ja-JP')}</td>
              <td className={tone(m.profit)}>
                {m.profit > 0 ? '+' : ''}
                {m.profit.toLocaleString('ja-JP')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
