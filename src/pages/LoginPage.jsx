import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, signIn, signUp, resetPassword, authLoading } = useStore()

  // 如果已登录，跳回首页
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'sent' | 'reset' | 'reset-sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message === 'Invalid login credentials'
        ? '邮箱或密码错误'
        : error.message)
    } else if (mode === 'reset') {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setMode('reset-sent')
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setMode('sent')
      }
    }
    setLoading(false)
  }

  // 加载中
  if (authLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-o border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-muted-text">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-bg p-4">
      <motion.div
        layout
        className="w-full max-w-sm pixel-card p-8 paper-texture"
        style={{ boxShadow: '5px 5px 0 var(--color-o3)' }}
      >
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          className="pixel-button-link flex items-center gap-1 text-[11px] font-bold text-muted-text hover:text-ink mb-4"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          返回
        </button>

        {/* 标题 */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-2 border-border-main bg-o5 flex items-center justify-center pixel-card-sm">
              <span className="text-3xl">🧩</span>
            </div>
          </div>
          <h1 className="font-display text-[32px] font-bold leading-none text-ink">
            方块时间
          </h1>
          <p className="text-[12px] font-medium text-muted-text">
            登录后数据自动同步到云端
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center space-y-4"
            >
              <p className="text-sm font-bold text-ink">注册成功！</p>
              <p className="text-xs text-muted-text">
                请检查 <span className="font-bold text-o">{email}</span> 的收件箱，
                点击确认邮件后即可登录。
              </p>
              <button
                onClick={() => { setMode('login'); setEmail('') }}
                className="pixel-button-primary px-6 py-2 text-sm"
              >
                返回登录
              </button>
            </motion.div>
          ) : mode === 'reset-sent' ? (
            <motion.div
              key="reset-sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center space-y-4"
            >
              <p className="text-sm font-bold text-ink">重置链接已发送</p>
              <p className="text-xs text-muted-text">
                请检查 <span className="font-bold text-o">{email}</span> 的收件箱，
                点击邮件中的链接即可重置密码。
              </p>
              <button
                onClick={() => { setMode('login'); setEmail('') }}
                className="pixel-button-primary px-6 py-2 text-sm"
              >
                返回登录
              </button>
            </motion.div>
          ) : mode === 'reset' ? (
            <motion.form
              key="reset"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <p className="text-sm font-bold text-ink text-center">重置密码</p>
              <p className="text-[11px] text-muted-text text-center">
                输入注册时使用的邮箱，我们将发送重置链接。
              </p>

              {/* 邮箱 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-text tracking-[0.08em]">
                  邮箱
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 text-sm font-bold border-2 border-border-main bg-white text-ink placeholder:text-muted-text/50"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full pixel-button-primary py-3 text-base font-bold disabled:opacity-50"
              >
                {loading ? '发送中...' : '发送重置链接'}
              </button>

              <p className="text-xs text-center text-muted-text">
                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  className="pixel-button-link font-bold text-o hover:underline">
                  返回登录
                </button>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* 邮箱 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-text tracking-[0.08em]">
                  邮箱
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 text-sm font-bold border-2 border-border-main bg-white text-ink placeholder:text-muted-text/50"
                />
              </div>

              {/* 密码 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-text tracking-[0.08em]">
                  密码
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="w-full px-4 py-3 text-sm font-bold border-2 border-border-main bg-white text-ink placeholder:text-muted-text/50"
                />
              </div>

              {/* 忘记密码 */}
              {mode === 'login' && (
                <p className="text-xs -mt-3 text-right">
                  <button type="button" onClick={() => { setMode('reset'); setError(''); setPassword('') }}
                    className="pixel-button-link font-bold text-o hover:underline">
                    忘记密码？
                  </button>
                </p>
              )}

              {/* 错误提示 */}
              {error && (
                <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                  {error}
                </p>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full pixel-button-primary py-3 text-base font-bold disabled:opacity-50"
              >
                {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
              </button>

              {/* 切换模式 */}
              <p className="text-xs text-center text-muted-text">
                {mode === 'login' ? (
                  <>还没有账号？
                    <button type="button" onClick={() => { setMode('signup'); setError('') }}
                      className="pixel-button-link font-bold text-o hover:underline">
                      注册
                    </button>
                  </>
                ) : (
                  <>已有账号？
                    <button type="button" onClick={() => { setMode('login'); setError('') }}
                      className="pixel-button-link font-bold text-o hover:underline">
                      登录
                    </button>
                  </>
                )}
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        {/* 底部提示 */}
        <p className="mt-6 text-[9px] text-center text-muted-text leading-relaxed">
          数据存储在 Supabase 云端，RLS 安全策略保护你的隐私。
        </p>
      </motion.div>
    </div>
  )
}
