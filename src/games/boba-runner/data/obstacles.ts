export interface ObstacleDef {
  id: string
  name: string
  emoji: string
  width: number
  height: number
  yOffset: number // 0 = ground, negative = airborne
  color: number
}

export const OBSTACLES: readonly ObstacleDef[] = [
  { id: 'spilled-tea', name: '洒出的茶', emoji: '🍵', width: 50, height: 30, yOffset: 0, color: 0x8B4513 },
  { id: 'fallen-cup', name: '倒下的杯子', emoji: '🥤', width: 35, height: 50, yOffset: 0, color: 0xFFFFFF },
  { id: 'puddle', name: '水坑', emoji: '💧', width: 70, height: 15, yOffset: 0, color: 0x4488CC },
  { id: 'box', name: '纸箱', emoji: '📦', width: 55, height: 55, yOffset: 0, color: 0xCC8833 },
  { id: 'low-pipe', name: '低管', emoji: '🔧', width: 60, height: 40, yOffset: -60, color: 0x888888 },
] as const

export function getObstacleById(id: string): ObstacleDef {
  const o = OBSTACLES.find(ob => ob.id === id)
  if (!o) throw new Error(`Obstacle not found: ${id}`)
  return o
}
