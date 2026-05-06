import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import ErrorBoundary from './components/ErrorBoundary'
import PixelFillPage from './pages/PixelFillPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

export default function App() {
  const initAuth = useStore((s) => s.initAuth)
  const cleanupAuth = useStore((s) => s.cleanupAuth)
  const initRef = useRef(false)

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      initAuth()
    }
    return () => {
      // 组件卸载时清理 auth 监听器
      cleanupAuth()
    }
  }, [initAuth, cleanupAuth])

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<PixelFillPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
