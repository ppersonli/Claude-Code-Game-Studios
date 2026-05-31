export interface Equipment {
  id: string
  name: string
  emoji: string
  baseCost: number
  costMult: number
  speedBonus: number
  maxLevel: number
}

export const EQUIPMENT: readonly Equipment[] = [
  { id: 'shaker', name: '摇杯机', emoji: '🥤', baseCost: 15, costMult: 1.5, speedBonus: 0.1, maxLevel: 100 },
  { id: 'brewer', name: '泡茶机', emoji: '🫖', baseCost: 150, costMult: 1.6, speedBonus: 0.15, maxLevel: 100 },
  { id: 'sealer', name: '封口机', emoji: '🔧', baseCost: 1500, costMult: 1.7, speedBonus: 0.2, maxLevel: 100 },
  { id: 'fridge', name: '冷藏柜', emoji: '🧊', baseCost: 15000, costMult: 1.8, speedBonus: 0.25, maxLevel: 100 },
  { id: 'robot-arm', name: '机械臂', emoji: '🤖', baseCost: 150000, costMult: 2.0, speedBonus: 0.5, maxLevel: 100 },
  { id: 'ai-brain', name: 'AI大脑', emoji: '🧠', baseCost: 1500000, costMult: 2.2, speedBonus: 1.0, maxLevel: 100 },
] as const

export function getEquipmentCost(eq: Equipment, level: number): number {
  return Math.floor(eq.baseCost * Math.pow(eq.costMult, level))
}

export function getEquipmentMultiplier(levels: Record<string, number>): number {
  let mult = 1
  for (const eq of EQUIPMENT) {
    mult += (levels[eq.id] || 0) * eq.speedBonus
  }
  return mult
}
