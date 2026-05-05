import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { applyTheme } from './lib/themes'
import './index.css'
import App from './App.jsx'

// 恢复持久化的主题（在 React 渲染前应用，避免闪烁）
try {
  const saved = JSON.parse(localStorage.getItem('pixel-fill-storage') || '{}')
  const theme = saved?.state?.theme || 'warm'
  applyTheme(theme)
} catch {}

// 注册 Service Worker（PWA 离线支持）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
