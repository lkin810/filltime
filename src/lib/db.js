/**
 * IndexedDB 存储层
 * 存储详细的专注会话记录，支持数据备份/恢复
 */

const DB_NAME = 'pixel-fill-db'
const DB_VERSION = 1
const STORE_NAME = 'sessions'

/**
 * 打开/创建数据库
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('date', 'date', { unique: false })
        store.createIndex('theme', 'theme', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 添加一条专注记录
 * @param {{ id: string, date: string, duration: number, theme: string, completed: boolean }} session
 */
export async function addSession(session) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(session)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * 获取所有专注记录（按日期倒序）
 */
export async function getAllSessions() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const sessions = request.result.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )
      resolve(sessions)
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * 获取指定日期范围内的记录
 */
export async function getSessionsByRange(startDate, endDate) {
  const all = await getAllSessions()
  return all.filter((s) => {
    const d = new Date(s.date)
    return d >= startDate && d <= endDate
  })
}

/**
 * 获取今日统计
 */
export async function getTodayStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sessions = await getSessionsByRange(today, tomorrow)
  return {
    count: sessions.length,
    totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
    sessions,
  }
}

/**
 * 获取本周统计（周一开始）
 */
export async function getWeekStats() {
  const now = new Date()
  const day = now.getDay() || 7 // 周日=7
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - day + 1)

  const sessions = await getSessionsByRange(monday, now)
  return {
    count: sessions.length,
    totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
    sessions,
    dailyBreakdown: getDailyBreakdown(sessions, monday, 7),
  }
}

/**
 * 获取按日分组的统计
 */
function getDailyBreakdown(sessions, startDate, days) {
  const breakdown = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const daySessions = sessions.filter((s) => s.date.startsWith(dateStr))
    breakdown.push({
      date: dateStr,
      count: daySessions.length,
      totalMinutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
    })
  }
  return breakdown
}

/**
 * 导出所有数据为 JSON（备份）
 */
export async function exportData() {
  const sessions = await getAllSessions()
  // 同时包含 localStorage 中的简单统计数据
  const localData = JSON.parse(localStorage.getItem('pixel-fill-storage') || '{}')
  return JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    sessions,
    localStats: localData.state || {},
  }, null, 2)
}

/**
 * 从 JSON 导入数据（恢复）
 */
export async function importData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (!data.sessions || !Array.isArray(data.sessions)) {
    throw new Error('无效的备份文件格式')
  }

  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  for (const session of data.sessions) {
    store.put(session)
  }

  // 恢复 localStorage 统计
  if (data.localStats) {
    const current = JSON.parse(localStorage.getItem('pixel-fill-storage') || '{}')
    const merged = {
      ...current,
      state: {
        ...(current.state || {}),
        ...data.localStats,
      },
    }
    localStorage.setItem('pixel-fill-storage', JSON.stringify(merged))
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(data.sessions.length) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/**
 * 清除所有 IndexedDB 数据
 */
export async function clearAllSessions() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}
