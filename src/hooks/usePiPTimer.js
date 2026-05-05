/**
 * Document Picture-in-Picture 悬浮窗 Hook
 * 利用 Chrome 116+ 的 Document PiP API 创建始终置顶的迷你计时器窗口
 */
import { useEffect, useRef, useCallback } from 'react'

const PIP_WIDTH = 220
const PIP_HEIGHT = 160

// 悬浮窗内嵌的样式
const PIP_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans SC', 'Work Sans', sans-serif;
    background: #fcf7f0;
    color: #2c2416;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 12px;
    user-select: none;
    overflow: hidden;
  }
  .pip-title {
    font-size: 10px;
    font-weight: 700;
    color: #9a8a78;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }
  .pip-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 1px;
    width: 100%;
    margin-bottom: 8px;
  }
  .pip-cell {
    aspect-ratio: 1;
    border-radius: 1px;
    transition: background-color 0.3s, border-color 0.3s;
  }
  .pip-cell-empty {
    background: rgba(212, 200, 184, 0.2);
    border: 1px solid rgba(212, 200, 184, 0.15);
  }
  .pip-cell-filled {
    background: #e07840;
    border: 1px solid #d46830;
  }
  .pip-timer {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.04em;
    color: #2c2416;
  }
  .pip-timer.done {
    color: #70a080;
  }
  .pip-status {
    font-size: 9px;
    font-weight: 700;
    color: #9a8a78;
    letter-spacing: 0.1em;
    margin-top: 4px;
  }
`

export default function usePiPTimer({
  isRunning, isPaused, isFinished,
  remainingMs, progress,
}) {
  const pipWindowRef = useRef(null)
  const pipTimerRef = useRef(null)
  const pipSupported = typeof documentPictureInPicture !== 'undefined'

  // 格式化时间
  const formatTime = (ms) => {
    if (ms <= 0) return '0:00'
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // 更新悬浮窗内容
  const updatePipContent = useCallback(() => {
    const pipWin = pipWindowRef.current
    if (!pipWin || pipWin.closed) return

    const timerEl = pipWin.document.getElementById('pip-timer')
    const statusEl = pipWin.document.getElementById('pip-status')
    const gridEl = pipWin.document.getElementById('pip-grid')

    if (!timerEl) return

    // 重新读取 store 最新状态（通过 window 上的桥接）
    const state = window.__pixelFillState
    if (!state) return

    const { isRunning, isPaused, isFinished, remainingMs, progress } = state

    // 更新计时器
    if (isFinished) {
      timerEl.textContent = '完成!'
      timerEl.className = 'pip-timer done'
      statusEl.textContent = '时间到！'
    } else {
      timerEl.textContent = formatTime(remainingMs)
      timerEl.className = 'pip-timer'
      statusEl.textContent = isRunning ? '剩余时间' : isPaused ? '已暂停' : '准备就绪'
    }

    // 更新迷你网格
    if (gridEl) {
      const cells = gridEl.children
      const total = cells.length
      const filled = Math.floor(progress * total)
      for (let i = 0; i < total; i++) {
        const isFilled = i >= total - filled
        cells[i].className = isFilled ? 'pip-cell pip-cell-filled' : 'pip-cell pip-cell-empty'
      }
    }
  }, [])

  // 打开悬浮窗
  const openPiP = useCallback(async () => {
    if (!pipSupported) return
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus()
      return
    }

    try {
      const pipWin = await documentPictureInPicture.requestWindow({
        width: PIP_WIDTH,
        height: PIP_HEIGHT,
      })

      pipWindowRef.current = pipWin

      // 注入样式
      const style = pipWin.document.createElement('style')
      style.textContent = PIP_STYLES
      pipWin.document.head.appendChild(style)

      // 注入字体（从主页面复用）
      const fontLink = pipWin.document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&family=Noto+Sans+SC:wght@700&display=swap'
      pipWin.document.head.appendChild(fontLink)

      // 构建迷你网格 (10x4 = 40 格)
      const grid = pipWin.document.createElement('div')
      grid.id = 'pip-grid'
      grid.className = 'pip-grid'
      for (let i = 0; i < 40; i++) {
        const cell = pipWin.document.createElement('div')
        cell.className = 'pip-cell pip-cell-empty'
        grid.appendChild(cell)
      }

      // 计时器
      const timer = pipWin.document.createElement('div')
      timer.id = 'pip-timer'
      timer.className = 'pip-timer'
      timer.textContent = '0:00'

      // 状态文字
      const status = pipWin.document.createElement('div')
      status.id = 'pip-status'
      status.className = 'pip-status'
      status.textContent = '准备就绪'

      // 标题
      const title = pipWin.document.createElement('div')
      title.className = 'pip-title'
      title.textContent = '🧩 方块时间'

      pipWin.document.body.appendChild(title)
      pipWin.document.body.appendChild(grid)
      pipWin.document.body.appendChild(timer)
      pipWin.document.body.appendChild(status)

      // 点击悬浮窗回到主页面
      pipWin.document.body.addEventListener('click', () => {
        window.focus()
      })

      // 立即更新一次
      updatePipContent()

      // 每 500ms 更新悬浮窗
      pipTimerRef.current = setInterval(updatePipContent, 500)

      // 悬浮窗关闭时清理
      pipWin.addEventListener('pagehide', () => {
        pipWindowRef.current = null
        if (pipTimerRef.current) {
          clearInterval(pipTimerRef.current)
          pipTimerRef.current = null
        }
      })
    } catch (e) {
      console.error('无法打开悬浮窗:', e)
    }
  }, [pipSupported, updatePipContent])

  // 关闭悬浮窗
  const closePiP = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close()
    }
    pipWindowRef.current = null
    if (pipTimerRef.current) {
      clearInterval(pipTimerRef.current)
      pipTimerRef.current = null
    }
  }, [])

  // 每帧更新 window 上的桥接状态（供 PiP 定时器读取）
  useEffect(() => {
    window.__pixelFillState = {
      isRunning, isPaused, isFinished, remainingMs, progress,
    }
  }, [isRunning, isPaused, isFinished, remainingMs, progress])

  // 计时结束时自动关闭悬浮窗
  useEffect(() => {
    if (isFinished) {
      // 延迟 3 秒后关闭，让用户看到"完成!"
      const t = setTimeout(closePiP, 3000)
      return () => clearTimeout(t)
    }
  }, [isFinished, closePiP])

  // 页面卸载时清理
  useEffect(() => {
    return () => closePiP()
  }, [closePiP])

  return { pipSupported, openPiP, closePiP }
}
