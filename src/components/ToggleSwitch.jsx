import { useCallback, useRef } from 'react'

/**
 * 可复用的 Toggle 开关组件
 * - 包含完整的无障碍支持（role="switch", aria-checked, 键盘操作）
 */
export default function ToggleSwitch({ checked, onChange, label }) {
  const inputRef = useRef(null)

  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
  }, [checked, onChange])

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        ref={inputRef}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={0}
        className="relative w-9 h-5 rounded-full border-2 border-border-main transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-o"
        style={{ backgroundColor: checked ? 'var(--color-o)' : 'var(--color-bg2)' }}
        onClick={() => onChange(!checked)}
        onKeyDown={handleKeyDown}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white border border-border-main transition-all"
          style={{ left: checked ? '18px' : '3px' }}
        />
      </div>
      <span className="text-[10px] font-bold text-muted-text">{label}</span>
    </label>
  )
}
