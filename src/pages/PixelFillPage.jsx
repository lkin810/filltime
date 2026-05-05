import { useEffect, useState, useRef, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store'
import { THEMES } from '../lib/themes'
import { NoisePlayer } from '../lib/noise'
import { getFillOrder, getFilledSet } from '../lib/fillPattern'
import ToggleSwitch from '../components/ToggleSwitch'
import ThemeSelector from '../components/ThemeSelector'
import NoiseSelector from '../components/NoiseSelector'
import usePiPTimer from '../hooks/usePiPTimer'

// Phase 3: 代码分割 — 懒加载统计面板和烟花效果
const StatsPanel = lazy(() => import('../components/StatsPanel'))
const FireworksCanvas = lazy(() => import('../components/FireworksCanvas'))

const PIXEL_SIZE = 28
const PRESETS = [1, 3, 5, 10, 15, 30]

export default function PixelFillPage() {
  const {
    durationMinutes, isRunning, isPaused, isFinished,
    elapsedMs, startTime, theme,
    setDuration, startTimer, pauseTimer, resumeTimer,
    resetTimer, finishTimer,
    completedSessions, totalMinutes,
    keepAwake, setKeepAwake, notificationEnabled, setNotificationEnabled,
    user, signOut,
    syncStats, syncing,
  } = useStore()

  const navigate = useNavigate()

  const containerRef = useRef(null)
  const wakeLockRef = useRef(null)
  const noisePlayerRef = useRef(null)
  const [gridDims, setGridDims] = useState({ cols: 0, rows: 0 })
  const [nowTick, setNowTick] = useState(Date.now())
  const [customInput, setCustomInput] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wakeLockSupported, setWakeLockSupported] = useState(true)
  const [notifSupported, setNotifSupported] = useState(true)
  const [activeNoise, setActiveNoise] = useState(null)
  const [noiseVolume, setNoiseVolume] = useState(0.5)
  const [showStats, setShowStats] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)

  // 当前主题的动画类名
  const currentTheme = THEMES[theme] || THEMES.warm
  const pixelAnimationClass = currentTheme.pixelAnimation || 'pixel-fade-in'

  // 初始化白噪音播放器
  useEffect(() => {
    noisePlayerRef.current = new NoisePlayer()
    return () => noisePlayerRef.current?.stop()
  }, [])

  const handleToggleNoise = useCallback((type) => {
    const player = noisePlayerRef.current
    if (!player) return
    if (activeNoise === type) {
      player.stop()
      setActiveNoise(null)
    } else {
      player.play(type)
      setActiveNoise(type)
    }
  }, [activeNoise])

  const handleNoiseVolume = useCallback((vol) => {
    setNoiseVolume(vol)
    noisePlayerRef.current?.setVolume(vol)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // 每 500ms 更新一次时间戳
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])

  // 页面从后台恢复时立即刷新时间
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setNowTick(Date.now())
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // 计算网格尺寸
  useEffect(() => {
    const updateGrid = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const cols = Math.floor(rect.width / PIXEL_SIZE)
      const rows = Math.floor(rect.height / PIXEL_SIZE)
      setGridDims({ cols, rows })
    }
    updateGrid()
    window.addEventListener('resize', updateGrid)
    return () => window.removeEventListener('resize', updateGrid)
  }, [])

  // 当前已过时间
  const currentRunMs = isRunning && startTime ? nowTick - startTime : 0
  const totalElapsedMs = elapsedMs + currentRunMs
  const totalMs = durationMinutes * 60 * 1000
  const progress = Math.min(1, totalMs > 0 ? totalElapsedMs / totalMs : 0)
  const remainingMs = Math.max(0, totalMs - totalElapsedMs)

  // 检测 API 支持情况
  useEffect(() => {
    if (!('wakeLock' in navigator)) setWakeLockSupported(false)
    if (!('Notification' in window)) setNotifSupported(false)
  }, [])

  // ===== 屏幕常亮（Wake Lock） =====
  const requestWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) return
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null
      })
    } catch {}
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isRunning && keepAwake && wakeLockSupported) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }
    return () => releaseWakeLock()
  }, [isRunning, keepAwake, wakeLockSupported, requestWakeLock, releaseWakeLock])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning && keepAwake && wakeLockSupported) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRunning, keepAwake, wakeLockSupported, requestWakeLock])

  // ===== 通知 + 提示音 =====
  const notifRequested = useRef(false)
  const audioCtxRef = useRef(null)

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      ;[800, 1000].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        const start = ctx.currentTime + i * 0.15
        gain.gain.setValueAtTime(0.25, start)
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4)
        osc.start(start)
        osc.stop(start + 0.4)
      })
    } catch {}
  }, [])

  const sendNotification = useCallback(() => {
    playBeep()
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification('方块时间', {
        body: `完成！专注了 ${durationMinutes} 分钟，所有方块已填满 🎉`,
        icon: '/icon.svg',
        silent: false,
        requireInteraction: true,
      })
    }
  }, [durationMinutes, playBeep])

  useEffect(() => {
    if (isFinished && notificationEnabled) {
      sendNotification()
      // 白噪音渐弱停止
      noisePlayerRef.current?.fadeOutAndStop()
      setActiveNoise(null)
      // 触发完成仪式
      setShowFireworks(true)
    }
  }, [isFinished, notificationEnabled, sendNotification])

  const handleToggleNotification = useCallback((val) => {
    if (val && 'Notification' in window && Notification.permission === 'denied') {
      alert('通知已被浏览器阻止，请在浏览器地址栏左侧的锁图标 → 网站设置中允许通知。')
      setNotificationEnabled(false)
      return
    }
    setNotificationEnabled(val)
    if (val && 'Notification' in window && Notification.permission === 'default' && !notifRequested.current) {
      notifRequested.current = true
      Notification.requestPermission().then((result) => {
        if (result !== 'granted') setNotificationEnabled(false)
      })
    }
  }, [setNotificationEnabled])

  // 时间到 → 自动完成
  useEffect(() => {
    if (isRunning && totalElapsedMs >= totalMs) {
      finishTimer()
    }
  }, [isRunning, totalElapsedMs, totalMs, finishTimer])

  const totalPixels = gridDims.cols * gridDims.rows
  const filledPixels = Math.floor(progress * totalPixels)

  // 根据主题生成填充顺序
  const fillOrder = useMemo(() => {
    return getFillOrder(theme, gridDims.cols, gridDims.rows)
  }, [theme, gridDims.cols, gridDims.rows])

  // 计算当前已填充的像素集合
  const filledSet = useMemo(() => {
    return getFilledSet(fillOrder, filledPixels)
  }, [fillOrder, filledPixels])

  // 像素网格（useMemo 缓存）
  const pixelElements = useMemo(() => {
    if (totalPixels <= 0) return null
    return Array.from({ length: totalPixels }).map((_, i) => {
      const filled = filledSet.has(i)
      return (
        <div
          key={i}
          className={filled ? (isFinished ? 'pixel-celebrate' : pixelAnimationClass) : ''}
          style={{
            width: PIXEL_SIZE,
            height: PIXEL_SIZE,
            backgroundColor: filled ? 'var(--color-o)' : 'transparent',
            border: filled
              ? '1px solid var(--color-o2)'
              : '1px solid var(--color-pixel-empty-border)',
            transition: 'background-color 0.3s, border-color 0.3s',
            animationDelay: filled && !isFinished ? `${((totalPixels - 1 - i) % 50) * 5}ms` : '0ms',
            animationDuration: '0.25s',
          }}
        />
      )
    })
  }, [totalPixels, filledSet, isFinished, pixelAnimationClass])

  const formatTime = (ms) => {
    if (isFinished) return '完成!'
    if (ms <= 0) return '0:00'
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const formatTotalMinutes = (mins) => {
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}min` : `${m}min`
  }

  // ===== 悬浮窗 =====
  const { pipSupported, openPiP } = usePiPTimer({
    isRunning, isPaused, isFinished,
    remainingMs, progress, durationMinutes,
  })

  const isIdle = !isRunning && !isPaused && !isFinished

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg">
      {/* ===== 像素网格 ===== */}
      <div ref={containerRef} className="absolute inset-0 flex items-start justify-center">
        {gridDims.cols > 0 && gridDims.rows > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridDims.cols}, ${PIXEL_SIZE}px)`,
              gridTemplateRows: `repeat(${gridDims.rows}, ${PIXEL_SIZE}px)`,
              gap: 0,
            }}
          >
            {pixelElements}
          </div>
        )}
      </div>

      {/* ===== 像素烟花覆盖层 ===== */}
      {showFireworks && (
        <Suspense fallback={null}>
          <FireworksCanvas
            themeColor={currentTheme['--color-o']}
            secondaryColor={currentTheme['--color-o4']}
            accentColor={currentTheme['--color-lav']}
            onDone={() => setShowFireworks(false)}
          />
        </Suspense>
      )}

      {/* ===== 顶部工具栏 ===== */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2 bg-surface border-2 border-border-main px-3 py-1.5">
            <span className="text-[11px] font-bold text-o flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">cloud</span>
              已登录
            </span>
            <span className="text-[10px] text-border-main">|</span>
            <button
              onClick={signOut}
              className="pixel-button-link text-[10px] font-bold text-muted-text hover:text-ink"
            >
              退出
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 bg-surface border-2 border-border-main px-3 py-1.5 text-[11px] font-bold text-muted-text hover:text-ink hover:bg-o5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">person</span>
            登录
          </button>
        )}
        {/* 统计按钮 */}
        <button
          onClick={() => setShowStats(!showStats)}
          className={`w-10 h-10 flex items-center justify-center border-2 border-border-main text-ink hover:bg-o5 transition-all ${
            showStats ? 'bg-o5' : 'bg-surface'
          }`}
          title="统计"
          aria-label="查看统计"
        >
          <span className="material-symbols-outlined">bar_chart</span>
        </button>
        {pipSupported && !isIdle && !isFinished && (
          <button
            onClick={openPiP}
            className="w-10 h-10 flex items-center justify-center bg-surface border-2 border-border-main text-ink hover:bg-o5 transition-all"
            title="迷你悬浮窗"
            aria-label="打开悬浮窗"
          >
            <span className="material-symbols-outlined">picture_in_picture_alt</span>
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 flex items-center justify-center bg-surface border-2 border-border-main text-ink hover:bg-o5 transition-all"
          title={isFullscreen ? '退出全屏' : '全屏'}
          aria-label={isFullscreen ? '退出全屏' : '全屏'}
        >
          <span className="material-symbols-outlined">
            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </div>

      {/* ===== 浮层控制面板（桌面：居中 / 移动：底部抽屉） ===== */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 pointer-events-none md:justify-center justify-end md:pb-0 pb-safe">
        <motion.div
          layout
          className="pointer-events-auto w-full max-w-md pixel-card p-6 md:p-8 paper-texture space-y-4 md:space-y-5
            md:max-h-[90vh] overflow-y-auto
            max-h-[80vh] md:rounded-none rounded-t-2px md:rounded-2px"
          style={{ boxShadow: '5px 5px 0 var(--color-o3)' }}
        >
          {/* 标题 */}
          <div className="text-center space-y-1">
            <h1 className="font-display text-[28px] md:text-[36px] font-bold leading-none text-ink">
              方块时间
            </h1>
            <p className="text-[11px] md:text-[12px] font-medium text-muted-text">
              像素方块逐渐填满屏幕，可视化你的专注
            </p>
          </div>

          {/* 主题选择（仅空闲时） */}
          {isIdle && <ThemeSelector />}

          {/* 预设时间（仅空闲时可选） */}
          {isIdle && (
            <div>
              <p className="text-[11px] font-bold text-muted-text mb-2 tracking-[0.08em]">
                选择时长
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setDuration(m); setCustomInput('') }}
                    className={`px-3 md:px-4 py-2 text-sm font-bold transition-all ${
                      durationMinutes === m && customInput === ''
                        ? 'pixel-button-primary'
                        : 'pixel-button-ghost text-ink'
                    }`}
                  >
                    {m < 60 ? `${m} 分钟` : `${m / 60} 小时`}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="999"
                  placeholder="自定义"
                  value={customInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomInput(val)
                    const num = parseInt(val, 10)
                    if (num > 0 && num <= 999) setDuration(num)
                  }}
                  className="w-24 px-3 py-2 text-sm font-bold text-center border-2 border-border-main bg-surface text-ink"
                />
                <span className="text-[12px] font-bold text-muted-text">分钟</span>
              </div>
            </div>
          )}

          {/* 倒计时 */}
          <div className="text-center">
            <p className={`font-mono text-[48px] md:text-[64px] font-bold leading-none tracking-[-0.04em] ${
              isFinished ? 'text-sage pixel-celebrate' : 'text-ink'
            }`}>
              {formatTime(remainingMs)}
            </p>
            <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-muted-text">
              {isRunning ? '剩余时间' : isPaused ? '已暂停' : isFinished ? '时间到！' : '准备就绪'}
            </p>
          </div>

          {/* 方块进度信息 */}
          {totalPixels > 0 && (isRunning || isPaused) && (
            <div className="text-center">
              <p className="text-[12px] font-mono font-bold text-ink">
                {filledPixels} / {totalPixels} 方块
              </p>
              <div className="mt-1 h-2 bg-bg2 border border-border-main overflow-hidden">
                <div
                  className="h-full bg-o transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-3">
            {isIdle ? (
              <button
                onClick={startTimer}
                className="col-span-2 pixel-button-primary py-3 text-base"
              >
                <span className="material-symbols-outlined align-middle text-lg mr-1">play_arrow</span>
                开始填充
              </button>
            ) : isFinished ? (
              <button
                onClick={resetTimer}
                className="col-span-2 pixel-button-primary py-3 text-base"
              >
                <span className="material-symbols-outlined align-middle text-lg mr-1">refresh</span>
                再来一次
              </button>
            ) : (
              <>
                <button
                  onClick={isRunning ? pauseTimer : resumeTimer}
                  className="py-3 px-4 font-bold text-base bg-surface border-2 border-border-main text-ink hover:bg-o5 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg text-primary">
                    {isRunning ? 'pause' : 'play_arrow'}
                  </span>
                  {isRunning ? '暂停' : '继续'}
                </button>
                <button
                  onClick={resetTimer}
                  className="py-3 px-4 font-bold text-base pixel-button-ghost text-muted-text flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">stop</span>
                  停止
                </button>
              </>
            )}
          </div>

          {/* 统计 + 功能开关 */}
          <div className="pt-2 border-t border-border-main space-y-3">
            <div className="flex justify-center gap-6 text-center">
              <div>
                <p className="font-mono text-lg font-bold text-ink">{completedSessions}</p>
                <p className="text-[9px] font-bold tracking-[0.08em] text-muted-text">完成次数</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-lav">{formatTotalMinutes(totalMinutes)}</p>
                <p className="text-[9px] font-bold tracking-[0.08em] text-muted-text">累计用时</p>
              </div>
            </div>
            {user && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={syncStats}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-surface border-2 border-border-main text-muted-text hover:text-ink hover:bg-o5 transition-all disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  {syncing ? '同步中...' : '同步数据'}
                </button>
              </div>
            )}
            {/* 白噪音 */}
            <NoiseSelector
              activeNoise={activeNoise}
              onToggle={handleToggleNoise}
              volume={noiseVolume}
              onVolumeChange={handleNoiseVolume}
            />
            {/* 功能开关 */}
            <div className="flex justify-center gap-4 pt-1">
              <ToggleSwitch
                checked={keepAwake}
                onChange={setKeepAwake}
                label="保持常亮"
              />
              <ToggleSwitch
                checked={notificationEnabled}
                onChange={handleToggleNotification}
                label="结束通知"
              />
            </div>
          </div>
        </motion.div>

        {/* 完成庆祝提示 */}
        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pointer-events-auto mt-4 pixel-card px-6 py-3 bg-o5"
              style={{ boxShadow: '3px 3px 0 var(--color-o3)' }}
            >
              <p className="text-sm font-bold text-ink flex items-center gap-2">
                <span className="text-lg">🎉</span>
                所有方块已填满！休息一下吧
                <span className="text-lg">🎉</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== 统计面板（抽屉） ===== */}
      <AnimatePresence>
        {showStats && (
          <Suspense fallback={null}>
            <StatsPanel onClose={() => setShowStats(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}
