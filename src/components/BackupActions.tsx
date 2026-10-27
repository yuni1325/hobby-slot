import { useRef, useState } from 'react'
import { recordsJsonText } from '../lib/records'
import { useRecords } from '../lib/recordsContext'

type Dialog = null | 'copy' | 'paste'

export default function BackupActions() {
  const { file, exportJson, importJsonText, records, saveFailed } = useRecords()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [message, setMessage] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [busy, setBusy] = useState(false)

  const restore = (text: string): boolean => {
    try {
      if (
        records.length > 0 &&
        !window.confirm('復元すると今の記録をすべて置き換えます。よろしいですか？')
      ) {
        return false
      }
      importJsonText(text)
      setMessage('復元しました')
      return true
    } catch (e) {
      window.alert(
        e instanceof SyntaxError
          ? 'バックアップの形式ではありません（JSONとして読めませんでした）'
          : e instanceof Error
            ? e.message
            : '復元に失敗しました',
      )
      return false
    }
  }

  const onExport = async () => {
    setBusy(true)
    setMessage('')
    const result = await exportJson()
    setBusy(false)
    if (result === 'shared') setMessage('バックアップを保存しました')
    if (result === 'downloaded') setMessage('バックアップファイルをダウンロードしました')
    if (result === 'failed') setDialog('copy')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recordsJsonText(file))
      setMessage('コピーしました。メモやGoogleドキュメントなどに貼り付けて保管してください')
      setDialog(null)
    } catch {
      window.alert('コピーできませんでした。テキストを長押しして全選択→コピーしてください')
    }
  }

  return (
    <section className="backup" aria-label="バックアップ">
      <h2 className="section-title">バックアップ</h2>
      {saveFailed && (
        <p className="warn">
          この端末に保存できませんでした（プライベートモード等）。バックアップを取ってください。
        </p>
      )}
      <div className="actions">
        <button type="button" className="btn-primary" onClick={onExport} disabled={busy}>
          バックアップを保存
        </button>
        <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
          ファイルから復元
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json,text/plain,.txt"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) restore(await f.text())
          }}
        />
      </div>
      {message && <p className="ok-msg" role="status">{message}</p>}
      <p className="hint">
        「バックアップを保存」を押すと共有メニューが開くので、<strong>「ドライブ」</strong>（Googleドライブ）や「"ファイル"に保存」を選んでください。
        復元は「ファイルから復元」でGoogleドライブ内のファイルを選びます。
      </p>
      <p className="hint">
        <button type="button" className="text-link-btn" onClick={() => setDialog('copy')}>
          テキストでコピー
        </button>
        {' ／ '}
        <button type="button" className="text-link-btn" onClick={() => setDialog('paste')}>
          テキストを貼り付けて復元
        </button>
      </p>

      {dialog && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setDialog(null)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label={dialog === 'copy' ? 'テキストでバックアップ' : 'テキストから復元'}
            onClick={(e) => e.stopPropagation()}
          >
            {dialog === 'copy' ? (
              <>
                <h3>テキストでバックアップ</h3>
                <p className="hint">
                  この画面からはファイルを保存できませんでした。下のテキストをコピーして、メモやGoogleドキュメントなどに貼り付けて保管してください。
                </p>
                <textarea readOnly value={recordsJsonText(file)} rows={8} onFocus={(e) => e.target.select()} />
                <div className="actions">
                  <button type="button" className="btn-primary" onClick={copy}>
                    コピー
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setDialog(null)}>
                    閉じる
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>テキストから復元</h3>
                <p className="hint">保管しておいたバックアップのテキストを貼り付けてください。</p>
                <textarea
                  value={pasteText}
                  rows={8}
                  placeholder='{"version":1, ... }'
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div className="actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={pasteText.trim() === ''}
                    onClick={() => {
                      if (restore(pasteText)) {
                        setPasteText('')
                        setDialog(null)
                      }
                    }}
                  >
                    復元
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setDialog(null)}>
                    閉じる
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
