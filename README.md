# 🧩 方块时间 / Pixel Fill Timer

> 一个沉浸式专注计时器——时间流逝，像素方块从底部到顶部逐渐填满整个屏幕，把你的专注「可视化」。

---

## 📖 目录

- [产品亮点](#-产品亮点)
- [功能清单](#-功能清单)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [架构设计](#-架构设计)
- [数据流](#-数据流)
- [Supabase 配置](#-supabase-配置)
- [设计系统](#-设计系统)
- [组件说明](#-组件说明)
- [部署指南](#-部署指南)
- [隐私与安全](#-隐私与安全)
- [常见问题](#-常见问题)
- [开发路线](#-开发路线)

---

## ✨ 产品亮点

**方块时间** 是一个极简但富有视觉反馈的专注计时工具：

- **像素网格填充** — 屏幕由 28px × 28px 的方块网格覆盖，每过一段时间就有一个方块从底部亮起
- **时间可视化** — 不再只看数字倒计时，整个屏幕的变化让你直观感受时间流逝
- **沉浸体验** — 全屏模式 + 屏幕常亮，排除干扰
- **本地优先** — 无需登录即可使用，所有数据存本地 localStorage
- **云端可选** — 登录后自动同步到 Supabase，换设备也不丢数据
- **离线可用** — 没网也能正常计时，联网后自动合并

---

## ✅ 功能清单

### 计时核心
- [x] 像素网格填满屏幕（CSS Grid，动态计算行列数）
- [x] 从底部到顶部逐行填充
- [x] 预设时长：1 / 3 / 5 / 10 / 15 / 30 分钟
- [x] 自定义时长输入（1-999 分钟）
- [x] 倒计时显示（`MM:SS` 格式）
- [x] 暂停 / 继续 / 停止
- [x] 进度条（像素风格）

### 视觉与反馈
- [x] 方块逐个填入动画（`pixel-fade-in`：缩放 0.5 → 1.1 → 1）
- [x] 全部填满时的庆祝动画（`pixel-celebrate`：脉冲缩放）
- [x] 完成提示音（Web Audio API 生成双音调，无需外部文件）
- [x] 完成庆祝浮层

### 沉浸模式
- [x] 全屏模式（Fullscreen API，右上角切换）
- [x] 屏幕常亮（Wake Lock API，防止手机/电脑休眠）
- [x] 页面不可见时自动重获 Wake Lock

### 通知
- [x] 浏览器桌面通知弹窗
- [x] 通知权限检测（已拒绝时提示用户去浏览器设置中开启）
- [x] 通知开关

### 数据持久化
- [x] 本地 localStorage 自动保存（Zustand persist）
- [x] 完成次数累计
- [x] 专注总时长累计

### 云端同步（可选）
- [x] 邮箱密码登录 / 注册
- [x] 忘记密码（Supabase 重置邮件）
- [x] 单行 JSONB 存储：每个用户云端只存一条记录数组
- [x] 登录时以记录 id 去重合并本地和云端
- [x] 每次计时结束追加记录并 UPSERT 云端
- [x] 多设备数据自动合并
- [x] 禁止搜索引擎收录（robots.txt + noindex）

---

## 🛠 技术栈

| 层级 | 技术 | 用途 |
|---|---|---|
| **构建工具** | Vite 8 + Rolldown | 极速开发服务器和生产构建 |
| **UI 框架** | React 19 | 组件化 UI |
| **样式引擎** | Tailwind CSS v4 | 原子化 CSS + `@theme` 设计令牌 |
| **路由** | React Router v7 | SPA 客户端路由 |
| **状态管理** | Zustand 5 + `persist` | 全局状态 + localStorage 持久化 |
| **动画** | motion（原 Framer Motion） | `AnimatePresence` 过渡动画 |
| **后端** | Supabase (Auth + PostgreSQL) | 身份认证 + 数据存储 |
| **图标** | Material Symbols + emoji | UI 图标 |
| **字体** | Noto Sans/Serif SC + JetBrains Mono + Epilogue + Work Sans | 中英文混排 |

### 版本关键信息

```
React        19.2.5
Vite         8.0.10
Tailwind CSS 4.2.4
React Router 7.14.2
Zustand      5.0.13
motion       12.38.0
Supabase JS  2.105.3
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm（或 pnpm / yarn）
- 现代浏览器（Chrome 88+, Edge 88+, Firefox 90+, Safari 15+）

### 本地运行

```bash
# 1. 克隆或进入项目目录
cd pixel-fill

# 2. 安装依赖
npm install

# 3. 启动开发服务器（带 HMR 热更新）
npm run dev

# 4. 打开浏览器访问显示的地址（默认 http://localhost:5173）
```

### 生产构建

```bash
npm run build      # 输出到 dist/
npm run preview    # 本地预览构建产物
```

### 注意事项

> **PostCSS 冲突**：如果父级目录存在 `postcss.config.mjs` 或类似文件，Vite 会自动继承导致构建失败。本项目的 `postcss.config.js` 为空配置，用于覆盖父级配置。如果部署在其他环境，确保此文件存在。

---

## 📁 项目结构

```
pixel-fill/
│
├── index.html                     # HTML 入口
│   ├── 引入 Google Fonts（5 种字体）
│   ├── 引入 Material Symbols 图标库
│   ├── emoji 作为 favicon
│   └── 挂载点 <div id="root">
│
├── vite.config.js                 # Vite 构建配置
│   ├── @vitejs/plugin-react       # React 编译支持
│   ├── @tailwindcss/vite          # Tailwind CSS v4 插件
│   └── resolve.alias @ → src/     # 路径别名
│
├── postcss.config.js              # 空 PostCSS 配置（覆盖父级继承）
│
├── package.json                   # 依赖和脚本
│
├── src/
│   │
│   ├── main.jsx                   # 应用入口
│   │   ├── StrictMode             # React 严格模式
│   │   ├── BrowserRouter          # 客户端路由容器
│   │   ├── index.css              # 全局样式导入
│   │   └── App 组件挂载
│   │
│   ├── App.jsx                    # 路由定义 + 启动初始化
│   │   ├── initAuth()             # 恢复登录态（App 挂载时执行一次）
│   │   ├── Route "/" → PixelFillPage
│   │   ├── Route "/login" → LoginPage
│   │   └── Route "*" → 重定向到 /
│   │
│   ├── index.css                  # 全局样式
│   │   ├── @theme 设计令牌（颜色、字体）
│   │   ├── 全局 reset + body 网格背景
│   │   ├── 按钮基础样式（2px 边框 + hard shadow）
│   │   ├── .pixel-button-primary / .pixel-button-ghost
│   │   ├── .pixel-card / .paper-texture
│   │   ├── 自定义滚动条
│   │   └── 动画关键帧 @keyframes
│   │
│   ├── store.js                   # Zustand 全局状态（核心文件）
│   │   ├── persist → localStorage
│   │   ├── 计时状态：isRunning, isPaused, isFinished, elapsedMs, startTime
│   │   ├── 记录：records（每次专注的详细记录数组）
│   │   ├── 统计：completedSessions, totalMinutes（从 records 聚合）
│   │   ├── 用户：user, session, authLoading
│   │   ├── 设置：durationMinutes, keepAwake, notificationEnabled
│   │   ├── 操作：startTimer / pauseTimer / resumeTimer / resetTimer / finishTimer
│   │   ├── 用户：signIn / signUp / signOut / resetPassword / initAuth
│   │   └── 同步：loadCloudRecords（id 去重合并逻辑）
│   │
│   ├── lib/
│   │   └── supabase.js            # Supabase 客户端实例
│   │       ├── createClient(URL, ANON_KEY)
│   │       └── 导出 supabase 单例
│   │
│   └── pages/
│       │
│       ├── PixelFillPage.jsx      # 主页面（约 440 行）
│       │   ├── 像素网格（CSS Grid，动态计算行列）
│       │   ├── 底部到顶部填充逻辑
│       │   ├── 500ms 时间戳更新
│       │   ├── Wake Lock 管理
│       │   ├── 通知 + Web Audio 提示音
│       │   ├── 全屏切换
│       │   ├── 浮层控制面板（卡片）
│       │   │   ├── 标题 + 描述
│       │   │   ├── 预设按钮行 + 自定义输入
│       │   │   ├── 倒计时大号显示
│       │   │   ├── 方块进度信息
│       │   │   ├── 操作按钮（开始/暂停/停止/重来）
│       │   │   ├── 统计卡片（完成次数 + 累计用时）
│       │   │   └── 功能开关（常亮 + 通知）
│       │   ├── 顶部工具栏（用户信息 + 全屏）
│       │   └── 完成庆祝浮层（AnimatePresence）
│       │
│       └── LoginPage.jsx          # 登录 / 注册 / 重置密码页（约 280 行）
│           ├── 4 种模式：login / signup / sent / reset / reset-sent
│           ├── 邮箱 + 密码表单
│           ├── 错误提示
│           ├── 登录/注册模式切换
│           ├── 忘记密码链接 → 重置表单 → 发送确认
│           └── 已登录时自动跳转首页
│
└── dist/                          # 构建产物（部署用）
    ├── index.html
    └── assets/
        ├── index-*.css            # 压缩后的 CSS
        └── index-*.js             # 压缩后的 JS bundle
```

---

## 🏗 架构设计

### 单行 JSONB 存储 + 记录级去重合并

本项目采用 **单行 JSONB** 作为数据同步策略。每个用户在云端只占一行，所有专注记录存在一个 JSONB 数组里，兼顾了轻量性和数据可追溯性。

#### 核心思路

每个用户在 Supabase 的 `user_records_json` 表中只有 **1 行数据**（由 `UNIQUE(user_id)` 约束），`records` 列是一个 JSONB 数组，存储每次专注的详细记录。

```
┌─────────────────────────────────────────────────────────┐
│                     用户本地设备                          │
│                                                         │
│  localStorage (Zustand persist)                         │
│  ┌─────────────────────────────────────┐                │
│  │ records: [                          │                │
│  │   { id, duration, completedAt },    │                │
│  │   { id, duration, completedAt },    │                │
│  │   ...                               │                │
│  │ ]                                   │                │
│  │ completedSessions: 5 (聚合自records) │                │
│  │ totalMinutes: 45   (聚合自records) │                │
│  │ keepAwake: true                     │                │
│  │ notificationEnabled: true           │                │
│  └─────────────────────────────────────┘                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ 登录时：id 去重合并
                       │ 计时结束：追加记录 + UPSERT
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     Supabase 云端                        │
│                                                         │
│  user_records_json 表                                    │
│  ┌─────────────────────────────────────┐                │
│  │ id (PK, auto)   │ uuid              │                │
│  │ user_id (UNIQUE)│ d559fdbe-...      │                │
│  │ records (JSONB) │ [                 │                │
│  │                  │   {"id":"a1...",  │                │
│  │                  │    "duration":5,  │                │
│  │                  │    "completedAt": │                │
│  │                  │     "2026-05-06"}, │                │
│  │                  │   ...             │                │
│  │                  │ ]                 │                │
│  │ updated_at      │ 2026-05-06T...    │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

#### 为什么选单行 JSONB？

| 对比 | 多行记录（传统） | 单行 JSONB（本项目） |
|---|---|---|
| 云端数据量 | 每完成一次多一行 | 始终只有 1 行 |
| 写入操作 | INSERT 单条 | UPSERT 整行 |
| 合并复杂度 | 需要去重、时间戳比对 | 以 id 去重合并数组 |
| 失败恢复 | 需要补传队列 | 下次写入自动覆盖 |
| 数据可追溯 | 能看到每次记录 | 同样能看到每次记录 |
| 扩展性 | 加字段需 ALTER TABLE | JSONB 里直接加字段 |
| 查询效率 | 可按字段索引 | 可建 GIN 索引 |

单行 JSONB 既保留了完整的历史记录，又保持了极简的云端结构，加字段不用改表，非常适合个人轻量工具。

#### 合并策略

```
1. 本地 records 和云端 records 都放进 Map，以 id 为 key
2. 云端记录覆盖本地（云端为准）
3. 转回数组，按 completedAt 排序
4. 聚合计算 completedSessions = records.length
5. 聚合计算 totalMinutes = sum(records.duration)
6. 如果有本地独有的记录（云端没有），回写云端
```

逻辑清晰：
- **相同 id 的记录以云端为准**，避免冲突
- **本地独有的记录也会合并进云端**，不丢失
- 换设备 → 云端记录覆盖本地 → 自动补齐
- 合并后如果比云端多 → 回写云端

---

## 🔄 数据流

### 应用启动流程

```
打开页面
  │
  ├─→ App.jsx useEffect 调用 initAuth()
  │     │
  │     ├─→ supabase.auth.getSession() 恢复 session
  │     │     │
  │     │     ├─ session 有效 → 设置 user → loadCloudRecords()
  │     │     │     │
  │     │     │     ├─ 从 user_records_json 读取云端 records
  │     │     │     ├─ 以 id 去重合并本地↔云端
  │     │     │     └─ 如果有本地独有记录 → 回写云端
  │     │     │
  │     │     └─ session 无效 → user = null，纯本地模式
  │     │
  │     └─ 订阅 onAuthStateChange（监听登录/登出事件）
  │
  └─→ 用户看到 PixelFillPage 主界面
```

### 计时结束流程

```
时间到（totalElapsedMs >= totalMs）
  │
  ├─→ PixelFillPage useEffect 检测到 → 调用 finishTimer()
  │
  ├─→ finishTimer() 内部：
  │     │
  │     ├─ 1. 创建新记录 { id: uuid, duration, completedAt }
  │     ├─ 2. 追加到 records 数组
  │     ├─ 3. 从 records 聚合统计（completedSessions, totalMinutes）
  │     ├─ 4. set() 更新本地状态（Zustand → localStorage）
  │     │     ├─ isRunning = false
  │     │     ├─ isFinished = true
  │     │     ├─ records = newRecords
  │     │     ├─ completedSessions = 聚合值
  │     │     └─ totalMinutes = 聚合值
  │     │
  │     └─ 5. if (user) 已登录
  │              │
  │              ├─ supabase.from('user_records_json').upsert({
  │              │     user_id: user.id,
  │              │     records: newRecords,
  │              │     updated_at: ...
  │              │   })
  │              │
  │              └─ 失败？→ 静默忽略，下次自动补上
  │
  ├─→ PixelFillPage 重新渲染：
  │     ├─ isFinished = true → 显示 🎉 庆祝浮层
  │     ├─ sendNotification() → 播放提示音 + 弹窗通知
  │     └─ 所有方块变成 pixel-celebrate 动画
  │
  └─→ 用户点击"再来一次" → resetTimer()
```

### 登录流程

```
用户点击"登录"按钮 → 跳转 /login
  │
  ├─→ LoginPage 渲染表单
  │
  ├─→ 用户输入邮箱 + 密码 → handleSubmit()
  │     │
  │     ├─ signIn(email, password)
  │     │     │
  │     │     ├─ supabase.auth.signInWithPassword()
  │     │     ├─ 成功 → set({ user, session })
  │     │     ├─ loadCloudRecords() → id 去重合并本地↔云端
  │     │     └─ 返回 / 首页（user 变化触发 useEffect 跳转）
  │     │
  │     └─ 失败 → 显示错误信息
  │
  └─→ PixelFillPage 顶部显示 "☁️ 已登录"
```

---

## 🗄 Supabase 配置

### 数据库表

本项目只需要一张表，采用 JSONB 存储所有专注记录：

```sql
-- 在 Supabase SQL Editor 执行

CREATE TABLE public.user_records_json (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  records JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

| 列名 | 类型 | 说明 |
|---|---|---|
| `id` | UUID (PK) | 自动生成的主键 |
| `user_id` | UUID (UNIQUE) | 用户 ID，关联 `auth.users`，唯一约束确保每用户一条 |
| `records` | JSONB | 专注记录数组，每条包含 `{ id, duration, completedAt }` |
| `updated_at` | TIMESTAMPTZ | 最后更新时间 |

#### records 中每条记录的结构

```json
{
  "id": "uuid-v4",          // 唯一标识，用于去重合并
  "duration": 5,            // 专注时长（分钟）
  "completedAt": "2026-05-06T12:00:00.000Z"  // 完成时间
}
```

### 行级安全（RLS）

```sql
ALTER TABLE public.user_records_json ENABLE ROW LEVEL SECURITY;

CREATE POLICY "只能查看自己的JSON记录"
ON public.user_records_json
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "只能插入自己的JSON记录"
ON public.user_records_json
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "只能更新自己的JSON记录"
ON public.user_records_json
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

GRANT ALL ON public.user_records_json TO authenticated;
```

三条策略确保用户只能看到和操作自己的数据。

### 本地配置

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co'
const supabaseAnonKey = 'sb_publishable_YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

> ⚠️ `supabaseUrl` 和 `supabaseAnonKey` 直接从后端获取。**anon key 是可以公开的**，它只触发 RLS 策略，无法绕过权限控制。但 **service role key** 绝不能放在前端代码中。

### 认证流程

```
注册 → 邮箱确认邮件 → 点击确认 → 可登录
  ↓
登录 → Supabase 返回 Session（JWT）
  ↓
Session 存浏览器 localStorage（supabase-js 自动管理）
  ↓
页面刷新 → getSession() 恢复 → JWT 自动刷新
  ↓
所有请求携带 Authorization: Bearer <JWT>
  ↓
RLS 策略用 auth.uid() 提取用户 ID 校验权限
```

---

## 🎨 设计系统

### 设计理念

本项目采用 **像素风格（Pixel Art）** 与 **暖色调（Warm Tone）** 融合的设计语言：
- 硬边 2px 圆角，无圆润感
- 实色阴影（`box-shadow` 无 blur 参数），模仿像素阴影
- 暖橙色为主色调，奶油色为背景
- 纸张纹理背景增加质感
- 按钮按下物理下移 2px

### 颜色体系

```
主色调（暖橙）
  o  (#e07840)  主色 — 按钮背景、已填充方块、进度条
  o2 (#d46830)  深色 — 按钮悬停、方块边框
  o3 (#c05828)  阴影 — 所有 box-shadow
  o4 (#f0a070)  浅色 — 滚动条滑块
  o5 (#fff0e8)  极浅 — 按钮悬停背景、卡片背景

辅助色
  lav (#b088c0)  紫色 — 累计用时数字
  sage (#70a080) 绿色 — "完成！" 状态文字

中性色
  ink (#2c2416)      墨色 — 主文字
  bg  (#fcf7f0)      暖白 — 页面背景
  bg2 (#f5eee4)      暖灰 — 进度条背景
  border-main (#d4c8b8)  边框色
  muted-text (#9a8a78)   辅助文字
```

### 字体层级

```
标题 / Logo：  Epilogue (英文) + Noto Serif SC (中文)  36px 粗体
UI 文字：      Work Sans (英文) + Noto Sans SC (中文)  11-14px 粗体
数字 / 代码：  JetBrains Mono  64px 粗体（倒计时）
```

### 组件样式

**`.pixel-card`** — 主卡片容器
```css
border: 2px solid var(--color-border-main);
border-radius: 2px;
box-shadow: 4px 4px 0 var(--color-o3);
background: white;
```

**`.pixel-button-primary`** — 主操作按钮
```css
background: var(--color-o);
color: white;
border: 2px solid var(--color-o2);
box-shadow: 3px 3px 0 var(--color-o3);
```

**`.pixel-button-ghost`** — 次要按钮
```css
background: transparent;
border: 2px solid var(--color-border-main);
box-shadow: 2px 2px 0 var(--color-o3);
```

**`.paper-texture`** — 纸张纹理叠加
```css
background-image: repeating-linear-gradient(
  0deg, transparent, transparent 18px,
  rgba(0,0,0,0.03) 18px, rgba(0,0,0,0.03) 19px
);
```

### 动画

**方块填入动画 `pixel-fade-in`**
```css
@keyframes pixel-fade-in {
  0%   { opacity: 0; transform: scale(0.5); }
  60%  { opacity: 1; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}
```
每个方块延迟 `((totalPixels - 1 - i) % 50) * 5ms`，形成波浪效果。

**庆祝动画 `pixel-celebrate`**
```css
@keyframes pixel-celebrate {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}
```
全部填满后所有方块持续脉冲。

---

## 📄 组件说明

### PixelFillPage（主页面）

这是应用唯一的主页面，约 440 行 JSX。核心逻辑：

**像素网格**
- 使用 `containerRef` 测量容器实际宽高
- `cols = floor(width / 28)`，`rows = floor(height / 28)`
- CSS Grid 渲染 `cols × rows` 个方块
- 填充顺序：`filled = i >= totalPixels - filledPixels`（从底部开始）
- `filledPixels = floor(progress × totalPixels)`

**计时器**
- `nowTick` 每 500ms 更新一次，驱动倒计时计算
- `currentRunMs = nowTick - startTime`（仅运行时）
- `totalElapsedMs = elapsedMs + currentRunMs`
- `remainingMs = max(0, totalMs - totalElapsedMs)`
- 时间到 → useEffect 检测 → `finishTimer()`

**Wake Lock**
- 运行 + 开启常亮 → 请求 `navigator.wakeLock.request('screen')`
- 页面可见性变化 → 自动重获锁（浏览器会释放不可见页面的锁）
- 停止 / 暂停 → 释放锁

**提示音**
- Web Audio API 创建 `OscillatorNode`
- 连续两音调：800Hz → 1000Hz，间隔 150ms
- 每次 `sendNotification()` 先播放声音，再弹通知

### LoginPage（登录页）

约 280 行 JSX，支持 5 种模式：

| 模式 | 说明 |
|---|---|
| `login` | 邮箱 + 密码登录表单，底部"忘记密码？"链接 |
| `signup` | 注册表单，底部"已有账号？"链接 |
| `sent` | 注册成功提示：检查邮箱确认邮件 |
| `reset` | 重置密码：输入邮箱发送重置链接 |
| `reset-sent` | 重置链接已发送提示 |

切换模式时使用 `AnimatePresence mode="wait"` + `motion.form` 做过渡动画。

### store.js（状态管理）

Zustand store 是整个应用的数据中枢，使用 `persist` 中间件自动同步到 `localStorage`。

**持久化的字段**（页面刷新后保留）：
- `completedSessions` / `totalMinutes` 累计统计
- `durationMinutes` 上次选择的时长
- `keepAwake` / `notificationEnabled` 开关状态

**不持久化的字段**（页面刷新后重新获取）：
- `isRunning` / `isPaused` / `isFinished` / `elapsedMs` / `startTime` 计时状态
- `user` / `session` / `authLoading` 用户状态

> 计时状态不持久化的原因：刷新页面后继续计时没有意义，应该重置。用户状态通过 `initAuth()` 从 Supabase 恢复。

---

## 🌐 部署指南

### 部署到 Netlify（推荐）

```bash
# 1. 构建
npm run build

# 2. 将 dist/ 文件夹拖入
#    https://app.netlify.com/drop
```

Netlify 会自动处理 SPA 路由（所有路径指向 `index.html`），无需额外配置。

### 部署到其他平台

如果部署到 Vercel、Cloudflare Pages 等，需要添加 SPA 路由重写规则：

**Vercel** — 项目根目录创建 `vercel.json`：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Cloudflare Pages** — 在配置中添加 SPA 模式。

---

## 🔒 隐私与安全

### 模型：本地优先 + 可选的云端备份

```
                    ┌──────────┐
                    │ 浏览器   │
                    │ localStorage │
                    └─────┬────┘
                          │ 可选登录
                    ┌─────▼────┐
                    │ Supabase │
                    │ 云端备份 │
                    └──────────┘
```

- **不上传任何个人身份信息**（仅邮箱用于登录认证）
- **不追踪**、**不分析**、**不收集使用数据**
- **不开后门**，所有代码开源可见
- **禁止搜索引擎收录**（`robots.txt` + `noindex` meta），私人工具不暴露给爬虫

### Supabase 安全模型

| 层 | 保护机制 |
|---|---|
| **传输** | HTTPS 加密 |
| **认证** | JWT + Supabase Auth，自动刷新 |
| **授权** | RLS 策略：`auth.uid() = user_id` |
| **数据隔离** | 每行数据绑定用户 ID |
| **密钥管理** | Anon key 可公开（受 RLS 保护），Service key 保密 |

### 前端安全注意事项

1. **Anon key 暴露没问题**：它只能触发 RLS 策略保护的操作，无法越权
2. **Service role key 绝不能放前端**：它绕过所有 RLS
3. **邮箱验证**：Supabase 默认要求邮箱验证后才可登录
4. **密码安全**：密码由 Supabase 处理（bcrypt 哈希），前端不接触原始密码

---

## ❓ 常见问题

### 计时结束后数据没有同步到云端？

可能原因：
1. **未登录** — 检查页面右上角是否显示"☁️ 已登录"
2. **GRANT 没执行** — 在 Supabase SQL Editor 执行：`GRANT ALL ON public.user_records_json TO authenticated;`
3. **邮箱未确认** — Supabase 默认要求邮箱验证，检查收件箱
4. **浏览器阻止了请求** — 检查 DevTools → Network 面板是否有错误

### 本地和云端数据对不上？

系统使用 id 去重合并策略，会自动修正。如果仍然不对：
- 重新登录一次触发 `loadCloudRecords`
- 检查 `localStorage` 中 `pixel-fill-storage` 键的值

### 通知没有弹出？

- 浏览器需要授予通知权限
- 如果之前点过"阻止"，需要去浏览器设置中取消阻止
- 页面获得焦点时，Chrome 不会弹出通知（但提示音会响）

### 提示音不响？

- 检查浏览器是否允许页面播放音频（地址栏左侧的锁图标 → 网站设置）
- Web Audio API 在 iOS Safari 上需要用户交互后才能激活（点击按钮即可）

### Wake Lock 不工作？

- Wake Lock API 仅在 HTTPS 环境下可用
- 部分旧浏览器不支持（查看 [Can I Use](https://caniuse.com/mdn-api_wakelock)）
- 浏览器可能会在省电模式下自动释放锁

### 部署后刷新页面 404？

这是因为 SPA 路由需要服务端配置。Netlify 会自动处理，但如果部署在其他平台，需要添加重写规则将所有路径指向 `index.html`。

### 修改了代码但页面没变化？

- 确认开发服务器正在运行（`npm run dev`）
- Vite HMR 应该自动刷新，偶尔需要手动刷新浏览器
- 检查浏览器控制台是否有错误

---

## 🗺 开发路线

### 已完成
- [x] 基本计时功能
- [x] 像素网格可视化
- [x] 全屏 + 常亮
- [x] 提示音 + 通知
- [x] 登录 + 云端同步（单行 JSONB）
- [x] 忘记密码

### 可能后续

以下功能按需求度排序，不确定是否会实现：

- [ ] 快捷键支持（空格暂停/继续，Esc 退出全屏）
- [ ] 键盘快捷键说明面板
- [ ] 自定义背景色 / 方块颜色
- [ ] 番茄钟模式（25分钟工作 + 5分钟休息循环）
- [ ] 每日 / 每周统计图表
- [ ] PWA 离线支持（Service Worker 缓存）
- [ ] 多语言（中 / 英文切换）
- [ ] 移动端触感反馈（Vibration API）

---

## 📄 许可

MIT
