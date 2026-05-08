# 🧩 方块时间 / Pixel Fill Timer

像素方块逐渐填满屏幕，可视化你的专注。

一个沉浸式专注计时器——不再是冰冷的数字倒计时，整个屏幕就是你的进度条。

---
在线体验：https://filltime.pages.dev/

## ✨ 特色

- **像素网格填充** — 屏幕铺满 28×28 方块，时间流逝，方块一块块亮起
- **4 种主题** — 🧩 暖橙（从下到上）· 🌊 海浪（波浪升起）· 🌿 森林（随机蔓延）· 🌌 星空（随机点亮）
- **白噪音** — 雨声、溪流、篝火、咖啡馆，程序化生成无需音频文件
- **完成仪式** — 计时结束，像素烟花绽放
- **专注统计** — 今日 / 本周 / 历史，数据存 IndexedDB，支持导出备份
- **PWA** — 安装到桌面，离线可用
- **悬浮窗** — 后台时弹出迷你计时器（Chrome 116+）
- **本地优先** — 无需登录即可使用，登录后可选同步到 Supabase
- **禁止搜索引擎收录** — robots.txt + noindex，私人工具不暴露给爬虫

---

## 🖼 截图

```
┌──────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  │  ← 方块逐渐填满
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ┌─────────────────────────┐     │
│  │    方 块 时 间           │     │
│  │      3:24               │     │
│  │  🧩 🌊 🌿 🌌  主题切换   │     │
│  │  ▶ 开始填充             │     │
│  └─────────────────────────┘     │
└──────────────────────────────────┘
```

---

## 🛠 技术栈

| 技术 | 用途 |
|---|---|
| React 19 | UI |
| Vite 8 | 构建 |
| Tailwind CSS v4 | 样式 + 设计令牌 |
| Zustand 5 | 状态管理 + localStorage 持久化 |
| IndexedDB | 详细会话记录存储 |
| motion | 过渡动画 |
| Web Audio API | 白噪音 + 提示音（程序化生成） |
| Supabase | 可选的云端认证 + 数据同步（单行 JSONB） |
| Service Worker | PWA 离线缓存 |

---

## 🚀 快速开始

```bash
git clone https://github.com/你的用户名/pixel-fill.git
cd pixel-fill
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可。

### 云端同步（可选）

不配置 Supabase 也完全能用，数据存在本地。要开启云端同步：

1. 在 `.env` 中填入 Supabase 凭证：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

2. 在 Supabase SQL Editor 执行建表：

```sql
CREATE TABLE public.user_records_json (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  records JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

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

#### 数据同步策略

每个用户在云端只有 **1 行数据**，`records` 列是 JSONB 数组，每次专注完成后追加一条记录：

```json
{ "id": "uuid", "duration": 5, "completedAt": "2026-05-06T12:00:00.000Z", "theme": "warm" }
```

- 登录时以 `id` 去重合并本地和云端
- 每次计时结束自动 upsert 整行到云端
- 离线时数据存在本地，联网后自动合并

### 生产构建

```bash
npm run build    # 输出到 dist/
```

将 `dist/` 文件夹上传到任意静态托管即可（Netlify / Vercel / GitHub Pages / Cloudflare Pages）。

> SPA 路由需要配置所有路径指向 `index.html`。Netlify 自动处理，其他平台需添加重写规则。

---

## 📁 项目结构

```
src/
├── main.jsx                    # 入口：主题恢复 + SW 注册
├── App.jsx                     # 路由 + 懒加载
├── store.js                    # Zustand 全局状态（records 数组 + 云端同步）
├── index.css                   # 设计令牌 + 像素风格 + 主题动画
│
├── lib/
│   ├── supabase.js             # Supabase 客户端（缺凭证时优雅降级）
│   ├── themes.js               # 4 主题 CSS 变量定义 + 切换函数
│   ├── noise.js                # Web Audio 白噪音生成器（4 种音效）
│   ├── db.js                   # IndexedDB 存储层（会话 CRUD + 导入导出）
│   └── fillPattern.js          # 主题差异化填充模式（从下到上/蔓延/随机）
│
├── hooks/
│   └── usePiPTimer.js          # Document PiP 悬浮窗
│
├── components/
│   ├── ThemeSelector.jsx        # 主题选择器
│   ├── NoiseSelector.jsx        # 白噪音选择器 + 音量滑块
│   ├── StatsPanel.jsx           # 统计面板（今日/本周/历史 + 数据备份）
│   ├── FireworksCanvas.jsx      # 像素烟花 Canvas 覆盖层
│   ├── ToggleSwitch.jsx         # 开关组件（无障碍）
│   └── ErrorBoundary.jsx        # React 错误边界
│
└── pages/
    ├── PixelFillPage.jsx        # 主页面
    └── LoginPage.jsx            # 登录 / 注册 / 重置密码
```

---

## 🎨 主题

| 主题 | 色调 | 填充方式 | 动画 |
|---|---|---|---|
| 🧩 暖橙 | 橙色暖调 | 从底部逐行填满 | 缩放淡入 |
| 🌊 海浪 | 蓝色海洋 | 从底部波浪升起 | 上浮弹入 |
| 🌿 森林 | 绿色植物 | 底部种子随机蔓延 | 生长弹出 |
| 🌌 星空 | 深色背景 + 金色 | 随机位置点亮 | 闪烁亮起 |

所有主题通过 CSS 自定义属性切换，运行时零延迟。

---

## 🔒 隐私与安全

- **不上传个人身份信息**（仅邮箱用于登录认证）
- **不追踪、不分析、不收集使用数据**
- **禁止搜索引擎收录**（robots.txt + noindex meta）
- **RLS 策略**确保用户只能访问自己的数据
- **Anon key 可公开**（受 RLS 保护），Service key 绝不放前端

---

## 🗺 开发路线

**V1 — 基础版**
- [x] 基本计时功能
- [x] 像素网格可视化
- [x] 全屏 + 常亮
- [x] 提示音 + 通知
- [x] 登录 + 云端同步
- [x] 忘记密码

**V1.1 — Phase 1**
- [x] PWA 离线支持（manifest.json + Service Worker）
- [x] 4 种填充主题（暖橙 / 海洋 / 森林 / 星夜）
- [x] 白噪音（雨声 / 溪流 / 篝火 / 咖啡厅）

**V1.2 — Phase 2**
- [x] 统计面板（每日 / 每周统计图表）
- [x] 数据备份 / 恢复
- [x] 完成庆祝烟花（像素风格）

**V1.3 — Phase 3**
- [x] 移动端适配
- [x] 代码分割（React.lazy 懒加载）

**V2 — 数据架构升级**
- [x] 数据库改为单行 JSONB 存储（user_records_json）
- [x] 每次专注生成详细记录（id + duration + completedAt + theme）
- [x] 禁止搜索引擎收录（robots.txt + noindex）
- [x] PiP 悬浮窗（Document Picture-in-Picture API）

### 可能后续

- [ ] 快捷键支持（空格暂停/继续，Esc 退出全屏）
- [ ] 番茄钟模式（25分钟工作 + 5分钟休息循环）
- [ ] 多语言（中 / 英文切换）
- [ ] 移动端触感反馈（Vibration API）

---

## 📄 许可

Unlicense
