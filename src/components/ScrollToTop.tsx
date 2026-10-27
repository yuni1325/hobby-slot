import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** 画面遷移・再表示のたびにスクロールを最上部へ戻す（スマホの復元対策） */
export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, search, hash, key])

  return null
}
