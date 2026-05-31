export interface Equipment {
  id: string
  name: string
  emoji: string
  baseCost: number
  costMultiplier: number
  speedBonus: number // per level multiplier addition (e.g., 0.1 = +10% per level)
  maxLevel: number
}

export const EQUIPMENT: readonly Equipment[] = [
  { id: 'shaker', name: '摇杯机', emoji: '🥤', baseCost: 10, costMultiplier: 1.5, speedBonus: 0.1, maxLevel: 50 },
  { id: 'brewer', name: '泡茶机', emoji: '🫖', baseCost: 100, costMultiplier: 1.6, speedBonus: 0.15, maxLevel: 50 },
  { id: 'sealer', name: '封口机', emoji: '🔧', baseCost: 1000, costMultiplier: 1.7, speedBonus: 0.2, maxLevel: 50 },
  { id: 'fridge', name: '冷藏柜', emoji: '🧊', baseCost: 10000, costMultiplier: 1.8, speedBonus: 0.25, maxLevel: 50 },
  { id: 'robot', name: '机械臂', emoji: '🤖', baseCost: 100000, costMultiplier: 2.0, speedBonus: 0.5, maxLevel: 50 },
] as const

export function getEquipmentCost(eq: Equipment, currentLevel: number): number {
  return Math.floor(eq.baseCost * Math.pow(eq.costMultiplier, currentLevel))
}

export function getEquipmentMultiplier(levels: Record<string, number>): number {
  let mult = 1
  for (const eq of EQUIPMENT) {
    const lvl = levels[eq.id] || 0
    mult += lvl * eq.speedBonus
  }
  return mult
}
