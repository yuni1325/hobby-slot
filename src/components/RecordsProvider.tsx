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
import { RecordsContext } from '../lib/recordsContext'

export default function RecordsProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<RecordsFile>(() => loadRecordsFile())
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
    (text: string) => commit(parseRecordsFile(JSON.parse(text)).records),
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
