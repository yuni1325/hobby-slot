import { profitOf, type PlayRecord } from './records'

export type Totals = {
  /** 台数（記録行数） */
  count: number
  /** 稼働日数 */
  days: number
  /** 勝ち日数（日単位の収支がプラス） */
  winDays: number
  invest: number
  recover: number
  profit: number
  /** 回収率（％）。投資0なら null */
  recoverRate: number | null
}

export type MachineTotals = {
  machine: string
  count: number
  invest: number
  recover: number
  profit: number
  recoverRate: number | null
}

export type MonthTotals = Totals & { month: number; cumulative: number }

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function dateKey(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

export function todayKey(): string {
  const now = new Date()
  return dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function inMonth(rs: PlayRecord[], y: number, m: number): PlayRecord[] {
  const prefix = `${y}-${pad2(m)}-`
  return rs.filter((r) => r.date.startsWith(prefix))
}

export function inYear(rs: PlayRecord[], y: number): PlayRecord[] {
  const prefix = `${y}-`
  return rs.filter((r) => r.date.startsWith(prefix))
}

export function onDate(rs: PlayRecord[], date: string): PlayRecord[] {
  return rs
    .filter((r) => r.date === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function rate(invest: number, recover: number): number | null {
  return invest > 0 ? (recover / invest) * 100 : null
}

export function totals(rs: PlayRecord[]): Totals {
  const byDay = new Map<string, number>()
  let invest = 0
  let recover = 0
  for (const r of rs) {
    invest += r.invest
    recover += r.recover
    byDay.set(r.date, (byDay.get(r.date) ?? 0) + profitOf(r))
  }
  let winDays = 0
  for (const p of byDay.values()) if (p > 0) winDays++
  return {
    count: rs.length,
    days: byDay.size,
    winDays,
    invest,
    recover,
    profit: recover - invest,
    recoverRate: rate(invest, recover),
  }
}

/** 日別の収支（カレンダー表示用） */
export function profitByDate(rs: PlayRecord[]): Map<string, { profit: number; count: number }> {
  const map = new Map<string, { profit: number; count: number }>()
  for (const r of rs) {
    const cur = map.get(r.date) ?? { profit: 0, count: 0 }
    cur.profit += profitOf(r)
    cur.count += 1
    map.set(r.date, cur)
  }
  return map
}

/** 機種別（収支の良い順） */
export function byMachine(rs: PlayRecord[]): MachineTotals[] {
  const map = new Map<string, MachineTotals>()
  for (const r of rs) {
    const key = r.machine.trim() || '（台名なし）'
    const cur =
      map.get(key) ??
      { machine: key, count: 0, invest: 0, recover: 0, profit: 0, recoverRate: null }
    cur.count += 1
    cur.invest += r.invest
    cur.recover += r.recover
    map.set(key, cur)
  }
  return [...map.values()]
    .map((m) => ({ ...m, profit: m.recover - m.invest, recoverRate: rate(m.invest, m.recover) }))
    .sort((a, b) => b.profit - a.profit)
}

/** 1〜12月の月別集計と累計 */
export function byMonth(rs: PlayRecord[], y: number): MonthTotals[] {
  let cumulative = 0
  return Array.from({ length: 12 }, (_, i) => {
    const t = totals(inMonth(rs, y, i + 1))
    cumulative += t.profit
    return { ...t, month: i + 1, cumulative }
  })
}

/** これまでに入力した台名（よく使う順） */
export function machineHistory(rs: PlayRecord[]): string[] {
  const count = new Map<string, number>()
  for (const r of rs) {
    const k = r.machine.trim()
    if (k) count.set(k, (count.get(k) ?? 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
}

export function shopHistory(rs: PlayRecord[]): string[] {
  const count = new Map<string, number>()
  for (const r of rs) {
    const k = r.shop?.trim()
    if (k) count.set(k, (count.get(k) ?? 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
}

/** 年の候補（記録がある年＋今年） */
export function yearsWithData(rs: PlayRecord[]): number[] {
  const set = new Set<number>([new Date().getFullYear()])
  for (const r of rs) set.add(Number(r.date.slice(0, 4)))
  return [...set].sort((a, b) => b - a)
}

export function isDateKey(s: string | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(y, m - 1, d)
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d
}

