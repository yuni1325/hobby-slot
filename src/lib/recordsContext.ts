import { createContext, useContext } from 'react'
import type { ExportResult, PlayRecord, RecordsFile } from './records'

export type RecordsContextValue = {
  file: RecordsFile
  records: PlayRecord[]
  /** 直近の保存に失敗したか */
  saveFailed: boolean
  upsert: (record: PlayRecord) => void
  remove: (id: string) => void
  exportJson: () => Promise<ExportResult>
  importJsonText: (text: string) => void
}

export const RecordsContext = createContext<RecordsContextValue | null>(null)

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext)
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider')
  return ctx
}
