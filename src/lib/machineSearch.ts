import { MACHINES, type MachineEntry } from '../data/machines'

/**
 * 検索用の正規化:
 *  - 全角/半角・ローマ数字（Ⅱ→ii）を NFKC で統一、小文字化
 *  - カタカナ→ひらがな、ヴ系→ば行、小書き→通常
 *  - 長音・記号・空白を除去
 */
export function normalize(text: string): string {
  let s = text.normalize('NFKC').toLowerCase()
  s = s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
  s = s
    .replace(/ゔぁ/g, 'ば')
    .replace(/ゔぃ/g, 'び')
    .replace(/ゔぇ/g, 'べ')
    .replace(/ゔぉ/g, 'ぼ')
    .replace(/ゔ/g, 'ぶ')
  s = s.replace(/[ぁぃぅぇぉっゃゅょゎ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 1),
  )
  // 長音・中黒・記号・空白
  s = s.replace(/[\sー\-‐－―~〜～・･.,、。!！?？:：;；'’"”()（）「」『』【】[\]☆★♪/／&＆+＋_×]/g, '')
  return s
}

type Indexed = {
  entry: MachineEntry
  name: string
  short: string
  keys: string[]
}

const INDEX: Indexed[] = MACHINES.map((entry) => ({
  entry,
  name: normalize(entry.name),
  short: normalize(entry.short),
  keys: [entry.short, ...entry.aliases].map(normalize).filter(Boolean),
}))

const BY_NAME = new Map<string, MachineEntry>()
for (const it of INDEX) {
  BY_NAME.set(it.name, it.entry)
}

/** 正式名・略称・読みのどれかと完全一致する機種（略称・読みは1機種に絞れる時だけ） */
export function exactMatch(text: string): MachineEntry | undefined {
  const q = normalize(text)
  if (!q) return undefined
  const byName = BY_NAME.get(q)
  if (byName) return byName
  const hits = INDEX.filter((it) => it.short === q)
  if (hits.length === 1) return hits[0].entry
  return undefined
}

export function findByName(name: string): MachineEntry | undefined {
  return BY_NAME.get(normalize(name))
}

function isSubsequence(q: string, s: string): boolean {
  let i = 0
  for (const c of s) {
    if (c === q[i]) i++
    if (i === q.length) return true
  }
  return false
}

function score(it: Indexed, q: string): number {
  if (it.short === q || it.name === q) return 100
  if (it.keys.includes(q)) return 90
  if (it.short.startsWith(q)) return 80
  if (it.keys.some((k) => k.startsWith(q))) return 75
  if (it.short.includes(q)) return 65
  if (it.name.includes(q)) return 60
  if (it.keys.some((k) => k.includes(q))) return 55
  if (q.length >= 3 && (isSubsequence(q, it.short) || it.keys.some((k) => isSubsequence(q, k)))) {
    return 20
  }
  return 0
}

/** 自由入力から候補機種を返す（スコア順→新しい順） */
export function searchMachines(text: string, limit = 8): MachineEntry[] {
  const q = normalize(text)
  if (!q) return []
  return INDEX.map((it) => ({ it, s: score(it, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.it.entry.date.localeCompare(a.it.entry.date))
    .slice(0, limit)
    .map((x) => x.it.entry)
}

/** 一覧表示用の名前（DBにあれば略称） */
export function displayName(name: string): string {
  return findByName(name)?.short ?? name
}

export function typeOf(name: string): 'S' | 'P' | null {
  return findByName(name)?.type ?? null
}

/** 保存用の機種名。DBの正式名・略称と一致すれば正式名に寄せる */
export function canonicalMachine(text: string): string {
  const t = text.trim()
  return exactMatch(t)?.name ?? t
}
