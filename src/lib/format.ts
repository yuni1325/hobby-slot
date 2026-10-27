export function yen(n: number): string {
  return `${Math.round(n).toLocaleString('ja-JP')}円`
}

export function signedYen(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '±'
  return `${sign}${Math.abs(Math.round(n)).toLocaleString('ja-JP')}円`
}

/** カレンダーのマス用の短い表記（+1.2万 / −5,000） */
export function compactSigned(n: number, tight = false): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '±'
  const a = Math.abs(Math.round(n))
  if (a >= 10000) {
    const man = a / 10000
    const whole = man >= 100 || (tight && man >= 10)
    return `${sign}${whole ? Math.round(man) : man.toFixed(1)}万`
  }
  return `${sign}${a.toLocaleString('ja-JP')}`
}

export function percent(n: number | null): string {
  return n == null ? '—' : `${n.toFixed(1)}%`
}

export function tone(n: number | null | undefined): string {
  if (n == null) return ''
  if (n > 0) return 'pos'
  if (n < 0) return 'neg'
  return 'zero'
}

export function weekdayJa(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return ['日', '月', '火', '水', '木', '金', '土'][new Date(y, m - 1, d).getDay()]
}

export function dateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${y}年${m}月${d}日（${weekdayJa(date)}）`
}

/** 「1000」「1,000」「1万」「1.5万」などを円に */
export function parseYen(text: string): number | null {
  const t = text.replace(/[,，\s円]/g, '').replace(/[０-９．]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  )
  if (t === '') return 0
  const man = t.match(/^(\d+(?:\.\d+)?)万(\d*)$/)
  if (man) {
    const rest = man[2] ? Number(man[2]) : 0
    return Math.round(Number(man[1]) * 10000 + rest)
  }
  if (!/^\d+$/.test(t)) return null
  return Number(t)
}
