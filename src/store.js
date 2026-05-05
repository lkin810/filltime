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

      // 累计（本地始终是"当前真实数据"）
      completedSessions: 0,
      totalMinutes: 0,

      // 同步状态
      syncing: false,

      // 用户
      user: null,
      session: null,
      authLoading: true,

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
          await get().loadCloudStats()
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
            await get().loadCloudStats()
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

      // ===== 登录时核对本地 ↔ 云端，取最大值 =====
      loadCloudStats: async () => {
        const { user, completedSessions, totalMinutes } = get()
        if (!user || !hasSupabaseConfig) return

        try {
          // 读取云端单条总数
          const { data, error } = await supabase
            .from('user_totals')
            .select('total_count, total_minutes')
            .eq('user_id', user.id)
            .single()

          // 如果没数据（空表），云端视为 0
          const cloudSessions = (error || !data) ? 0 : (data.total_count ?? 0)
          const cloudMinutes = (error || !data) ? 0 : (data.total_minutes ?? 0)

          // 取最大值合并
          const mergedSessions = Math.max(completedSessions, cloudSessions)
          const mergedMinutes = Math.max(totalMinutes, cloudMinutes)

          // 同步到本地
          if (mergedSessions !== completedSessions || mergedMinutes !== totalMinutes) {
            set({ completedSessions: mergedSessions, totalMinutes: mergedMinutes })
          }

          // 如果本地比云端大，回写云端
          if (mergedSessions > cloudSessions || mergedMinutes > cloudMinutes) {
            try {
              await supabase.from('user_totals').upsert({
                user_id: user.id,
                total_count: mergedSessions,
                total_minutes: mergedMinutes,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' })
            } catch {
              // 静默
            }
          }
        } catch {
          // 网络错误静默
        }
      },

      // 手动同步：本地 ↔ 云端合并
      syncStats: async () => {
        set({ syncing: true })
        await get().loadCloudStats()
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
        const { isRunning, durationMinutes, completedSessions, totalMinutes, theme } = get()
        // 防止重复调用（React 18 并发模式可能导致 useEffect 触发两次）
        if (!isRunning) return
        const newSessions = completedSessions + 1
        const newTotal = totalMinutes + durationMinutes
        // 先更新本地（始终有效）
        set({
          isRunning: false,
          isPaused: false,
          isFinished: true,
          startTime: null,
          elapsedMs: durationMinutes * 60 * 1000,
          completedSessions: newSessions,
          totalMinutes: newTotal,
        })

        // 写入 IndexedDB 详细记录
        try {
          await addSession({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: new Date().toISOString(),
            duration: durationMinutes,
            theme: theme,
            completed: true,
          })
        } catch {
          // IndexedDB 不可用时静默
        }

        // 已登录 → 直接写云端（单条 UPSERT）
        const { user } = get()
        if (user && hasSupabaseConfig) {
          try {
            const { error } = await supabase.from('user_totals').upsert({
              user_id: user.id,
              total_count: newSessions,
              total_minutes: newTotal,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            if (error) throw error
          } catch {
            // 没网也无所谓，下次登录 loadCloudStats 会补上
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
      }),
    }
  )
)

export { useStore }
