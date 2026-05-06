import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, hasSupabaseConfig } from './lib/supabase'
import { applyTheme, THEMES } from './lib/themes'
import { addSession } from './lib/db'

const useStore = create(
  persist(
    (set, get) => ({
      // 设置
      durationMinutes: 5,
      theme: 'warm',

      // 计时状态
      isRunning: false,
      isPaused: false,
      isFinished: false,
      elapsedMs: 0,
      startTime: null,

      // 功能开关
      keepAwake: true,
      notificationEnabled: true,

      // 累计（从 records 聚合）
      completedSessions: 0,
      totalMinutes: 0,

      // 本地详细记录（与云端 records 结构一致）
      records: [],

      // 同步状态
      syncing: false,

      // 用户
      user: null,
      session: null,
      authLoading: true,

      // ===== 工具函数：从 records 聚合统计 =====
      _calcStats: (records) => {
        const completedSessions = records.length
        const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0)
        return { completedSessions, totalMinutes }
      },

      // ===== 用户操作 =====
      setAuthLoading: (val) => set({ authLoading: val }),

      resetPassword: async (email) => {
        if (!hasSupabaseConfig) return { data: null, error: new Error('Supabase 未配置') }
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        return { data, error }
      },

      signUp: async (email, password) => {
        if (!hasSupabaseConfig) return { data: null, error: new Error('Supabase 未配置') }
        const { data, error } = await supabase.auth.signUp({ email, password })
        return { data, error }
      },

      signIn: async (email, password) => {
        if (!hasSupabaseConfig) return { data: null, error: new Error('Supabase 未配置') }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error && data.session) {
          set({ user: data.user, session: data.session })
          await get().loadCloudRecords()
        }
        return { data, error }
      },

      signOut: async () => {
        if (hasSupabaseConfig) {
          await supabase.auth.signOut()
        }
        set({ user: null, session: null })
      },

      // 初始化监听
      initAuth: async () => {
        // 凭证未配置 → 跳过 auth，直接显示页面
        if (!hasSupabaseConfig) {
          set({ authLoading: false })
          return
        }

        try {
          set({ authLoading: true })
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            set({ user: session.user, session })
            await get().loadCloudRecords()
          }
          set({ authLoading: false })

          // 保存订阅引用，以便后续清理
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
              set({ user: session.user, session })
            } else {
              set({ user: null, session: null })
            }
          })
          set({ _authSubscription: subscription })
        } catch (e) {
          console.error('Auth 初始化失败:', e)
          set({ authLoading: false })
        }
      },

      // 清理 auth 监听器
      cleanupAuth: () => {
        const { _authSubscription } = get()
        if (_authSubscription) {
          _authSubscription.unsubscribe()
          set({ _authSubscription: null })
        }
      },

      // ===== 登录时：本地 ↔ 云端合并 records =====
      loadCloudRecords: async () => {
        const { user, records: localRecords } = get()
        if (!user || !hasSupabaseConfig) return

        try {
          // 读取云端单行 records
          const { data, error } = await supabase
            .from('user_records_json')
            .select('records')
            .eq('user_id', user.id)
            .single()

          if (error) {
            console.error('❌ 读取云端失败:', error)
            return
          }

          // 云端无数据 → 空数组
          const cloudRecords = (error || !data) ? [] : (data.records || [])
          console.log('📡 云端记录:', cloudRecords.length, '条 | 本地记录:', localRecords.length, '条')

          // 合并策略：以 id 去重，相同 id 保留最新（云端优先）
          const mergedMap = new Map()

          // 先放本地记录
          for (const r of localRecords) {
            if (r.id) mergedMap.set(r.id, r)
          }

          // 云端覆盖（云端为准）
          for (const r of cloudRecords) {
            if (r.id) mergedMap.set(r.id, r)
          }

          const mergedRecords = Array.from(mergedMap.values())
            .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))

          // 计算统计
          const stats = get()._calcStats(mergedRecords)

          // 同步到本地
          set({
            records: mergedRecords,
            completedSessions: stats.completedSessions,
            totalMinutes: stats.totalMinutes,
          })

          // 如果本地有云端没有的记录，或者合并后比云端多，回写云端
          const localIds = new Set(localRecords.map(r => r.id))
          const cloudIds = new Set(cloudRecords.map(r => r.id))
          const hasLocalOnly = localRecords.some(r => !cloudIds.has(r.id))

          if (hasLocalOnly || mergedRecords.length > cloudRecords.length) {
            try {
              const { error: upsertError } = await supabase.from('user_records_json').upsert({
                user_id: user.id,
                records: mergedRecords,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' })
              if (upsertError) {
                console.error('❌ 回写云端失败:', upsertError)
              } else {
                console.log('✅ 回写云端成功')
              }
            } catch (e) {
              console.error('❌ 回写异常:', e)
            }
          }
        } catch (e) {
          console.error('❌ 同步异常:', e)
        }
      },

      // 手动同步：本地 ↔ 云端合并
      syncStats: async () => {
        set({ syncing: true })
        await get().loadCloudRecords()
        set({ syncing: false })
      },

      // ===== 时钟操作 =====
      setDuration: (minutes) => {
        const { isRunning } = get()
        if (!isRunning && minutes > 0 && minutes <= 999) {
          set({ durationMinutes: minutes })
        }
      },

      setKeepAwake: (val) => set({ keepAwake: val }),
      setNotificationEnabled: (val) => set({ notificationEnabled: val }),
      setTheme: (themeId) => {
        if (THEMES[themeId]) {
          applyTheme(themeId)
          set({ theme: themeId })
        }
      },

      startTimer: () => {
        set({
          isRunning: true,
          isPaused: false,
          isFinished: false,
          startTime: Date.now(),
          elapsedMs: 0,
        })
      },

      pauseTimer: () => {
        const { startTime, elapsedMs } = get()
        if (startTime) {
          const additional = Date.now() - startTime
          set({
            isRunning: false,
            isPaused: true,
            elapsedMs: elapsedMs + additional,
            startTime: null,
          })
        }
      },

      resumeTimer: () => {
        set({
          isRunning: true,
          isPaused: false,
          startTime: Date.now(),
        })
      },

      resetTimer: () => {
        set({
          isRunning: false,
          isPaused: false,
          isFinished: false,
          elapsedMs: 0,
          startTime: null,
        })
      },

      finishTimer: async () => {
        const { isRunning, durationMinutes, records, theme } = get()
        // 防止重复调用（React 18 并发模式可能导致 useEffect 触发两次）
        if (!isRunning) return

        // 创建一条完成记录（云端同步用）
        const newRecord = {
          id: crypto.randomUUID(),
          duration: durationMinutes,
          completedAt: new Date().toISOString(),
          theme: theme,
        }

        const newRecords = [...records, newRecord]
        const stats = get()._calcStats(newRecords)

        // 先更新本地
        set({
          isRunning: false,
          isPaused: false,
          isFinished: true,
          startTime: null,
          elapsedMs: durationMinutes * 60 * 1000,
          records: newRecords,
          completedSessions: stats.completedSessions,
          totalMinutes: stats.totalMinutes,
        })

        // 写入 IndexedDB 详细记录（本地统计面板用）
        try {
          await addSession({
            id: newRecord.id,
            date: newRecord.completedAt,
            duration: durationMinutes,
            theme: theme,
            completed: true,
          })
        } catch {
          // IndexedDB 不可用时静默
        }

        // 已登录 → 直接写云端（整行 upsert）
        const { user } = get()
        if (user && hasSupabaseConfig) {
          try {
            const { data, error } = await supabase.from('user_records_json').upsert({
              user_id: user.id,
              records: newRecords,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            if (error) {
              console.error('❌ 写入云端失败:', error)
            } else {
              console.log('✅ 云端同步成功:', newRecords.length, '条记录')
            }
          } catch (e) {
            console.error('❌ 云端写入异常:', e)
          }
        }
      },
    }),
    {
      name: 'pixel-fill-storage',
      partialize: (state) => ({
        completedSessions: state.completedSessions,
        totalMinutes: state.totalMinutes,
        durationMinutes: state.durationMinutes,
        keepAwake: state.keepAwake,
        notificationEnabled: state.notificationEnabled,
        theme: state.theme,
        records: state.records,
      }),
    }
  )
)

export { useStore }
