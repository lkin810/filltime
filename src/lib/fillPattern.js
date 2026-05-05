/**
 * 像素填充模式：不同主题使用不同的填充顺序
 * - warm/ocean: 从下到上逐行填充
 * - forest: 随机生长（带聚集效应，模拟植物蔓延）
 * - starry: 随机位置点亮（模拟星星闪烁出现）
 */

/**
 * 简单的种子随机数生成器 (Mulberry32)
 * 保证相同种子产生相同序列，主题切换后填充顺序不变
 */
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 生成从下到上的填充顺序（暖橙 & 海浪主题）
 */
function bottomUpOrder(cols, rows) {
  const order = []
  // 从最后一行到第一行，每行从左到右
  for (let row = rows - 1; row >= 0; row--) {
    for (let col = 0; col < cols; col++) {
      order.push(row * cols + col)
    }
  }
  return order
}

/**
 * 生成随机生长的填充顺序（森林主题）
 * 从中心开始向外随机扩展，模拟植物蔓延
 */
function forestGrowthOrder(cols, rows, rng) {
  const total = cols * rows
  const centerRow = Math.floor(rows / 2)
  const centerCol = Math.floor(cols / 2)
  const centerIdx = centerRow * cols + centerCol

  // 从底部的几个"种子"位置开始
  const seeds = []
  const seedCount = Math.max(3, Math.floor(cols / 4))
  for (let i = 0; i < seedCount; i++) {
    const col = Math.floor(rng() * cols)
    const row = rows - 1 - Math.floor(rng() * 3) // 底部1-3行
    seeds.push(row * cols + col)
  }

  const visited = new Set()
  const order = []
  const frontier = [...seeds]

  while (order.length < total && frontier.length > 0) {
    // 随机选择一个前沿点
    const idx = Math.floor(rng() * frontier.length)
    const pos = frontier[idx]
    frontier.splice(idx, 1)

    if (visited.has(pos)) continue
    visited.add(pos)
    order.push(pos)

    // 添加相邻格子到前沿
    const row = Math.floor(pos / cols)
    const col = pos % cols
    const neighbors = [
      [row - 1, col], [row + 1, col],
      [row, col - 1], [row, col + 1],
    ]
    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const nIdx = nr * cols + nc
        if (!visited.has(nIdx)) {
          frontier.push(nIdx)
        }
      }
    }
  }

  // 添加任何遗漏的格子
  for (let i = 0; i < total; i++) {
    if (!visited.has(i)) {
      order.push(i)
    }
  }

  return order
}

/**
 * 生成随机位置的填充顺序（星空主题）
 * 像素随机散布点亮，模拟星星一颗颗出现
 */
function starryRandomOrder(cols, rows, rng) {
  const total = cols * rows
  const indices = Array.from({ length: total }, (_, i) => i)

  // Fisher-Yates 洗牌
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices
}

/**
 * 获取指定主题的填充顺序
 * @param {string} themeId - 主题 ID
 * @param {number} cols - 列数
 * @param {number} rows - 行数
 * @param {number} seed - 随机种子（默认用网格尺寸作为种子，保证同尺寸网格顺序一致）
 * @returns {number[]} 填充索引数组，顺序即为填充顺序
 */
export function getFillOrder(themeId, cols, rows, seed) {
  if (cols <= 0 || rows <= 0) return []

  const actualSeed = seed ?? (cols * 1000 + rows)
  const rng = mulberry32(actualSeed)

  switch (themeId) {
    case 'forest':
      return forestGrowthOrder(cols, rows, rng)
    case 'starry':
      return starryRandomOrder(cols, rows, rng)
    case 'warm':
    case 'ocean':
    default:
      return bottomUpOrder(cols, rows)
  }
}

/**
 * 根据填充顺序和进度判断某个像素是否已填充
 * @param {number} pixelIndex - 像素在网格中的位置 (0-based, 从左上角开始)
 * @param {number[]} fillOrder - 填充顺序数组
 * @param {number} filledCount - 已填充的像素数量
 * @returns {boolean}
 */
export function isPixelFilled(pixelIndex, fillOrder, filledCount) {
  // 对于 bottomUp 模式，直接用索引判断（O(1) 性能优化）
  if (fillOrder.length === 0) return false

  // 构建查找表：fillOrder[i] = pixelIndex → 填充优先级为 i
  // 优化：仅当 filledCount > 0 时才检查
  for (let i = 0; i < filledCount; i++) {
    if (fillOrder[i] === pixelIndex) return true
  }
  return false
}

/**
 * 创建填充查找集合（用于 O(1) 查找）
 * 返回一个 Set，包含当前所有应被填充的像素索引
 */
export function getFilledSet(fillOrder, filledCount) {
  const set = new Set()
  for (let i = 0; i < Math.min(filledCount, fillOrder.length); i++) {
    set.add(fillOrder[i])
  }
  return set
}
