import { useStore } from '../store'
import { THEMES } from '../lib/themes'

const THEME_LIST = Object.values(THEMES)

/**
 * 主题选择器：4个小色块，点击切换
 */
export default function ThemeSelector() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-[11px] font-bold text-muted-text tracking-[0.08em]">
        主题
      </span>
      {THEME_LIST.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className="pixel-button-link"
          title={t.label}
          aria-label={`切换到${t.label}主题`}
        >
          <div
            className={`w-7 h-7 border-2 rounded-sm transition-all flex items-center justify-center text-sm ${
              theme === t.id
                ? 'border-ink scale-110 shadow-sm'
                : 'border-border-main opacity-60 hover:opacity-100 hover:scale-105'
            }`}
            style={{
              backgroundColor: t['--color-o'],
              boxShadow: theme === t.id ? `2px 2px 0 ${t['--color-o3']}` : 'none',
            }}
          >
            {t.icon}
          </div>
        </button>
      ))}
    </div>
  )
}
