import { NOISE_TYPES } from '../lib/noise'

const NOISE_LIST = Object.entries(NOISE_TYPES).map(([id, info]) => ({ id, ...info }))

/**
 * 白噪音选择器：4个图标按钮
 */
export default function NoiseSelector({ activeNoise, onToggle, volume, onVolumeChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[11px] font-bold text-muted-text tracking-[0.08em]">
          环境音
        </span>
        {NOISE_LIST.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={`w-8 h-8 flex items-center justify-center border-2 rounded-sm transition-all text-sm ${
              activeNoise === id
                ? 'border-o bg-o5 text-o'
                : 'border-border-main bg-surface text-muted-text hover:text-ink hover:bg-o5'
            }`}
            style={{
              boxShadow: activeNoise === id ? '2px 2px 0 var(--color-o3)' : 'none',
            }}
            title={label}
            aria-label={`${activeNoise === id ? '关闭' : '播放'}${label}`}
          >
            <span className="material-symbols-outlined text-base">{icon}</span>
          </button>
        ))}
      </div>
      {activeNoise && (
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm text-muted-text">volume_down</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1 accent-o cursor-pointer"
            aria-label="音量"
          />
          <span className="material-symbols-outlined text-sm text-muted-text">volume_up</span>
        </div>
      )}
    </div>
  )
}
