# 🧩 方块时间 / Pixel Fill Timer

像素方块逐渐填满屏幕，可视化你的专注。

一个沉浸式专注计时器——不再是冰冷的数字倒计时，整个屏幕就是你的进度条。

---

## ✨ 特色

- **像素网格填充** — 屏幕铺满 28×28 方块，时间流逝，方块一块块亮起
- **4 种主题** — 🧩 暖橙（从下到上）· 🌊 海浪（波浪升起）· 🌿 森林（随机蔓延）· 🌌 星空（随机点亮）
- **白噪音** — 雨声、溪流、篝火、咖啡馆，程序化生成无需音频文件
- **完成仪式** — 计时结束，像素烟花绽放
- **专注统计** — 今日 / 本周 / 历史，数据存 IndexedDB，支持导出备份
- **PWA** — 安装到桌面，离线可用
- **悬浮窗** — 后台时弹出迷你计时器（Chrome 116+）
- **本地优先** — 无需登录即可使用，登录后可选同步到 Supabase

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
| Supabase | 可选的云端认证 + 数据同步 |
| Service Worker | PWA 离线缓存 |

---

## 🚀 快速开始

```bash
git clone https://github.com/lkin810/filltime.git
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
CREATE TABLE public.user_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  total_minutes INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE user_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own" ON user_totals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own" ON user_totals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own" ON user_totals FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON public.user_totals TO authenticated;
```

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
├── store.js                    # Zustand 全局状态
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

## 📄 许可

MIT
