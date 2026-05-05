import { useEffect, useRef, useCallback } from 'react'

/**
 * 像素烟花 Canvas 覆盖层
 * 计时完成时播放像素风格的方块爆炸效果
 */
export default function FireworksCanvas({ themeColor, secondaryColor, accentColor, onDone }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  const DURATION = 4000 // 4秒动画

  // 像素粒子类
  class PixelParticle {
    constructor(x, y, color, size) {
      this.x = x
      this.y = y
      this.color = color
      this.size = size
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 5
      this.vx = Math.cos(angle) * speed
      this.vy = Math.sin(angle) * speed - 2
      this.gravity = 0.08
      this.life = 1
      this.decay = 0.008 + Math.random() * 0.015
      this.rotation = Math.random() * 360
      this.rotSpeed = (Math.random() - 0.5) * 10
    }

    update() {
      this.vy += this.gravity
      this.x += this.vx
      this.y += this.vy
      this.vx *= 0.99
      this.life -= this.decay
      this.rotation += this.rotSpeed
    }

    draw(ctx) {
      if (this.life <= 0) return
      ctx.save()
      ctx.globalAlpha = Math.max(0, this.life)
      ctx.translate(this.x, this.y)
      ctx.rotate((this.rotation * Math.PI) / 180)
      ctx.fillStyle = this.color
      // 像素风格：画方块而非圆形
      const half = this.size / 2
      ctx.fillRect(-half, -half, this.size, this.size)
      ctx.restore()
    }
  }

  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'

    const colors = [
      themeColor || '#e07840',
      secondaryColor || '#f0a070',
      accentColor || '#b088c0',
      '#f0e68c',
      '#ffffff',
    ]

    const particles = []
    const startTime = Date.now()

    // 创建一次爆发
    function burst(x, y, count) {
      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = 3 + Math.random() * 5
        particles.push(new PixelParticle(x, y, color, size))
      }
    }

    // 初始爆发 - 中心
    burst(canvas.width / dpr / 2, canvas.height / dpr / 2, 60)

    // 延迟的二次爆发
    setTimeout(() => {
      burst(canvas.width / dpr * 0.3, canvas.height / dpr * 0.4, 35)
      burst(canvas.width / dpr * 0.7, canvas.height / dpr * 0.4, 35)
    }, 500)

    setTimeout(() => {
      burst(canvas.width / dpr * 0.5, canvas.height / dpr * 0.3, 40)
      burst(canvas.width / dpr * 0.2, canvas.height / dpr * 0.6, 25)
      burst(canvas.width / dpr * 0.8, canvas.height / dpr * 0.6, 25)
    }, 1200)

    function animate() {
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

      // 更新和绘制粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update()
        particles[i].draw(ctx)
        if (particles[i].life <= 0) {
          particles.splice(i, 1)
        }
      }

      // 全局淡出
      if (elapsed > DURATION - 1000) {
        const fadeProgress = (elapsed - (DURATION - 1000)) / 1000
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.5, fadeProgress * 0.5)})`
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      }

      if (elapsed < DURATION) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        // 动画结束
        onDone?.()
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [themeColor, secondaryColor, accentColor, onDone])

  useEffect(() => {
    startAnimation()
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [startAnimation])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
