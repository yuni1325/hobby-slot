import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  downloadRecordsJson,
  FILE_VERSION,
  loadRecordsFile,
  parseRecordsFile,
  saveRecordsFile,
  type PlayRecord,
  type RecordsFile,
} from '../lib/records'
import { canonicalMachine } from '../lib/machineSearch'
import { RecordsContext } from '../lib/recordsContext'

/** 既存記録の機種名をDBの正式名称に寄せる（表記揺れの解消） */
function canonicalize(file: RecordsFile): { file: RecordsFile; changed: boolean } {
  let changed = false
  const records = file.records.map((r) => {
    const name = canonicalMachine(r.machine)
    if (name === r.machine) return r
    changed = true
    return { ...r, machine: name }
  })
  return { file: changed ? { ...file, records } : file, changed }
}

export default function RecordsProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<RecordsFile>(() => {
    const { file: f, changed } = canonicalize(loadRecordsFile())
    if (changed) saveRecordsFile(f)
    return f
  })
  const [saveFailed, setSaveFailed] = useState(false)

  const commit = useCallback((records: PlayRecord[]) => {
    const next: RecordsFile = {
      version: FILE_VERSION,
      updatedAt: new Date().toISOString(),
      records,
    }
    setSaveFailed(!saveRecordsFile(next))
    setFile(next)
  }, [])

  const upsert = useCallback(
    (record: PlayRecord) =>
      commit([...file.records.filter((r) => r.id !== record.id), record]),
    [file, commit],
  )

  const remove = useCallback(
    (id: string) => commit(file.records.filter((r) => r.id !== id)),
    [file, commit],
  )

  const exportJson = useCallback(() => downloadRecordsJson(file), [file])

  const importJsonText = useCallback(
    (text: string) =>
      commit(canonicalize(parseRecordsFile(JSON.parse(text))).file.records),
    [commit],
  )

  const value = useMemo(
    () => ({
      file,
      records: file.records,
      saveFailed,
      upsert,
      remove,
      exportJson,
      importJsonText,
    }),
    [file, saveFailed, upsert, remove, exportJson, importJsonText],
  )

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>
}
