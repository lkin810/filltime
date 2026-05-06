/**
 * 主题定义：每个主题覆盖所有 CSS 自定义属性
 * 切换时通过 document.documentElement.style.setProperty 应用
 */

export const THEMES = {
  warm: {
    id: 'warm',
    label: '暖橙',
    icon: '🧩',
    // 主色调
    '--color-o': '#e07840',
    '--color-o2': '#d46830',
    '--color-o3': '#c05828',
    '--color-o4': '#f0a070',
    '--color-o5': '#fff0e8',
    // 辅助色
    '--color-lav': '#b088c0',
    '--color-l2': '#d0b0e0',
    '--color-l3': '#f0e8f8',
    '--color-sage': '#70a080',
    '--color-s2': '#90c0a0',
    '--color-s3': '#e8f4ec',
    // 墨色
    '--color-ink': '#2c2416',
    '--color-ink-core': '#1a1510',
    '--color-i2': '#4a3f2e',
    '--color-i3': '#7a6f5a',
    // 背景色
    '--color-bg': '#fcf7f0',
    '--color-bg2': '#f5eee4',
    '--color-surface': '#ffffff',
    '--color-warm-paper': '#ede0d0',
    '--color-soft-apricot': '#fde8d0',
    '--color-paper-mist': '#f8f0e8',
    // 边框 / 文字
    '--color-border-main': '#d4c8b8',
    '--color-muted-text': '#9a8a78',
    '--color-primary': '#e07840',
    // 网格线
    '--color-grid-line': 'rgba(212, 200, 184, 0.3)',
    // 像素空格边框
    '--color-pixel-empty-border': 'rgba(212, 200, 184, 0.2)',
    // 动画类
    pixelAnimation: 'pixel-fade-in',
  },

  ocean: {
    id: 'ocean',
    label: '海浪',
    icon: '🌊',
    '--color-o': '#4080c0',
    '--color-o2': '#3070b0',
    '--color-o3': '#2858a0',
    '--color-o4': '#80b0e0',
    '--color-o5': '#e8f0fa',
    '--color-lav': '#6080c0',
    '--color-l2': '#90b0e0',
    '--color-l3': '#d8e8f8',
    '--color-sage': '#5090b0',
    '--color-s2': '#70b0d0',
    '--color-s3': '#d8f0f8',
    '--color-ink': '#1a2a3a',
    '--color-ink-core': '#0f1a28',
    '--color-i2': '#3a4a5a',
    '--color-i3': '#6a7a8a',
    '--color-bg': '#f0f4f8',
    '--color-bg2': '#e0e8f0',
    '--color-surface': '#ffffff',
    '--color-warm-paper': '#e0ecf4',
    '--color-soft-apricot': '#d0e0f0',
    '--color-paper-mist': '#e0ecf4',
    '--color-border-main': '#b0c0d0',
    '--color-muted-text': '#7a8a9a',
    '--color-primary': '#4080c0',
    '--color-grid-line': 'rgba(160, 180, 210, 0.3)',
    '--color-pixel-empty-border': 'rgba(160, 180, 210, 0.2)',
    pixelAnimation: 'pixel-wave-in',
  },

  forest: {
    id: 'forest',
    label: '森林',
    icon: '🌿',
    '--color-o': '#50a060',
    '--color-o2': '#409050',
    '--color-o3': '#308040',
    '--color-o4': '#80c090',
    '--color-o5': '#e8f8ec',
    '--color-lav': '#609060',
    '--color-l2': '#90c090',
    '--color-l3': '#d8f0d8',
    '--color-sage': '#40a060',
    '--color-s2': '#60c080',
    '--color-s3': '#d0f0d8',
    '--color-ink': '#1a2a1a',
    '--color-ink-core': '#0f1a0f',
    '--color-i2': '#3a4a3a',
    '--color-i3': '#6a7a6a',
    '--color-bg': '#f0f5f0',
    '--color-bg2': '#e0ece0',
    '--color-surface': '#ffffff',
    '--color-warm-paper': '#dce8dc',
    '--color-soft-apricot': '#c8e0c8',
    '--color-paper-mist': '#dce8dc',
    '--color-border-main': '#b0c8b0',
    '--color-muted-text': '#7a8a7a',
    '--color-primary': '#50a060',
    '--color-grid-line': 'rgba(160, 200, 170, 0.3)',
    '--color-pixel-empty-border': 'rgba(160, 200, 170, 0.2)',
    pixelAnimation: 'pixel-grow-in',
  },

  starry: {
    id: 'starry',
    label: '星空',
    icon: '🌌',
    '--color-o': '#f0e68c',
    '--color-o2': '#e0d67c',
    '--color-o3': '#5050a0',
    '--color-o4': '#f8f0a0',
    '--color-o5': '#2a2a4a',
    '--color-lav': '#8080c0',
    '--color-l2': '#a0a0d0',
    '--color-l3': '#2a2a4a',
    '--color-sage': '#f0e68c',
    '--color-s2': '#f8f0a0',
    '--color-s3': '#2a2a4a',
    '--color-ink': '#e0e0f0',
    '--color-ink-core': '#f0f0ff',
    '--color-i2': '#a0a0c0',
    '--color-i3': '#707090',
    '--color-bg': '#1a1a2e',
    '--color-bg2': '#252540',
    '--color-surface': '#252540',
    '--color-warm-paper': '#202038',
    '--color-soft-apricot': '#2a2a4a',
    '--color-paper-mist': '#202038',
    '--color-border-main': '#404060',
    '--color-muted-text': '#8080a0',
    '--color-primary': '#f0e68c',
    '--color-grid-line': 'rgba(80, 80, 120, 0.25)',
    '--color-pixel-empty-border': 'rgba(80, 80, 120, 0.15)',
    pixelAnimation: 'pixel-twinkle-in',
  },
}

/**
 * 应用主题到 DOM
 */
export function applyTheme(themeId) {
  const theme = THEMES[themeId]
  if (!theme) return

  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    if (key.startsWith('--')) {
      root.style.setProperty(key, value)
    }
  })
}

/**
 * 重置主题（清除所有内联样式，恢复 CSS 默认值）
 */
export function resetTheme() {
  const root = document.documentElement
  Object.keys(THEMES.warm).forEach((key) => {
    if (key.startsWith('--')) {
      root.style.removeProperty(key)
    }
  })
}
