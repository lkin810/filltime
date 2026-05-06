import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { getAllSessions, getTodayStats, getWeekStats, exportData, importData } from '../lib/db'
import { useStore } from '../store'

/**
 * 统计面板：显示专注统计 + 数据备份/恢复
 */
export default function StatsPanel({ onClose }) {
  const { completedSessions, totalMinutes } = useStore()
  const [activeTab, setActiveTab] = useState('week')
  const [todayData, setTodayData] = useState({ count: 0, totalMinutes: 0 })
  const [weekData, setWeekData] = useState({ count: 0, totalMinutes: 0, dailyBreakdown: [] })
  const [allSessions, setAllSessions] = useState([])
  const [importStatus, setImportStatus] = useState('')
  const fileInputRef = useRef(null)

  // 加载统计数据
  useEffect(() => {
    async function load() {
      try {
        const [today, week, sessions] = await Promise.all([
          getTodayStats(),
          getWeekStats(),
          getAllSessions(),
        ])
        setTodayData(today)
        setWeekData(week)
        setAllSessions(sessions)
      } catch (e) {
        console.error('加载统计数据失败:', e)
      }
    }
    load()
  }, [])

  const formatMinutes = (mins) => {
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  // 导出备份
  const handleExport = useCallback(async () => {
    try {
      const json = await exportData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pixel-fill-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('导出失败:', e)
    }
  }, [])

  // 导入恢复
  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const count = await importData(text)
      setImportStatus(`成功恢复 ${count} 条记录`)
      // 刷新数据
      const [today, week, sessions] = await Promise.all([
        getTodayStats(),
        getWeekStats(),
        getAllSessions(),
      ])
      setTodayData(today)
      setWeekData(week)
      setAllSessions(sessions)
    } catch (err) {
      setImportStatus('导入失败: ' + err.message)
    }
    // 重置 file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // 周统计柱状图的最大值
  const maxDaily = Math.max(1, ...weekData.dailyBreakdown.map((d) => d.totalMinutes))

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm pixel-card p-6 paper-texture space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: '5px 5px 0 var(--color-o3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-o">bar_chart</span>
            专注统计
          </h2>
          <button
            onClick={onClose}
            className="pixel-button-link w-8 h-8 flex items-center justify-center text-muted-text hover:text-ink"
            aria-label="关闭"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 汇总卡片 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-o5 border border-border-main p-3 text-center">
            <p className="font-mono text-lg font-bold text-o">{completedSessions}</p>
            <p className="text-[9px] font-bold text-muted-text">总次数</p>
          </div>
          <div className="bg-o5 border border-border-main p-3 text-center">
            <p className="font-mono text-lg font-bold text-lav">{formatMinutes(totalMinutes)}</p>
            <p className="text-[9px] font-bold text-muted-text">总时长</p>
          </div>
          <div className="bg-o5 border border-border-main p-3 text-center">
            <p className="font-mono text-lg font-bold text-sage">
              {completedSessions > 0 ? formatMinutes(Math.round(totalMinutes / completedSessions)) : '0m'}
            </p>
            <p className="text-[9px] font-bold text-muted-text">平均</p>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-1 border-b border-border-main pb-1">
          {[
            { key: 'today', label: '今日' },
            { key: 'week', label: '本周' },
            { key: 'history', label: '历史' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 text-[11px] font-bold transition-all pixel-button-link ${
                activeTab === key ? 'text-o border-b-2 border-o' : 'text-muted-text hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        {activeTab === 'today' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-muted-text">今日完成</span>
              <span className="font-mono font-bold text-ink">{todayData.count} 次 / {formatMinutes(todayData.totalMinutes)}</span>
            </div>
            {todayData.sessions?.length > 0 ? (
              <div className="space-y-1.5">
                {todayData.sessions.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex justify-between items-center bg-bg2 px-3 py-2 border border-border-main">
                    <span className="text-[11px] text-muted-text">
                      {new Date(s.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] font-bold text-ink">{s.duration} 分钟</span>
                    <span className="text-sm">{THEME_ICONS[s.theme] || '🧩'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-text text-center py-4">今天还没有专注记录，开始一次吧！</p>
            )}
          </div>
        )}

        {activeTab === 'week' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-muted-text">本周完成</span>
              <span className="font-mono font-bold text-ink">{weekData.count} 次 / {formatMinutes(weekData.totalMinutes)}</span>
            </div>
            {/* 像素风格柱状图 */}
            <div className="flex items-end gap-1.5 h-24 bg-bg2 border border-border-main p-2">
              {weekData.dailyBreakdown.map((d, i) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full transition-all duration-500"
                      style={{
                        height: d.totalMinutes > 0 ? `${Math.max(4, (d.totalMinutes / maxDaily) * 100)}%` : '2px',
                        backgroundColor: d.totalMinutes > 0 ? 'var(--color-o)' : 'var(--color-border-main)',
                        border: d.totalMinutes > 0 ? '1px solid var(--color-o2)' : 'none',
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-muted-text">{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {allSessions.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allSessions.slice(0, 30).map((s) => (
                  <div key={s.id} className="flex justify-between items-center bg-bg2 px-3 py-1.5 border border-border-main">
                    <span className="text-[10px] text-muted-text">
                      {new Date(s.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-bold text-ink">{s.duration} 分钟</span>
                    <span className="text-xs">{THEME_ICONS[s.theme] || '🧩'}</span>
                  </div>
                ))}
                {allSessions.length > 30 && (
                  <p className="text-[9px] text-muted-text text-center">
                    显示最近 30 条，共 {allSessions.length} 条
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-text text-center py-4">还没有历史记录</p>
            )}
          </div>
        )}

        {/* 数据备份 / 恢复 */}
        <div className="pt-3 border-t border-border-main space-y-2">
          <p className="text-[10px] font-bold text-muted-text tracking-[0.08em]">数据管理</p>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-bold bg-surface border-2 border-border-main text-muted-text hover:text-ink hover:bg-o5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              导出备份
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-bold bg-surface border-2 border-border-main text-muted-text hover:text-ink hover:bg-o5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              恢复数据
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
          {importStatus && (
            <p className={`text-[10px] font-bold text-center ${importStatus.startsWith('成功') ? 'text-sage' : 'text-red-500'}`}>
              {importStatus}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// 主题图标映射
const THEME_ICONS = {
  warm: '🧩',
  ocean: '🌊',
  forest: '🌿',
  starry: '🌌',
}
