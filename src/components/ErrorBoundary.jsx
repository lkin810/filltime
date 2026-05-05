import { Component } from 'react'

/**
 * React Error Boundary：捕获子组件渲染错误，避免整个应用白屏
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen flex items-center justify-center bg-bg p-4">
          <div className="pixel-card p-8 text-center space-y-4" style={{ boxShadow: '5px 5px 0 var(--color-o3)' }}>
            <p className="text-3xl">😵</p>
            <h2 className="font-display text-xl font-bold text-ink">出了点问题</h2>
            <p className="text-sm text-muted-text">
              应用发生了意外错误，请刷新页面重试。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="pixel-button-primary px-6 py-2 text-sm"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
