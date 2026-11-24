import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 起動時は常に当月のカレンダーから（前回開いていた日付ページ等を引き継がない）
if (window.location.hash && window.location.hash !== '#/') {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
