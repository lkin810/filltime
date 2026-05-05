import { useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import ErrorBoundary from './components/ErrorBoundary'
import PixelFillPage from './pages/PixelFillPage.jsx'

// Phase 3: 代码分割 — 懒加载登录页
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))

function LoadingFallback() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-o border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-text">加载中...</p>
      </div>
    </div>
  )
}

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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<PixelFillPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
