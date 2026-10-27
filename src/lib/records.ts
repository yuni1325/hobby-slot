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

export function recordsJsonText(file: RecordsFile): string {
  return JSON.stringify(
    { ...file, version: FILE_VERSION, updatedAt: new Date().toISOString() },
    null,
    2,
  )
}

export function backupFileName(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `hobby-slot-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`
}

export type ExportResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

/**
 * バックアップの書き出し。
 * 1) 共有シート（iPhone/Android: Googleドライブ・ファイルに保存 などを選べる）
 * 2) ダウンロード（PCブラウザ）
 * ホーム画面アプリ（iOSスタンドアロン）はダウンロードが効かないため共有を優先する。
 */
export async function exportRecords(file: RecordsFile): Promise<ExportResult> {
  const text = recordsJsonText(file)
  const name = backupFileName()

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
  }
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  // スマホ（タッチ操作）とホーム画面アプリは共有シート、PCはダウンロード
  const preferShare = standalone || window.matchMedia?.('(pointer: coarse)').matches

  if (preferShare && typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    for (const type of ['application/json', 'text/plain']) {
      const f = new File([text], name, { type })
      if (!nav.canShare({ files: [f] })) continue
      try {
        await nav.share({ files: [f], title: 'HOBBY SLOT バックアップ' })
        return 'shared'
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
        break
      }
    }
  }

  if (standalone) return 'failed'

  try {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return 'downloaded'
  } catch {
    return 'failed'
  }
}
