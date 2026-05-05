/**
 * Web Audio API 白噪音生成器
 * 4种环境音：雨声、溪流、篝火、咖啡馆
 * 程序化生成 AudioBuffer，循环播放
 */

const NOISE_TYPES = {
  rain: { label: '雨声', icon: 'water_drop' },
  stream: { label: '溪流', icon: 'water' },
  fire: { label: '篝火', icon: 'local_fire_department' },
  cafe: { label: '咖啡馆', icon: 'coffee' },
}

export { NOISE_TYPES }

/**
 * 生成白噪音 buffer
 */
function generateWhiteNoise(ctx, duration) {
  const length = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
  }
  return buffer
}

/**
 * 生成棕噪音 buffer（低频更强，更柔和）
 */
function generateBrownNoise(ctx, duration) {
  const length = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (last + 0.02 * white) / 1.02
      last = data[i]
      data[i] *= 3.5
    }
  }
  return buffer
}

/**
 * 生成粉噪音 buffer
 */
function generatePinkNoise(ctx, duration) {
  const length = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
  return buffer
}

/**
 * 为每种音效生成处理后的 buffer
 */
function generateSoundBuffer(ctx, type) {
  const duration = 4 // 4秒循环
  let sourceBuffer

  switch (type) {
    case 'rain': {
      // 白噪音 + 低通滤波 = 雨声
      sourceBuffer = generateWhiteNoise(ctx, duration)
      const offline = new OfflineAudioContext(2, ctx.sampleRate * duration, ctx.sampleRate)
      const src = offline.createBufferSource()
      src.buffer = sourceBuffer
      const filter = offline.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 4000
      filter.Q.value = 0.5
      const gain = offline.createGain()
      gain.gain.value = 0.6
      src.connect(filter).connect(gain).connect(offline.destination)
      src.start()
      return offline.startRendering()
    }
    case 'stream': {
      // 棕噪音 + 带通滤波 + 调制 = 溪流
      sourceBuffer = generateBrownNoise(ctx, duration)
      const offline = new OfflineAudioContext(2, ctx.sampleRate * duration, ctx.sampleRate)
      const src = offline.createBufferSource()
      src.buffer = sourceBuffer
      const bp = offline.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 800
      bp.Q.value = 0.8
      // 高频细节
      const hp = offline.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 200
      const gain = offline.createGain()
      gain.gain.value = 0.45
      src.connect(bp).connect(hp).connect(gain).connect(offline.destination)
      src.start()
      return offline.startRendering()
    }
    case 'fire': {
      // 棕噪音 + 低通 + 幅度调制 = 篝火噼啪
      sourceBuffer = generateBrownNoise(ctx, duration)
      const offline = new OfflineAudioContext(2, ctx.sampleRate * duration, ctx.sampleRate)
      const src = offline.createBufferSource()
      src.buffer = sourceBuffer
      const lp = offline.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 600
      // 幅度调制 - 模拟噼啪
      const modGain = offline.createGain()
      modGain.gain.value = 0.5
      const lfo = offline.createOscillator()
      lfo.frequency.value = 3
      const lfoGain = offline.createGain()
      lfoGain.gain.value = 0.3
      lfo.connect(lfoGain).connect(modGain.gain)
      lfo.start()
      const outGain = offline.createGain()
      outGain.gain.value = 0.55
      src.connect(lp).connect(modGain).connect(outGain).connect(offline.destination)
      src.start()
      return offline.startRendering()
    }
    case 'cafe': {
      // 粉噪音 + 低通 = 咖啡馆底噪
      sourceBuffer = generatePinkNoise(ctx, duration)
      const offline = new OfflineAudioContext(2, ctx.sampleRate * duration, ctx.sampleRate)
      const src = offline.createBufferSource()
      src.buffer = sourceBuffer
      const lp = offline.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 2000
      const gain = offline.createGain()
      gain.gain.value = 0.35
      src.connect(lp).connect(gain).connect(offline.destination)
      src.start()
      return offline.startRendering()
    }
    default:
      return null
  }
}

/**
 * 白噪音播放器类
 */
export class NoisePlayer {
  constructor() {
    this.ctx = null
    this.source = null
    this.gainNode = null
    this.currentType = null
    this.buffers = {}
    this.volume = 0.5
  }

  async _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  async _getBuffer(type) {
    if (!this.buffers[type]) {
      await this._ensureContext()
      this.buffers[type] = await generateSoundBuffer(this.ctx, type)
    }
    return this.buffers[type]
  }

  async play(type) {
    // 同一种音效已经在播放 → 忽略
    if (this.currentType === type && this.source) return

    // 先停掉当前播放
    this.stop()

    await this._ensureContext()
    const buffer = await this._getBuffer(type)
    if (!buffer) return

    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = 0 // 从0开始淡入
    this.gainNode.connect(this.ctx.destination)

    this.source = this.ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = true
    this.source.connect(this.gainNode)
    this.source.start()

    // 淡入
    this.gainNode.gain.linearRampToValueAtTime(
      this.volume,
      this.ctx.currentTime + 0.5
    )

    this.currentType = type
  }

  stop() {
    if (this.source && this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3)
        this.source.stop(this.ctx.currentTime + 0.3)
      } catch {}
    }
    this.source = null
    this.gainNode = null
    this.currentType = null
  }

  setVolume(vol) {
    this.volume = vol
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1)
    }
  }

  // 计时结束时渐弱停止
  fadeOutAndStop(duration = 2) {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration)
        this.source?.stop(this.ctx.currentTime + duration)
      } catch {}
    }
    this.source = null
    this.gainNode = null
    this.currentType = null
  }
}
