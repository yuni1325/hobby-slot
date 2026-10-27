/** 収支記録（1台＝1行）。金額はすべて円 */

export const FILE_VERSION = 1 as const
export const STORAGE_KEY = 'hobby-slot.records.v1'

export type PlayRecord = {
  id: string
  /** YYYY-MM-DD */
  date: string
  machine: string
  invest: number
  recover: number
  shop?: string
  note?: string
  createdAt: string
  updatedAt: string
}

export type RecordsFile = {
  version: typeof FILE_VERSION
  updatedAt: string
  records: PlayRecord[]
}

export function profitOf(r: Pick<PlayRecord, 'invest' | 'recover'>): number {
  return r.recover - r.invest
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function emptyFile(): RecordsFile {
  return { version: FILE_VERSION, updatedAt: new Date().toISOString(), records: [] }
}

function isRecord(x: unknown): x is PlayRecord {
  if (!x || typeof x !== 'object') return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
    typeof r.machine === 'string' &&
    typeof r.invest === 'number' &&
    Number.isFinite(r.invest) &&
    typeof r.recover === 'number' &&
    Number.isFinite(r.recover) &&
    (r.shop === undefined || typeof r.shop === 'string') &&
    (r.note === undefined || typeof r.note === 'string') &&
    typeof r.createdAt === 'string' &&
    typeof r.updatedAt === 'string'
  )
}

export function parseRecordsFile(raw: unknown): RecordsFile {
  if (!raw || typeof raw !== 'object') throw new Error('JSONの形式が不正です')
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.records)) throw new Error('records 配列がありません')
  const records = obj.records.filter(isRecord)
  if (records.length !== obj.records.length) {
    throw new Error('不正な記録行が含まれています')
  }
  return {
    version: FILE_VERSION,
    updatedAt:
      typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
    records,
  }
}

export function loadRecordsFile(): RecordsFile {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return emptyFile()
    return parseRecordsFile(JSON.parse(text))
  } catch {
    return emptyFile()
  }
}

/** 保存できたら true（プライベートモード等で失敗し得る） */
export function saveRecordsFile(file: RecordsFile): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
    return true
  } catch {
    return false
  }
}

export function downloadRecordsJson(file: RecordsFile): void {
  const body = JSON.stringify(
    { ...file, version: FILE_VERSION, updatedAt: new Date().toISOString() },
    null,
    2,
  )
  const blob = new Blob([body], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hobby-slot-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
