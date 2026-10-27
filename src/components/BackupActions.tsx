import { useRef } from 'react'
import { useRecords } from '../lib/recordsContext'

export default function BackupActions() {
  const { exportJson, importJsonText, records, saveFailed } = useRecords()
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = async (f: File) => {
    try {
      const text = await f.text()
      if (
        records.length > 0 &&
        !window.confirm('インポートすると今の記録をすべて置き換えます。よろしいですか？')
      ) {
        return
      }
      importJsonText(text)
      window.alert('インポートしました')
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'インポートに失敗しました')
    }
  }

  return (
    <section className="backup" aria-label="バックアップ">
      {saveFailed && (
        <p className="warn">
          この端末に保存できませんでした（プライベートモード等）。エクスポートで控えを取ってください。
        </p>
      )}
      <div className="actions">
        <button type="button" className="btn-secondary" onClick={exportJson}>
          JSONエクスポート
        </button>
        <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
          JSONインポート
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void onFile(f)
          }}
        />
      </div>
      <p className="hint">
        記録はこの端末のブラウザに保存されます。機種変更やキャッシュ削除に備えて、ときどきエクスポートしてください。
      </p>
    </section>
  )
}
